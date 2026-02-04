// src/controllers/request.controller.js
const exe = require("../config/db");

async function logAudit(exe, { userId, action, entity, entityId, ip }) {
  try {
    await exe(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [userId || null, action, entity, entityId || null, ip || null]
    );
  } catch (e) {
    console.error("AUDIT_LOG_FAIL:", e.message);
  }
}

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

exports.createKeyRequest = async (req, res, next) => {
  try {
    const { key_id } = req.body;

    if (!key_id) {
      return res.status(400).json({ success: false, message: "key_id is required" });
    }

    // Check key exists
    const keys = await exe(`SELECT id, status FROM keyss WHERE id = ?`, [key_id]);
    if (keys.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid key_id" });
    }

    // Optional rule: don't allow request if key is LOST
    if (keys[0].status === "LOST") {
      return res.status(400).json({ success: false, message: "Key is marked LOST" });
    }

    // Prevent duplicate pending requests for same key by same user
    const dup = await exe(
      `SELECT id FROM key_requests
       WHERE key_id = ? AND requested_by = ? AND status = 'PENDING'`,
      [key_id, req.user.id]
    );
    if (dup.length > 0) {
      return res.status(400).json({ success: false, message: "You already have a PENDING request for this key" });
    }

    // Create request
    const result = await exe(
      `INSERT INTO key_requests (key_id, requested_by)
       VALUES (?, ?)`,
      [key_id, req.user.id]
    );

    await logAudit(exe, {
      userId: req.user?.id,
      action: "CREATE_KEY_REQUEST",
      entity: "key_requests",
      entityId: result.insertId,
      ip: getClientIp(req),
    });

    return res.status(201).json({
      success: true,
      message: "Key request created",
      data: {
        id: result.insertId,
        key_id,
        requested_by: req.user.id,
        status: "PENDING",
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyRequests = async (req, res, next) => {
  try {
    const rows = await exe(
      `SELECT kr.id, kr.key_id, k.key_code, k.key_type,
              kr.requested_by, u.name AS requested_by_name,
              kr.approved_by, a.name AS approved_by_name,
              kr.status, kr.requested_at
       FROM key_requests kr
       JOIN keyss k ON k.id = kr.key_id
       JOIN users u ON u.id = kr.requested_by
       LEFT JOIN users a ON a.id = kr.approved_by
       WHERE kr.requested_by = ?
       ORDER BY kr.id DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (err) {
    next(err);
  }
};

