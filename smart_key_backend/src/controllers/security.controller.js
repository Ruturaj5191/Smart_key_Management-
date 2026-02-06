// src/controllers/security.controller.js
const { ok } = require("../utils/response");
const keyService = require("../services/key.service");
const txnService = require("../services/transaction.service");
const exe = require("../config/db");
const { ROLE } = require("../config/constants");
const crypto = require("crypto");

async function audit(userId, action, entity, entityId, ip) {
  try {
    await exe(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [userId || null, action, entity, entityId || null, ip || null]
    );
  } catch (_) {}
}

function ip(req) {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

exports.myAssignedOrgs = async (req, res, next) => {
  try {
    const rows = await keyService.securityAssignedOrgs(req.user.id);
    return ok(res, rows, "Assigned organizations");
  } catch (e) {
    next(e);
  }
};

exports.listOpenIssued = async (req, res, next) => {
  try {
    const rows = await txnService.listOpenIssued();
    return ok(res, rows, "Open issued transactions");
  } catch (e) {
    next(e);
  }
};

// exports.listIssueRequests = async (req, res, next) => {
//   try {
//     const roleId = Number(req.user?.role_id);

//     let sql = `
//       SELECT
//         kr.id,
//         kr.key_id,
//         k.key_code,
//         k.key_type,
//         k.locker_no,
//         k.status AS key_status,

//         u.id AS unit_id,
//         u.unit_name,

//         o.id AS org_id,
//         o.name AS org_name,

//         kr.requested_by,
//         rb.name AS requested_by_name,

//         kr.approved_by,
//         ab.name AS approved_by_name,

//         kr.status,
//         kr.requested_at
//       FROM key_requests kr
//       JOIN keyss k ON k.id = kr.key_id
//       JOIN units u ON u.id = k.unit_id
//       JOIN organizations o ON o.id = u.org_id
//       JOIN users rb ON rb.id = kr.requested_by
//       LEFT JOIN users ab ON ab.id = kr.approved_by
//     `;

//     const params = [];

//     // ✅ SECURITY can see only assigned orgs
//     if (roleId === ROLE.SECURITY) {
//       sql += `
//         JOIN security_assignments sa
//           ON sa.org_id = o.id
//          AND sa.user_id = ?
//       `;
//       params.push(req.user.id);
//     }

//     sql += `
//       WHERE kr.status = 'OTP_VERIFIED'
//         AND k.status = 'AVAILABLE'

//         -- ✅ only latest APPROVED per (key_id + requested_by)
//         AND kr.id = (
//           SELECT MAX(kr2.id)
//           FROM key_requests kr2
//           WHERE kr2.key_id = kr.key_id
//             AND kr2.requested_by = kr.requested_by
//             AND kr2.status = 'APPROVED'
//         )

//         -- ✅ request must not already have transaction
//         AND NOT EXISTS (
//           SELECT 1 FROM key_transactions kt
//           WHERE kt.request_id = kr.id
//         )

//         -- ✅ key must not be open-issued (extra safety)
//         AND NOT EXISTS (
//           SELECT 1 FROM key_transactions kt2
//           WHERE kt2.key_id = kr.key_id
//             AND kt2.status = 'ISSUED'
//             AND kt2.return_time IS NULL
//         )

//       ORDER BY kr.id DESC
//     `;

//     const rows = await exe(sql, params);
//     return ok(res, rows, "Requests ready for issue");
//   } catch (e) {
//     next(e);
//   }
// };

// src/controllers/security.controller.js



exports.listIssueRequests = async (req, res, next) => {
  try {
    const roleId = Number(req.user?.role_id);

    // optional ?status=OTP_VERIFIED
    const status = String(req.query.status || "OTP_VERIFIED").toUpperCase();
    const allowed = ["OTP_VERIFIED", "APPROVED", "OTP_SENT"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status filter" });
    }

    let sql = `
      SELECT
        kr.id,
        kr.key_id,
        k.key_code,
        k.key_type,
        k.locker_no,
        k.status AS key_status,

        u.id AS unit_id,
        u.unit_name,

        o.id AS org_id,
        o.name AS org_name,

        kr.requested_by,
        rb.name AS requested_by_name,

        kr.approved_by,
        ab.name AS approved_by_name,

        kr.status,
        kr.requested_at
      FROM key_requests kr
      JOIN keyss k ON k.id = kr.key_id
      JOIN units u ON u.id = k.unit_id
      JOIN organizations o ON o.id = u.org_id
      JOIN users rb ON rb.id = kr.requested_by
      LEFT JOIN users ab ON ab.id = kr.approved_by
    `;

    const params = [];

    // SECURITY sees only assigned orgs
    if (roleId === ROLE.SECURITY) {
      sql += `
        JOIN security_assignments sa
          ON sa.org_id = o.id
         AND sa.user_id = ?
      `;
      params.push(req.user.id);
    }

    sql += `
      WHERE kr.status = ?
        AND k.status = 'AVAILABLE'

        AND NOT EXISTS (
          SELECT 1 FROM key_transactions kt
          WHERE kt.request_id = kr.id
        )

        AND NOT EXISTS (
          SELECT 1 FROM key_transactions kt2
          WHERE kt2.key_id = kr.key_id
            AND kt2.status = 'ISSUED'
            AND kt2.return_time IS NULL
        )

      ORDER BY kr.id DESC
    `;

    params.push(status);

    const rows = await exe(sql, params);
    return ok(res, rows, "Requests ready for issue");
  } catch (e) {
    next(e);
  }
};



exports.issueKey = async (req, res, next) => {
  try {
    const { key_id, issued_to, access_method, request_id } = req.body;

    const data = await txnService.issueKey({
      key_id,
      issued_to,
      issued_by: req.user.id,
      access_method,
      request_id,
    });

    await audit(req.user.id, "SECURITY_ISSUE_KEY", "key_transactions", data.transaction_id, ip(req));
    return ok(res, data, "Key issued", 201);
  } catch (e) {
    next(e);
  }
};



exports.returnKey = async (req, res, next) => {
  try {
    const { key_id, transaction_id } = req.body;

    const data = await txnService.returnKey({ key_id, transaction_id });
    await audit(req.user.id, "SECURITY_RETURN_KEY", "key_transactions", data.transaction_id, ip(req));
    return ok(res, data, "Key returned");
  } catch (e) {
    next(e);
  }
};


exports.listAllTransactions = async (req, res, next) => {
  try {
    const roleId = Number(req.user?.role_id);
    const status = req.query.status ? String(req.query.status).toUpperCase() : null;

    let sql = `
      SELECT
        kt.id AS transaction_id,
        kt.key_id,
        k.key_code,
        k.key_type,
        kt.issued_to,
        ut.name AS issued_to_name,
        kt.issued_by,
        ub.name AS issued_by_name,
        kt.issue_time,
        kt.return_time,
        kt.access_method,
        kt.status
      FROM key_transactions kt
      JOIN keyss k ON k.id = kt.key_id
      JOIN users ut ON ut.id = kt.issued_to
      JOIN users ub ON ub.id = kt.issued_by
    `;

    const params = [];
    const where = [];

    // SECURITY: only assigned orgs
    if (roleId === ROLE.SECURITY) {
      sql += `
        JOIN units un ON un.id = k.unit_id
        JOIN organizations o ON o.id = un.org_id
        JOIN security_assignments sa
          ON sa.org_id = o.id
         AND sa.user_id = ?
      `;
      params.push(req.user.id);
    }

    // ✅ status filter
    if (status && status !== "ALL") {
      const allowed = ["ISSUED", "RETURNED", "LOST"];
      if (!allowed.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status filter" });
      }
      where.push("kt.status = ?");
      params.push(status);
    }

    if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
    sql += ` ORDER BY kt.id DESC`;

    const rows = await exe(sql, params);
    return ok(res, rows, "All transactions");
  } catch (e) {
    next(e);
  }
};


// helper
function hashOtp(otp) {
  const secret = process.env.OTP_SECRET || "dev_secret";
  return crypto.createHash("sha256").update(String(otp) + secret).digest("hex");
}

// POST /api/security/requests/:id/otp
exports.generateOtpForRequest = async (req, res, next) => {
  try {
    const requestId = Number(req.params.id);
    if (!requestId) return res.status(400).json({ success: false, message: "Invalid request id" });

    // load request + key + org (so we can check assignment)
    const rows = await exe(`
      SELECT kr.id, kr.status, kr.requested_by, kr.key_id,
             u.org_id
      FROM key_requests kr
      JOIN keyss k ON k.id = kr.key_id
      JOIN units u ON u.id = k.unit_id
      WHERE kr.id = ?
      LIMIT 1
    `, [requestId]);

    if (!rows.length) return res.status(404).json({ success: false, message: "Request not found" });

    const r = rows[0];

    // must be APPROVED (or allow OTP_SENT to regenerate)
    if (!["APPROVED", "OTP_SENT"].includes(r.status)) {
      return res.status(400).json({ success: false, message: `OTP allowed only for APPROVED/OTP_SENT. Current: ${r.status}` });
    }

    // ✅ Security should be assigned to this org
    const ass = await exe(
      `SELECT id FROM security_assignments WHERE org_id=? AND user_id=? LIMIT 1`,
      [r.org_id, req.user.id]
    );
    if (!ass.length) {
      return res.status(403).json({ success: false, message: "You are not assigned to this organization" });
    }

    // generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = hashOtp(otp);

    await exe(
      `UPDATE key_requests
       SET otp_hash=?, otp_expires_at=DATE_ADD(NOW(), INTERVAL 5 MINUTE),
           otp_verified_at=NULL, otp_attempts=0, status='OTP_SENT'
       WHERE id=?`,
      [otpHash, requestId]
    );

    // notify owner (you can replace with SMS later)
    await exe(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES (?, ?, ?, ?)`,
      [
        r.requested_by,
        "OTP for Key Request",
        `Your OTP for request #${requestId} is: ${otp} (valid 5 minutes)`,
        "EMAIL",
      ]
    );

    // ⚠️ Do NOT return OTP in production
    return ok(res, { request_id: requestId }, "OTP sent to owner");
  } catch (e) {
    next(e);
  }
};


