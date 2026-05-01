// src/controllers/visitor.controller.js
const exe = require("../config/db");
const { ok, fail } = require("../utils/response");
const logger = require("../utils/logger");

// ── helpers ───────────────────────────────────────────────────────────────────

async function audit(userId, action, entity, entityId, ip) {
  try {
    await exe(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [userId || null, action, entity, entityId || null, ip || null]
    );
  } catch (_) {}
}

function getIp(req) {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

/**
 * Generate a 6-digit random OTP
 */
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── POST /api/visitors/pre-approve — owner creates visitor with OTP ───────────

exports.preApproveVisitor = async (req, res, next) => {
  try {
    const { unit_id, visitor_name, visitor_phone, purpose, expected_date } = req.body;

    // verify unit belongs to this owner
    const unit = await exe(
      `SELECT id, org_id FROM units WHERE id = ? AND owner_id = ? LIMIT 1`,
      [unit_id, req.user.id]
    );
    if (!unit.length) return fail(res, "This unit is not yours", 403);

    // check for duplicate pending/approved visitor for same phone + date + unit
    const dup = await exe(
      `SELECT id FROM visitors
       WHERE unit_id = ? AND visitor_phone = ? AND expected_date = ?
         AND status IN ('PENDING', 'APPROVED')
       LIMIT 1`,
      [unit_id, visitor_phone, expected_date]
    );
    if (dup.length) {
      return fail(res, "Visitor already pre-approved for this date", 409);
    }

    // generate OTP (6 digits, expires in 10 minutes)
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min from now

    const result = await exe(
      `INSERT INTO visitors (unit_id, owner_id, visitor_name, visitor_phone, purpose, expected_date, otp, otp_expiry, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')`,
      [
        unit_id,
        req.user.id,
        visitor_name.trim(),
        visitor_phone.trim(),
        purpose || null,
        expected_date,
        otp,
        otpExpiry,
      ]
    );

    // send notification to owner with OTP
    await exe(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES (?, ?, ?, ?)`,
      [
        req.user.id,
        "Visitor OTP Generated",
        `OTP for visitor ${visitor_name.trim()} (${visitor_phone}): ${otp} — valid for 10 minutes. Share this with your visitor.`,
        "EMAIL",
      ]
    );

    await audit(req.user.id, "VISITOR_PRE_APPROVED", "visitors", result.insertId, getIp(req));

    logger.info(`Visitor #${result.insertId} pre-approved by owner #${req.user.id}`);

    return ok(
      res,
      {
        id: result.insertId,
        visitor_name: visitor_name.trim(),
        visitor_phone: visitor_phone.trim(),
        expected_date,
        otp,
        otp_expiry: otpExpiry.toISOString(),
        status: "APPROVED",
      },
      "Visitor pre-approved — share OTP with visitor",
      201
    );
  } catch (e) {
    logger.error("visitor.preApproveVisitor:", e.message);
    next(e);
  }
};

// ── GET /api/visitors/my/:unitId — owner sees visitor list ────────────────────

exports.listMyVisitors = async (req, res, next) => {
  try {
    const unitId = Number(req.params.unitId);
    if (!unitId) return fail(res, "Invalid unitId", 400);

    // verify unit belongs to this owner
    const unit = await exe(
      `SELECT id FROM units WHERE id = ? AND owner_id = ? LIMIT 1`,
      [unitId, req.user.id]
    );
    if (!unit.length) return fail(res, "This unit is not yours", 403);

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    // optional status filter
    const status = req.query.status ? String(req.query.status).toUpperCase() : null;

    let countSql = `SELECT COUNT(*) AS total FROM visitors WHERE unit_id = ?`;
    let sql = `SELECT id, visitor_name, visitor_phone, purpose, expected_date,
                      otp, otp_expiry, status, created_at
               FROM visitors
               WHERE unit_id = ?`;
    const params = [unitId];

    if (status && ["PENDING", "APPROVED", "REJECTED", "EXPIRED"].includes(status)) {
      countSql += ` AND status = ?`;
      sql += ` AND status = ?`;
      params.push(status);
    }

    const countRows = await exe(countSql, params);
    const total = countRows[0]?.total || 0;

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const rows = await exe(sql, [...params, limit, offset]);

    return ok(res, { visitors: rows, total, page, limit }, "Your visitors");
  } catch (e) {
    logger.error("visitor.listMyVisitors:", e.message);
    next(e);
  }
};

// ── POST /api/visitors/verify-otp — security verifies OTP at gate ─────────────

exports.verifyOtp = async (req, res, next) => {
  try {
    const { visitor_phone, otp, vehicle_number, photo_url } = req.body;

    // find approved visitor with matching phone + otp
    const visitors = await exe(
      `SELECT v.id, v.unit_id, v.owner_id, v.visitor_name, v.otp, v.otp_expiry,
              v.expected_date, v.status, u.org_id
       FROM visitors v
       JOIN units u ON u.id = v.unit_id
       WHERE v.visitor_phone = ? AND v.otp = ? AND v.status = 'APPROVED'
       ORDER BY v.id DESC
       LIMIT 1`,
      [visitor_phone.trim(), otp.trim()]
    );

    if (!visitors.length) {
      return fail(res, "Invalid OTP or no approved visitor found", 401);
    }

    const visitor = visitors[0];

    // check OTP expiry
    if (new Date() > new Date(visitor.otp_expiry)) {
      // mark as expired
      await exe(`UPDATE visitors SET status = 'EXPIRED' WHERE id = ?`, [visitor.id]);
      return fail(res, "OTP has expired. Ask the owner to generate a new one.", 400);
    }

    // verify security is assigned to this org
    const assignment = await exe(
      `SELECT id FROM security_assignments WHERE org_id = ? AND user_id = ? LIMIT 1`,
      [visitor.org_id, req.user.id]
    );
    if (!assignment.length) {
      return fail(res, "You are not assigned to this organization", 403);
    }

    // check if visitor already has an active entry (no exit)
    const activeEntry = await exe(
      `SELECT id FROM visitor_logs
       WHERE visitor_id = ? AND exit_time IS NULL
       LIMIT 1`,
      [visitor.id]
    );
    if (activeEntry.length) {
      return fail(res, "Visitor already inside — exit not yet recorded", 400);
    }

    // create visitor log (entry)
    const result = await exe(
      `INSERT INTO visitor_logs (visitor_id, security_id, unit_id, vehicle_number, photo_url)
       VALUES (?, ?, ?, ?, ?)`,
      [
        visitor.id,
        req.user.id,
        visitor.unit_id,
        vehicle_number ? vehicle_number.trim().toUpperCase() : null,
        photo_url || null,
      ]
    );

    // clear OTP after successful verification (one-time use)
    await exe(
      `UPDATE visitors SET otp = NULL, otp_expiry = NULL WHERE id = ?`,
      [visitor.id]
    );

    // notify owner
    await exe(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES (?, ?, ?, ?)`,
      [
        visitor.owner_id,
        "Visitor Arrived",
        `${visitor.visitor_name} (${visitor_phone}) has entered the premises.`,
        "EMAIL",
      ]
    );

    await audit(req.user.id, "VISITOR_OTP_VERIFIED", "visitor_logs", result.insertId, getIp(req));

    logger.info(`Visitor #${visitor.id} verified at gate — log #${result.insertId}`);

    return ok(
      res,
      {
        log_id: result.insertId,
        visitor_id: visitor.id,
        visitor_name: visitor.visitor_name,
        unit_id: visitor.unit_id,
        entry_time: new Date().toISOString(),
      },
      "Visitor verified — entry logged",
      201
    );
  } catch (e) {
    logger.error("visitor.verifyOtp:", e.message);
    next(e);
  }
};

// ── PUT /api/visitors/exit/:logId — security marks exit ───────────────────────

exports.markExit = async (req, res, next) => {
  try {
    const logId = Number(req.params.logId);
    if (!logId) return fail(res, "Invalid logId", 400);

    // verify log exists and exit_time is null
    const logs = await exe(
      `SELECT vl.id, vl.visitor_id, vl.exit_time, vl.unit_id,
              u.org_id, v.visitor_name, v.owner_id
       FROM visitor_logs vl
       JOIN visitors v ON v.id = vl.visitor_id
       JOIN units u ON u.id = vl.unit_id
       WHERE vl.id = ? LIMIT 1`,
      [logId]
    );
    if (!logs.length) return fail(res, "Visitor log not found", 404);

    const log = logs[0];
    if (log.exit_time) return fail(res, "Visitor exit already recorded", 400);

    // verify security assignment
    const assignment = await exe(
      `SELECT id FROM security_assignments WHERE org_id = ? AND user_id = ? LIMIT 1`,
      [log.org_id, req.user.id]
    );
    if (!assignment.length) {
      return fail(res, "You are not assigned to this organization", 403);
    }

    // update exit time
    await exe(`UPDATE visitor_logs SET exit_time = NOW() WHERE id = ?`, [logId]);

    // notify owner
    await exe(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES (?, ?, ?, ?)`,
      [
        log.owner_id,
        "Visitor Left",
        `${log.visitor_name} has exited the premises.`,
        "EMAIL",
      ]
    );

    await audit(req.user.id, "VISITOR_EXIT", "visitor_logs", logId, getIp(req));

    logger.info(`Visitor exit recorded — log #${logId}`);

    return ok(res, { log_id: logId, visitor_id: log.visitor_id }, "Visitor exit recorded");
  } catch (e) {
    logger.error("visitor.markExit:", e.message);
    next(e);
  }
};

// ── GET /api/visitors/logs/:orgId — admin sees all visitor logs ───────────────

exports.listVisitorLogs = async (req, res, next) => {
  try {
    const orgId = Number(req.params.orgId);
    if (!orgId) return fail(res, "Invalid orgId", 400);

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    // optional filters
    const dateFrom = req.query.date_from || null;
    const dateTo = req.query.date_to || null;
    const unitFilter = req.query.unit_id ? Number(req.query.unit_id) : null;

    let countSql = `
      SELECT COUNT(*) AS total
      FROM visitor_logs vl
      JOIN visitors v ON v.id = vl.visitor_id
      JOIN units un ON un.id = vl.unit_id
      WHERE un.org_id = ?`;

    let sql = `
      SELECT vl.id AS log_id, vl.entry_time, vl.exit_time, vl.vehicle_number, vl.photo_url,
             v.id AS visitor_id, v.visitor_name, v.visitor_phone, v.purpose, v.expected_date,
             un.id AS unit_id, un.unit_name,
             sec.name AS security_name
      FROM visitor_logs vl
      JOIN visitors v ON v.id = vl.visitor_id
      JOIN units un ON un.id = vl.unit_id
      LEFT JOIN users sec ON sec.id = vl.security_id
      WHERE un.org_id = ?`;

    const params = [orgId];

    if (dateFrom) {
      countSql += ` AND DATE(vl.entry_time) >= ?`;
      sql += ` AND DATE(vl.entry_time) >= ?`;
      params.push(dateFrom);
    }
    if (dateTo) {
      countSql += ` AND DATE(vl.entry_time) <= ?`;
      sql += ` AND DATE(vl.entry_time) <= ?`;
      params.push(dateTo);
    }
    if (unitFilter) {
      countSql += ` AND vl.unit_id = ?`;
      sql += ` AND vl.unit_id = ?`;
      params.push(unitFilter);
    }

    const countRows = await exe(countSql, params);
    const total = countRows[0]?.total || 0;

    sql += ` ORDER BY vl.id DESC LIMIT ? OFFSET ?`;
    const rows = await exe(sql, [...params, limit, offset]);

    return ok(res, { logs: rows, total, page, limit }, "Visitor logs");
  } catch (e) {
    logger.error("visitor.listVisitorLogs:", e.message);
    next(e);
  }
};

// ── DELETE /api/visitors/:id — owner cancels visitor ──────────────────────────

exports.cancelVisitor = async (req, res, next) => {
  try {
    const visitorId = Number(req.params.id);
    if (!visitorId) return fail(res, "Invalid visitor id", 400);

    // verify visitor exists and belongs to this owner
    const visitors = await exe(
      `SELECT id, status, owner_id FROM visitors WHERE id = ? LIMIT 1`,
      [visitorId]
    );
    if (!visitors.length) return fail(res, "Visitor not found", 404);

    const visitor = visitors[0];
    if (Number(visitor.owner_id) !== Number(req.user.id)) {
      return fail(res, "This visitor is not yours", 403);
    }

    // can only cancel PENDING or APPROVED
    if (!["PENDING", "APPROVED"].includes(visitor.status)) {
      return fail(res, `Cannot cancel visitor with status: ${visitor.status}`, 400);
    }

    // check if visitor already has an entry log
    const activeLog = await exe(
      `SELECT id FROM visitor_logs WHERE visitor_id = ? LIMIT 1`,
      [visitorId]
    );
    if (activeLog.length) {
      return fail(res, "Cannot cancel — visitor already has an entry log", 400);
    }

    // delete the visitor record
    await exe(`DELETE FROM visitors WHERE id = ?`, [visitorId]);

    await audit(req.user.id, "VISITOR_CANCELLED", "visitors", visitorId, getIp(req));

    logger.info(`Visitor #${visitorId} cancelled by owner #${req.user.id}`);

    return ok(res, { id: visitorId }, "Visitor cancelled");
  } catch (e) {
    logger.error("visitor.cancelVisitor:", e.message);
    next(e);
  }
};
