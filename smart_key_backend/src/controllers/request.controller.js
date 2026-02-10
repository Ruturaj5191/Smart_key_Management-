// src/controllers/request.controller.js
const exe = require("../config/db");
const crypto = require("crypto");
const { ok } = require("../utils/response");

// async function logAudit(exe, { userId, action, entity, entityId, ip }) {
//   try {
//     await exe(
//       `INSERT INTO audit_logs (user_id, action, entity, entity_id, ip_address)
//        VALUES (?, ?, ?, ?, ?)`,
//       [userId || null, action, entity, entityId || null, ip || null]
//     );
//   } catch (e) {
//     console.error("AUDIT_LOG_FAIL:", e.message);
//   }
// }

// function getClientIp(req) {
//   return (
//     req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
//     req.socket?.remoteAddress ||
//     null
//   );
// }

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





// src/controllers/request.controller.js

// helpers
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

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

function hashOtp(otp) {
  const secret = process.env.OTP_SECRET || "dev_secret";
  return crypto.createHash("sha256").update(String(otp) + secret).digest("hex");
}

// ✅ POST /api/owner/requests/:id/send-otp
exports.sendOtp = async (req, res, next) => {
  try {
    const requestId = Number(req.params.id);
    if (!requestId) return res.status(400).json({ success: false, message: "Invalid request id" });

    const rows = await exe(
      `SELECT kr.id, kr.status, kr.requested_by
       FROM key_requests kr
       WHERE kr.id=? LIMIT 1`,
      [requestId]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: "Request not found" });

    const r = rows[0];

    // owner only
    if (Number(r.requested_by) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: "Not your request" });
    }

    // must be approved (or resend if OTP_SENT)
    if (!["APPROVED", "OTP_SENT"].includes(r.status)) {
      return res.status(400).json({
        success: false,
        message: `OTP allowed only for APPROVED/OTP_SENT. Current: ${r.status}`,
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = hashOtp(otp);

    await exe(
      `UPDATE key_requests
       SET otp_hash=?, otp_expires_at=DATE_ADD(NOW(), INTERVAL 5 MINUTE),
           otp_verified_at=NULL, otp_attempts=0, status='OTP_SENT'
       WHERE id=?`,
      [otpHash, requestId]
    );

    await exe(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES (?, ?, ?, ?)`,
      [
        req.user.id,
        "OTP for Key Request",
        `Your OTP for request #${requestId} is: ${otp} (valid 5 minutes)`,
        "EMAIL",
      ]
    );

    await logAudit(exe, {
      userId: req.user?.id,
      action: "OWNER_SEND_OTP",
      entity: "key_requests",
      entityId: requestId,
      ip: getClientIp(req),
    });

    return ok(res, { request_id: requestId }, "OTP sent");
  } catch (e) {
    next(e);
  }
};

// ✅ POST /api/owner/requests/:id/verify-otp
exports.verifyOtp = async (req, res, next) => {
  try {
    const requestId = Number(req.params.id);
    const { otp } = req.body;

    if (!requestId || !otp) {
      return res.status(400).json({ success: false, message: "request id and otp required" });
    }

    const rows = await exe(
      `SELECT id, requested_by, status, otp_hash, otp_expires_at, otp_attempts
       FROM key_requests
       WHERE id=? LIMIT 1`,
      [requestId]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: "Request not found" });

    const r = rows[0];

    if (Number(r.requested_by) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: "Not your request" });
    }

    if (r.status !== "OTP_SENT") {
      return res.status(400).json({ success: false, message: `OTP verify only when OTP_SENT. Current: ${r.status}` });
    }

    if (!r.otp_expires_at || new Date(r.otp_expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: "OTP expired. Please resend OTP." });
    }

    if ((r.otp_attempts || 0) >= 5) {
      return res.status(400).json({ success: false, message: "Too many attempts. Please resend OTP." });
    }

    const okHash = hashOtp(otp) === r.otp_hash;

    if (!okHash) {
      await exe(`UPDATE key_requests SET otp_attempts = otp_attempts + 1 WHERE id=?`, [requestId]);
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    await exe(
      `UPDATE key_requests
       SET otp_verified_at=NOW(), status='OTP_VERIFIED'
       WHERE id=?`,
      [requestId]
    );

    return ok(res, { request_id: requestId }, "OTP verified");
  } catch (e) {
    next(e);
  }
};

exports.createFacilityRequest = async (req, res) => {
  const { request_type, description, unit_id } = req.body;
  const user_id = req.user.id;

  const sql = `
    INSERT INTO facility_requests
    (user_id, unit_id, request_type, description)
    VALUES (?, ?, ?, ?)
  `;

  await exe(
    sql,
    [user_id, unit_id, request_type, description],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Failed to create facility request",
          error: err,
        });
      }

      res.status(201).json({
        success: true,
        message: "Facility request created successfully",
      });
    }
  );
};

exports.getFacilityRequests = async(req, res) => {
  const role = req.user.role;
  const userId = req.user.id;

  let sql = `
    SELECT 
      fr.id,
      fr.request_type,
      fr.status,
      fr.description,
      fr.created_at,

      u.id AS unit_id,
      u.unit_name,

      o.name AS org_name,

      usr.name AS user_name

    FROM facility_requests fr
    JOIN users usr ON usr.id = fr.user_id
    JOIN units u ON u.id = fr.unit_id
    JOIN organizations o ON o.id = u.org_id
  `;

  const params = [];

  // OWNER should see only their own requests
  if (role === 4) {
    sql += " WHERE fr.user_id = ?";
    params.push(userId);
  }

  sql += " ORDER BY fr.id DESC";

  await exe(sql, params, (err, rows) => {
    if (err) {
      console.error("GET FACILITY REQUESTS ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch facility requests",
      });
    }

    res.json({
      success: true,
      data: rows,
    });
  });
};


exports.updateFacilityRequestStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  const sql = `
    UPDATE facility_requests
    SET status = ?
    WHERE id = ?
  `;

  await exe(sql, [status, id], (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to update status",
        error: err,
      });
    }

    res.json({
      success: true,
      message: "Facility request status updated",
    });
  });
};
