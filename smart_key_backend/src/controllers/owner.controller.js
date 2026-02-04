const exe = require("../config/db");

// helper
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

// ✅ GET /api/owner/units
exports.getMyUnits = async (req, res, next) => {
  try {
    const rows = await exe(
      `SELECT u.id, u.org_id, o.name AS org_name, u.owner_id, u.unit_name, u.status
       FROM units u
       JOIN organizations o ON o.id = u.org_id
       WHERE u.owner_id = ?
       ORDER BY u.id DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// ✅ GET /api/owner/keys  (includes office/unit name)
exports.getMyKeys = async (req, res, next) => {
  try {
    const rows = await exe(
      `SELECT k.id, k.key_code, k.key_type, k.locker_no, k.status, k.created_at,
              u.id AS unit_id, u.unit_name, o.id AS org_id, o.name AS org_name
       FROM keyss k
       JOIN units u ON u.id = k.unit_id
       JOIN organizations o ON o.id = u.org_id
       WHERE u.owner_id = ?
       ORDER BY k.id DESC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// ✅ GET /api/owner/notifications
exports.getMyNotifications = async (req, res, next) => {
  try {
    const rows = await exe(
      `SELECT id, title, message, channel, sent_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 200`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// ✅ POST /api/owner/setup-requests
// Body: { org_name, org_address, unit_name, key_code?, key_type?, locker_no? }
exports.createSetupRequest = async (req, res, next) => {
  try {
    const { org_name, org_address, unit_name, key_code, key_type, locker_no } = req.body;

    if (!org_name || !unit_name) {
      return res.status(400).json({
        success: false,
        message: "org_name and unit_name are required",
      });
    }

    const orgName = org_name.trim();
    const unitName = unit_name.trim();
    const keyCode = key_code?.trim() || null;

    // prevent duplicate pending request from same owner (same org/unit)
    const dup = await exe(
      `SELECT id FROM setup_requests
       WHERE requested_by = ? AND org_name = ? AND unit_name = ? AND status = 'PENDING'`,
      [req.user.id, orgName, unitName]
    );

    if (dup.length) {
      return res.status(400).json({
        success: false,
        message: "You already have a PENDING request for this org/unit",
      });
    }

    const result = await exe(
      `INSERT INTO setup_requests (requested_by, org_name, org_address, unit_name, key_code, key_type, locker_no)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        orgName,
        org_address?.trim() || null,
        unitName,
        keyCode,
        key_type || "MAIN",
        locker_no?.trim() || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Setup request created",
      data: {
        id: result.insertId,
        org_name: orgName,
        org_address: org_address?.trim() || null,
        unit_name: unitName,
        key_code: keyCode,
        key_type: key_type || "MAIN",
        locker_no: locker_no?.trim() || null,
        status: "PENDING",
      },
    });
  } catch (err) {
    next(err);
  }
};

// ✅ GET /api/owner/setup-requests
exports.listMySetupRequests = async (req, res, next) => {
  try {
    const rows = await exe(
      `SELECT sr.id, sr.org_name, sr.org_address, sr.unit_name,
              sr.status, sr.note, sr.created_at,
              sr.approved_by, au.name AS approved_by_name
       FROM setup_requests sr
       LEFT JOIN users au ON au.id = sr.approved_by
       WHERE sr.requested_by = ?
       ORDER BY sr.id DESC`,
      [req.user.id]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};


// ✅ POST /api/owner/key-setup-requests
exports.createKeySetupRequest = async (req, res, next) => {
  try {
    const { unit_id, key_code, key_type, locker_no } = req.body;

    if (!unit_id || !key_code) {
      return res.status(400).json({ success: false, message: "unit_id and key_code are required" });
    }

    // unit must belong to this owner
    const unit = await exe(`SELECT id FROM units WHERE id = ? AND owner_id = ?`, [unit_id, req.user.id]);
    if (!unit.length) {
      return res.status(403).json({ success: false, message: "This unit is not yours" });
    }

    // prevent duplicates pending
    const dup = await exe(
      `SELECT id FROM key_setup_requests
       WHERE requested_by=? AND unit_id=? AND key_code=? AND status='PENDING'`,
      [req.user.id, unit_id, key_code.trim()]
    );
    if (dup.length) {
      return res.status(400).json({ success: false, message: "Already requested (PENDING)" });
    }

    const result = await exe(
      `INSERT INTO key_setup_requests (requested_by, unit_id, key_code, key_type, locker_no)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, unit_id, key_code.trim(), key_type || "MAIN", locker_no || null]
    );

    return res.status(201).json({
      success: true,
      message: "Key setup request created",
      data: { id: result.insertId }
    });
  } catch (err) {
    next(err);
  }
};

// ✅ GET /api/owner/key-setup-requests
exports.listMyKeySetupRequests = async (req, res, next) => {
  try {
    const rows = await exe(
      `SELECT ksr.id, ksr.unit_id, u.unit_name, o.name AS org_name,
              ksr.key_code, ksr.key_type, ksr.locker_no,
              ksr.status, ksr.note, ksr.created_at
       FROM key_setup_requests ksr
       JOIN units u ON u.id = ksr.unit_id
       JOIN organizations o ON o.id = u.org_id
       WHERE ksr.requested_by = ?
       ORDER BY ksr.id DESC`,
      [req.user.id]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};


// ✅ POST /api/owner/requests
// Body: { unit_id }  (auto picks AVAILABLE key)
// OR:   { key_id }   (manual)
exports.createKeyRequest = async (req, res, next) => {
  try {
    const { unit_id, key_id } = req.body;

    if (!unit_id && !key_id) {
      return res.status(400).json({ success: false, message: "unit_id or key_id is required" });
    }

    let pickedKey = null;

    // 1) If key_id given, validate key belongs to this owner
    if (key_id) {
      const rows = await exe(
        `SELECT k.id, k.key_code, k.status, u.owner_id
         FROM keyss k
         JOIN units u ON u.id = k.unit_id
         WHERE k.id = ? LIMIT 1`,
        [Number(key_id)]
      );

      if (!rows.length) return res.status(400).json({ success: false, message: "Invalid key_id" });

      pickedKey = rows[0];

      if (Number(pickedKey.owner_id) !== Number(req.user.id)) {
        return res.status(403).json({ success: false, message: "This key is not in your unit" });
      }

      if (pickedKey.status !== "AVAILABLE") {
        return res.status(400).json({ success: false, message: "Key is not AVAILABLE" });
      }
    }

    // 2) If unit_id given, auto-pick available key
    if (!pickedKey && unit_id) {
      const unit = await exe(
        `SELECT id FROM units WHERE id = ? AND owner_id = ? LIMIT 1`,
        [Number(unit_id), req.user.id]
      );
      if (!unit.length) {
        return res.status(403).json({ success: false, message: "This unit is not yours" });
      }

      const keys = await exe(
        `SELECT id, key_code, status
         FROM keyss
         WHERE unit_id = ? AND status = 'AVAILABLE'
         ORDER BY id ASC
         LIMIT 1`,
        [Number(unit_id)]
      );

      if (!keys.length) {
        return res.status(400).json({ success: false, message: "No AVAILABLE key found for this unit" });
      }

      pickedKey = keys[0];
    }

    // 3) prevent duplicate pending request
    const dup = await exe(
      `SELECT id FROM key_requests
       WHERE requested_by = ? AND key_id = ? AND status = 'PENDING'
       LIMIT 1`,
      [req.user.id, pickedKey.id]
    );
    if (dup.length) {
      return res.status(400).json({ success: false, message: "Already requested (PENDING)" });
    }

    // 4) insert request
    const ins = await exe(
      `INSERT INTO key_requests (key_id, requested_by, status)
       VALUES (?, ?, 'PENDING')`,
      [pickedKey.id, req.user.id]
    );

    return res.status(201).json({
      success: true,
      message: "Key request created",
      data: { id: ins.insertId, key_id: pickedKey.id, key_code: pickedKey.key_code, status: "PENDING" },
    });
  } catch (err) {
    next(err);
  }
};

// ✅ GET /api/owner/requests
exports.listMyKeyRequests = async (req, res, next) => {
  try {
    const rows = await exe(
      `SELECT kr.id, kr.key_id, k.key_code, k.key_type,
              kr.status, kr.requested_at,
              u.id AS unit_id, u.unit_name,
              o.id AS org_id, o.name AS org_name
       FROM key_requests kr
       JOIN keyss k ON k.id = kr.key_id
       JOIN units u ON u.id = k.unit_id
       JOIN organizations o ON o.id = u.org_id
       WHERE kr.requested_by = ?
       ORDER BY kr.id DESC`,
      [req.user.id]
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
