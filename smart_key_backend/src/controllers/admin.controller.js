const crypto = require("crypto");
const exe = require("../config/db");


// ---------- helpers ----------
async function logAudit({ userId, action, entity, entityId, ip }) {
  try {
    await exe(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [userId || null, action, entity, entityId || null, ip || null]
    );
  } catch (e) {
    // Don't block main flow on audit failure
    console.error("AUDIT_LOG_FAIL:", e.message);
  }
}

async function notify({ userId, title, message, channel = "NOTIFY" }) {
  try {
    await exe(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES (?, ?, ?, ?)`,
      [userId, title, message, channel]
    );
  } catch (e) {
    console.error("NOTIFY_FAIL:", e.message);
  }
}

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

// ---------- Organizations ----------
exports.createOrganization = async (req, res, next) => {
  try {
    const { name, address,phone_number } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "name is required" });
    }


    const result = await exe(
      `INSERT INTO organizations (name, address,phone_number) VALUES (?, ?, ?)`,
      [name, address || null, phone_number || null]
    );

    await logAudit({
      userId: req.user?.id,
      action: "CREATE_ORGANIZATION",
      entity: "organizations",
      entityId: result.insertId,
      ip: getClientIp(req),
    });

    return res.status(201).json({
      success: true,
      message: "Organization created",
      data: { id: result.insertId, name, address: address || null },
    });
  } catch (err) {
    next(err);
  }
};

exports.listOrganizations = async (req, res, next) => {
  try {
    const { status } = req.query;

    let sql = `SELECT id, name, address, phone_number, status, created_at FROM organizations`;
    const params = [];

    if (status) {
      sql += ` WHERE status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY id DESC`;

    const rows = await exe(sql, params);

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.updateOrganization = async (req, res, next) => {
  try {
    const orgId = Number(req.params.id);
    const { name, address, phone_number, status } = req.body;

    if (!orgId) {
      return res.status(400).json({ success: false, message: "Invalid organization id" });
    }

    const existing = await exe(`SELECT id FROM organizations WHERE id = ?`, [orgId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
    }
    if (address !== undefined) {
      updates.push("address = ?");
      params.push(address);
    }
    if (phone_number !== undefined) {
  updates.push("phone_number = ?");
  params.push(phone_number);
}


    if (status !== undefined) {
      updates.push("status = ?");
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    params.push(orgId);

    await exe(`UPDATE organizations SET ${updates.join(", ")} WHERE id = ?`, params);

    await logAudit({
      userId: req.user?.id,
      action: "UPDATE_ORGANIZATION",
      entity: "organizations",
      entityId: orgId,
      ip: getClientIp(req),
    });

    return res.status(200).json({ success: true, message: "Organization updated" });
  } catch (err) {
    next(err);
  }
};

// ---------- Units ----------
exports.createUnit = async (req, res, next) => {
  try {
    const { org_id, owner_id, unit_name } = req.body;

    if (!org_id || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "org_id and owner_id are required",
      });
    }

    const org = await exe(`SELECT id FROM organizations WHERE id = ? AND status='ACTIVE'`, [
      org_id,
    ]);
    if (org.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or inactive organization" });
    }

    const owner = await exe(`SELECT id FROM users WHERE id = ? AND status='ACTIVE'`, [owner_id]);
    if (owner.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or inactive owner user" });
    }

    const result = await exe(
      `INSERT INTO units (org_id, owner_id, unit_name) VALUES (?, ?, ?)`,
      [org_id, owner_id, unit_name || null]
    );

    await logAudit({
      userId: req.user?.id,
      action: "CREATE_UNIT",
      entity: "units",
      entityId: result.insertId,
      ip: getClientIp(req),
    });

    return res.status(201).json({
      success: true,
      message: "Unit created",
      data: { id: result.insertId, org_id, owner_id, unit_name: unit_name || null },
    });
  } catch (err) {
    next(err);
  }
};

exports.listUnits = async (req, res, next) => {
  try {
    const { org_id, owner_id, status } = req.query;

    let sql = `
      SELECT u.id, u.org_id, o.name AS org_name,
             u.owner_id, us.name AS owner_name,
             u.unit_name, u.status
      FROM units u
      JOIN organizations o ON o.id = u.org_id
      JOIN users us ON us.id = u.owner_id
    `;
    const params = [];
    const where = [];

    if (org_id) {
      where.push("u.org_id = ?");
      params.push(org_id);
    }
    if (owner_id) {
      where.push("u.owner_id = ?");
      params.push(owner_id);
    }
    if (status) {
      where.push("u.status = ?");
      params.push(status);
    }

    if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
    sql += ` ORDER BY u.id DESC`;

    const rows = await exe(sql, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.updateUnit = async (req, res, next) => {
  try {
    const unitId = Number(req.params.id);
    const { owner_id, unit_name, status } = req.body;

    if (!unitId) {
      return res.status(400).json({ success: false, message: "Invalid unit id" });
    }

    const existing = await exe(`SELECT id FROM units WHERE id = ?`, [unitId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Unit not found" });
    }

    const updates = [];
    const params = [];

    if (owner_id !== undefined) {
      const owner = await exe(`SELECT id FROM users WHERE id = ? AND status='ACTIVE'`, [owner_id]);
      if (owner.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid or inactive owner user" });
      }
      updates.push("owner_id = ?");
      params.push(owner_id);
    }

    if (unit_name !== undefined) {
      updates.push("unit_name = ?");
      params.push(unit_name);
    }

    if (status !== undefined) {
      updates.push("status = ?");
      params.push(status);
    }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    params.push(unitId);
    await exe(`UPDATE units SET ${updates.join(", ")} WHERE id = ?`, params);

    await logAudit({
      userId: req.user?.id,
      action: "UPDATE_UNIT",
      entity: "units",
      entityId: unitId,
      ip: getClientIp(req),
    });

    return res.status(200).json({ success: true, message: "Unit updated" });
  } catch (err) {
    next(err);
  }
};

// ---------- Keys ----------
exports.createKey = async (req, res, next) => {
  try {
    const { unit_id, key_code, key_type, locker_no } = req.body;

    if (!unit_id || !key_code) {
      return res.status(400).json({
        success: false,
        message: "unit_id and key_code are required",
      });
    }

    const unit = await exe(`SELECT id FROM units WHERE id = ? AND status='ACTIVE'`, [unit_id]);
    if (unit.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or inactive unit" });
    }

    const existing = await exe(`SELECT id FROM keyss WHERE key_code = ?`, [key_code]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "key_code already exists" });
    }

    const result = await exe(
      `INSERT INTO keyss (unit_id, key_code, key_type, locker_no)
       VALUES (?, ?, ?, ?)`,
      [unit_id, key_code, key_type || "MAIN", locker_no || null]
    );

    await logAudit({
      userId: req.user?.id,
      action: "CREATE_KEY",
      entity: "keyss",
      entityId: result.insertId,
      ip: getClientIp(req),
    });

    return res.status(201).json({
      success: true,
      message: "Key registered",
      data: { id: result.insertId, unit_id, key_code, key_type: key_type || "MAIN", locker_no },
    });
  } catch (err) {
    next(err);
  }
};

exports.listKeys = async (req, res, next) => {
  try {
    const { org_id, unit_id, status } = req.query;

    let sql = `
      SELECT k.id, k.unit_id, u.unit_name, u.org_id, o.name AS org_name,
             k.key_code, k.key_type, k.locker_no, k.status, k.created_at
      FROM keyss k
      JOIN units u ON u.id = k.unit_id
      JOIN organizations o ON o.id = u.org_id
    `;
    const params = [];
    const where = [];

    if (org_id) {
      where.push("u.org_id = ?");
      params.push(org_id);
    }
    if (unit_id) {
      where.push("k.unit_id = ?");
      params.push(unit_id);
    }
    if (status) {
      where.push("k.status = ?");
      params.push(status);
    }

    if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
    sql += ` ORDER BY k.id DESC`;

    const rows = await exe(sql, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.updateKey = async (req, res, next) => {
  try {
    const keyId = Number(req.params.id);
    const { key_type, locker_no, status } = req.body;

    if (!keyId) {
      return res.status(400).json({ success: false, message: "Invalid key id" });
    }

    const existing = await exe(`SELECT id FROM keyss WHERE id = ?`, [keyId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Key not found" });
    }

    const updates = [];
    const params = [];

    if (key_type !== undefined) {
      updates.push("key_type = ?");
      params.push(key_type);
    }
    if (locker_no !== undefined) {
      updates.push("locker_no = ?");
      params.push(locker_no);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      params.push(status);
    }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    params.push(keyId);
    await exe(`UPDATE keyss SET ${updates.join(", ")} WHERE id = ?`, params);

    await logAudit({
      userId: req.user?.id,
      action: "UPDATE_KEY",
      entity: "keyss",
      entityId: keyId,
      ip: getClientIp(req),
    });

    return res.status(200).json({ success: true, message: "Key updated" });
  } catch (err) {
    next(err);
  }
};

// ---------- Security Assignments ----------
exports.assignSecurityToOrg = async (req, res, next) => {
  try {
    const { org_id, user_id } = req.body;

    if (!org_id || !user_id) {
      return res.status(400).json({ success: false, message: "org_id and user_id are required" });
    }

    const org = await exe(`SELECT id FROM organizations WHERE id = ?`, [org_id]);
    if (org.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid organization" });
    }

    const user = await exe(`SELECT id, role_id, status FROM users WHERE id = ?`, [user_id]);
    if (user.length === 0 || user[0].status !== "ACTIVE") {
      return res.status(400).json({ success: false, message: "Invalid or inactive user" });
    }

    const exists = await exe(
      `SELECT id FROM security_assignments WHERE org_id = ? AND user_id = ?`,
      [org_id, user_id]
    );

    if (exists.length > 0) {
      return res.status(200).json({ success: true, message: "Already assigned" });
    }

    const result = await exe(
      `INSERT INTO security_assignments (org_id, user_id) VALUES (?, ?)`,
      [org_id, user_id]
    );

    await logAudit({
      userId: req.user?.id,
      action: "ASSIGN_SECURITY",
      entity: "security_assignments",
      entityId: result.insertId,
      ip: getClientIp(req),
    });

    return res.status(201).json({ success: true, message: "Security assigned" });
  } catch (err) {
    next(err);
  }
};

exports.listSecurityAssignments = async (req, res, next) => {
  try {
    const { org_id } = req.query;

    let sql = `
      SELECT sa.id, sa.org_id, o.name AS org_name,
             sa.user_id, u.name AS user_name, u.role_id, sa.assigned_at
      FROM security_assignments sa
      JOIN organizations o ON o.id = sa.org_id
      JOIN users u ON u.id = sa.user_id
    `;
    const params = [];
    if (org_id) {
      sql += ` WHERE sa.org_id = ?`;
      params.push(org_id);
    }
    sql += ` ORDER BY sa.id DESC`;

    const rows = await exe(sql, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// ---------- Key Requests (Admin approves/rejects) ----------
exports.listKeyRequests = async (req, res, next) => {
  try {
    const { status, org_id, unit_id } = req.query;

    let sql = `
      SELECT kr.id, kr.key_id, k.key_code, k.key_type,
             kr.requested_by, rb.name AS requested_by_name,
             kr.approved_by, ab.name AS approved_by_name,
             kr.status, kr.requested_at
      FROM key_requests kr
      JOIN keyss k ON k.id = kr.key_id
      JOIN units u ON u.id = k.unit_id
      JOIN users rb ON rb.id = kr.requested_by
      LEFT JOIN users ab ON ab.id = kr.approved_by
    `;

    const params = [];
    const where = [];

    if (status) {
      where.push("kr.status = ?");
      params.push(status);
    }
    if (org_id) {
      where.push("u.org_id = ?");
      params.push(org_id);
    }
    if (unit_id) {
      where.push("u.id = ?");
      params.push(unit_id);
    }

    if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
    sql += ` ORDER BY kr.id DESC`;

    const rows = await exe(sql, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.approveKeyRequest = async (req, res, next) => {
  try {
    const requestId = Number(req.params.id);
    if (!requestId) {
      return res.status(400).json({ success: false, message: "Invalid request id" });
    }

    const rows = await exe(
      `SELECT id, key_id, requested_by, status FROM key_requests WHERE id = ?`,
      [requestId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const reqRow = rows[0];
    if (reqRow.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Only PENDING requests can be approved" });
    }

    // Ensure key is available
    const keyRows = await exe(`SELECT id, status FROM keyss WHERE id = ?`, [reqRow.key_id]);
    if (keyRows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid key for this request" });
    }
    if (keyRows[0].status !== "AVAILABLE") {
      return res.status(400).json({ success: false, message: "Key is not AVAILABLE" });
    }

    await exe(
      `UPDATE key_requests
       SET status = 'APPROVED', approved_by = ?
       WHERE id = ?`,
      [req.user?.id, requestId]
    );


    await logAudit({
      userId: req.user?.id,
      action: "APPROVE_KEY_REQUEST",
      entity: "key_requests",
      entityId: requestId,
      ip: getClientIp(req),
    });

    // Basic notification (you can switch channel later)
    await notify({
      userId: reqRow.requested_by,
      title: "Key request approved",
      message: `Your key request (#${requestId}) has been approved.`,
      channel: "EMAIL",
    });

    return res.status(200).json({ success: true, message: "Request approved" });
  } catch (err) {
    next(err);
  }
};

exports.rejectKeyRequest = async (req, res, next) => {
  try {
    const requestId = Number(req.params.id);
    const { reason } = req.body;

    if (!requestId) {
      return res.status(400).json({ success: false, message: "Invalid request id" });
    }

    const rows = await exe(
      `SELECT id, requested_by, status FROM key_requests WHERE id = ?`,
      [requestId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const reqRow = rows[0];
    if (reqRow.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Only PENDING requests can be rejected" });
    }

    await exe(
      `UPDATE key_requests
       SET status = 'REJECTED', approved_by = ?
       WHERE id = ?`,
      [req.user?.id, requestId]
    );

    await logAudit({
      userId: req.user?.id,
      action: "REJECT_KEY_REQUEST",
      entity: "key_requests",
      entityId: requestId,
      ip: getClientIp(req),
    });

    await notify({
      userId: reqRow.requested_by,
      title: "Key request rejected",
      message: `Your key request (#${requestId}) has been rejected.${reason ? " Reason: " + reason : ""}`,
      channel: "EMAIL",
    });

    return res.status(200).json({ success: true, message: "Request rejected" });
  } catch (err) {
    next(err);
  }
};

// ---------- Reports ----------
// exports.listIssuedKeys = async (req, res, next) => {
//   try {
//     // Keys currently issued: transaction exists with status ISSUED and return_time NULL
//     const sql = `
//       SELECT kt.id AS transaction_id,
//              kt.key_id, k.key_code, k.key_type,
//              kt.issued_to, ut.name AS issued_to_name,
//              kt.issued_by, ub.name AS issued_by_name,
//              kt.issue_time, kt.access_method, kt.status
//       FROM key_transactions kt
//       JOIN keyss k ON k.id = kt.key_id
//       JOIN users ut ON ut.id = kt.issued_to
//       JOIN users ub ON ub.id = kt.issued_by
//       WHERE kt.status = 'ISSUED' AND kt.return_time IS NULL
//       ORDER BY kt.issue_time DESC
//     `;
//     const rows = await exe(sql, []);
//     return res.status(200).json({ success: true, data: rows });
//   } catch (err) {
//     next(err);
//   }
// };

// Admin Report: issued keys (supports history)
// GET /api/admin/reports/issued-keys?status=ALL&open_only=0
exports.listIssuedKeys = async (req, res, next) => {
  try {
    const status = String(req.query.status || "ISSUED").toUpperCase();
    const openOnly = String(req.query.open_only || "1") === "1"; // default = only open issued

    const allowed = ["ISSUED", "RETURNED", "LOST", "ALL"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    let sql = `
      SELECT kt.id AS transaction_id,
             kt.key_id, k.key_code, k.key_type,
             kt.issued_to, ut.name AS issued_to_name,
             kt.issued_by, ub.name AS issued_by_name,
             kt.issue_time, kt.return_time,
             kt.access_method, kt.status
      FROM key_transactions kt
      JOIN keyss k ON k.id = kt.key_id
      JOIN users ut ON ut.id = kt.issued_to
      JOIN users ub ON ub.id = kt.issued_by
    `;

    const where = [];
    const params = [];

    if (openOnly) {
      // ONLY currently issued (not returned)
      where.push(`kt.status='ISSUED' AND kt.return_time IS NULL`);
    } else {
      // history mode
      if (status !== "ALL") {
        where.push(`kt.status = ?`);
        params.push(status);
      }
    }

    if (where.length) sql += ` WHERE ` + where.join(" AND ");
    sql += ` ORDER BY kt.issue_time DESC LIMIT 200`;

    const rows = await exe(sql, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};


exports.listAuditLogs = async (req, res, next) => {
  try {
    const { user_id, entity } = req.query;

    let sql = `
      SELECT al.id, al.user_id, u.name AS user_name,
             al.action, al.entity, al.entity_id, al.ip_address, al.created_at
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
    `;
    const params = [];
    const where = [];

    if (user_id) {
      where.push("al.user_id = ?");
      params.push(user_id);
    }
    if (entity) {
      where.push("al.entity = ?");
      params.push(entity);
    }

    if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
    sql += ` ORDER BY al.id DESC LIMIT 500`;

    const rows = await exe(sql, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};


// -------------------- Setup Requests (Owner asks for Org + Unit) --------------------

// ✅ GET /api/admin/setup-requests?status=PENDING
exports.listSetupRequests = async (req, res, next) => {
  try {
    const { status } = req.query;

    let sql = `
      SELECT sr.id, sr.requested_by, u.name AS requested_by_name,
             sr.org_name, sr.org_address, sr.unit_name,
             sr.status, sr.note, sr.created_at,
             sr.approved_by, au.name AS approved_by_name
      FROM setup_requests sr
      JOIN users u ON u.id = sr.requested_by
      LEFT JOIN users au ON au.id = sr.approved_by
    `;
    const params = [];
    if (status) {
      sql += ` WHERE sr.status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY sr.id DESC`;

    const rows = await exe(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// ✅ PATCH /api/admin/setup-requests/:id/approve
// Creates org + unit, optionally creates key, then marks request APPROVED
exports.approveSetupRequest = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: "Invalid id" });

    // 0) load request
    const rows = await exe(`SELECT * FROM setup_requests WHERE id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Request not found" });

    const sr = rows[0];
    if (sr.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Only PENDING can be approved" });
    }

    // 1) find or create org
    let orgId = null;
    const org = await exe(`SELECT id FROM organizations WHERE name = ? LIMIT 1`, [sr.org_name]);

    if (org.length) {
      orgId = org[0].id;
    } else {
      const orgIns = await exe(
        `INSERT INTO organizations (name, address) VALUES (?, ?)`,
        [sr.org_name, sr.org_address || null]
      );
      orgId = orgIns.insertId;
    }

    // 2) create unit for this owner under org (if not already)
    let unitId = null;
    const unitExists = await exe(
      `SELECT id FROM units WHERE org_id = ? AND owner_id = ? AND unit_name = ? LIMIT 1`,
      [orgId, sr.requested_by, sr.unit_name]
    );

    if (unitExists.length) {
      unitId = unitExists[0].id;
    } else {
      const unitIns = await exe(
        `INSERT INTO units (org_id, owner_id, unit_name) VALUES (?, ?, ?)`,
        [orgId, sr.requested_by, sr.unit_name]
      );
      unitId = unitIns.insertId;
    }

    // 2.5) (OPTIONAL) create key if request includes key_code
    // NOTE: this works ONLY if setup_requests table has columns:
    // key_code, key_type, locker_no (nullable)
    let createdKeyId = null;

    if (sr.key_code && String(sr.key_code).trim()) {
      const keyCode = String(sr.key_code).trim();

      // avoid duplicate key_code
      const existKey = await exe(`SELECT id FROM keyss WHERE key_code = ? LIMIT 1`, [keyCode]);

      if (existKey.length) {
        createdKeyId = existKey[0].id;
      } else {
        const keyIns = await exe(
          `INSERT INTO keyss (unit_id, key_code, key_type, locker_no)
           VALUES (?, ?, ?, ?)`,
          [unitId, keyCode, sr.key_type || "MAIN", sr.locker_no || null]
        );
        createdKeyId = keyIns.insertId;
      }
    }

    // 3) mark request approved
    await exe(
      `UPDATE setup_requests
       SET status = 'APPROVED',
           approved_by = ?,
           note = ?
       WHERE id = ?`,
      [req.user.id, req.body?.note || null, id]
    );

    // 4) notification
    await exe(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES (?, ?, ?, ?)`,
      [
        sr.requested_by,
        "Setup request approved",
        `Your request for "${sr.org_name}" / "${sr.unit_name}" was approved. (org_id=${orgId}, unit_id=${unitId})${
          createdKeyId ? ` (key_id=${createdKeyId}, key_code=${sr.key_code})` : ""
        }`,
        "EMAIL",
      ]
    );

    return res.json({
      success: true,
      message: createdKeyId
        ? "Setup request approved. Org + Unit + Key created."
        : "Setup request approved. Org + Unit created.",
      data: {
        request_id: id,
        org_id: orgId,
        unit_id: unitId,
        key_id: createdKeyId, // null if key_code not provided
      },
    });
  } catch (err) {
    next(err);
  }
};


// ✅ PATCH /api/admin/setup-requests/:id/reject
exports.rejectSetupRequest = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { note } = req.body;

    if (!id) return res.status(400).json({ success: false, message: "Invalid id" });

    const rows = await exe(`SELECT * FROM setup_requests WHERE id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Request not found" });

    const sr = rows[0];
    if (sr.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Only PENDING can be rejected" });
    }

    await exe(
      `UPDATE setup_requests
       SET status='REJECTED', approved_by=?, note=?
       WHERE id=?`,
      [req.user.id, note || null, id]
    );

    await exe(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES (?, ?, ?, ?)`,
      [
        sr.requested_by,
        "Setup request rejected",
        `Your setup request for "${sr.org_name}" / "${sr.unit_name}" was rejected.${note ? " Note: " + note : ""}`,
        "EMAIL",
      ]
    );

    return res.json({ success: true, message: "Setup request rejected" });
  } catch (err) {
    next(err);
  }
};


// -------------------- Key Setup Requests (Owner asks Admin to create a Key) --------------------

// ✅ GET /api/admin/key-setup-requests?status=PENDING&org_id=&unit_id=
exports.listKeySetupRequests = async (req, res, next) => {
  try {
    const { status, org_id, unit_id } = req.query;

    let sql = `
      SELECT ksr.id,
             ksr.requested_by, ru.name AS requested_by_name,
             ksr.unit_id, un.unit_name,
             un.org_id, org.name AS org_name,
             ksr.key_code, ksr.key_type, ksr.locker_no,
             ksr.status, ksr.note, ksr.created_at,
             ksr.approved_by, au.name AS approved_by_name,
             ksr.created_key_id
      FROM key_setup_requests ksr
      JOIN users ru ON ru.id = ksr.requested_by
      JOIN units un ON un.id = ksr.unit_id
      JOIN organizations org ON org.id = un.org_id
      LEFT JOIN users au ON au.id = ksr.approved_by
    `;

    const where = [];
    const params = [];

    if (status) {
      where.push("ksr.status = ?");
      params.push(status);
    }
    if (org_id) {
      where.push("un.org_id = ?");
      params.push(org_id);
    }
    if (unit_id) {
      where.push("ksr.unit_id = ?");
      params.push(unit_id);
    }

    if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
    sql += ` ORDER BY ksr.id DESC`;

    const rows = await exe(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// ✅ PATCH /api/admin/key-setup-requests/:id/approve
// Creates key in keyss and marks request APPROVED
exports.approveKeySetupRequest = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { note } = req.body;

    if (!id) return res.status(400).json({ success: false, message: "Invalid id" });

    const rows = await exe(`SELECT * FROM key_setup_requests WHERE id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Request not found" });

    const r = rows[0];
    if (r.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Only PENDING can be approved" });
    }

    // unit must exist and active
    const unit = await exe(`SELECT id, status FROM units WHERE id = ?`, [r.unit_id]);
    if (!unit.length) return res.status(400).json({ success: false, message: "Invalid unit" });
    if (unit[0].status !== "ACTIVE") {
      return res.status(400).json({ success: false, message: "Unit is not ACTIVE" });
    }

    // key_code must be unique
    const exists = await exe(`SELECT id FROM keyss WHERE key_code = ?`, [r.key_code]);
    if (exists.length) {
      return res.status(400).json({ success: false, message: "key_code already exists" });
    }

    // transaction (create key + update request)
    await exe("START TRANSACTION");

    const ins = await exe(
      `INSERT INTO keyss (unit_id, key_code, key_type, locker_no)
       VALUES (?, ?, ?, ?)`,
      [r.unit_id, r.key_code, r.key_type || "MAIN", r.locker_no || null]
    );

    const createdKeyId = ins.insertId;

    await exe(
      `UPDATE key_setup_requests
       SET status='APPROVED', approved_by=?, note=?, created_key_id=?
       WHERE id=?`,
      [req.user.id, note || null, createdKeyId, id]
    );

    await exe("COMMIT");

    // audit + notify
    await logAudit({
      userId: req.user?.id,
      action: "APPROVE_KEY_SETUP_REQUEST",
      entity: "key_setup_requests",
      entityId: id,
      ip: getClientIp(req),
    });

    await notify({
      userId: r.requested_by,
      title: "Key setup request approved",
      message: `Your key request "${r.key_code}" was approved and created (key_id=${createdKeyId}).`,
      channel: "EMAIL",
    });

    return res.json({
      success: true,
      message: "Approved. Key created.",
      data: { request_id: id, created_key_id: createdKeyId },
    });
  } catch (err) {
    try { await exe("ROLLBACK"); } catch (_) { }
    next(err);
  }
};

// ✅ PATCH /api/admin/key-setup-requests/:id/reject
exports.rejectKeySetupRequest = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { note } = req.body;

    if (!id) return res.status(400).json({ success: false, message: "Invalid id" });

    const rows = await exe(`SELECT * FROM key_setup_requests WHERE id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Request not found" });

    const r = rows[0];
    if (r.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Only PENDING can be rejected" });
    }

    await exe(
      `UPDATE key_setup_requests
       SET status='REJECTED', approved_by=?, note=?
       WHERE id=?`,
      [req.user.id, note || null, id]
    );

    await logAudit({
      userId: req.user?.id,
      action: "REJECT_KEY_SETUP_REQUEST",
      entity: "key_setup_requests",
      entityId: id,
      ip: getClientIp(req),
    });

    await notify({
      userId: r.requested_by,
      title: "Key setup request rejected",
      message: `Your key request "${r.key_code}" was rejected.${note ? " Note: " + note : ""}`,
      channel: "EMAIL",
    });

    return res.json({ success: true, message: "Rejected" });
  } catch (err) {
    next(err);
  }
};


// GET /api/admin/users?role_id=3
exports.listUsers = async (req, res, next) => {
  try {
    const roleId = req.query.role_id ? Number(req.query.role_id) : null;

    let sql = `SELECT id, name, role_id FROM users`;
    const params = [];
    const where = [];

    if (roleId) {
      where.push("role_id = ?");
      params.push(roleId);
    }

    if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
    sql += ` ORDER BY id DESC`;

    const rows = await exe(sql, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};


