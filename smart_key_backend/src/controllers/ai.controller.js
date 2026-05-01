// src/controllers/ai.controller.js
const exe = require("../config/db");
const { ok, fail } = require("../utils/response");
const logger = require("../utils/logger");
const aiService = require("../services/ai.service");

// ── POST /api/ai/chat — owner chatbot ("where is my key?") ───────────────────

exports.chat = async (req, res, next) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return fail(res, "question is required", 400);
    }

    const answer = await aiService.chat(req.user.id, question.trim());

    return ok(res, { question: question.trim(), answer }, "AI response");
  } catch (e) {
    logger.error("ai.chat:", e.message);

    // handle Gemini API errors gracefully
    if (e.message.includes("GEMINI_API_KEY")) {
      return fail(res, "AI service is not configured. Contact administrator.", 503);
    }
    next(e);
  }
};

// ── GET /api/ai/alerts/:orgId — get all AI alerts ────────────────────────────

exports.listAlerts = async (req, res, next) => {
  try {
    const orgId = Number(req.params.orgId);
    if (!orgId) return fail(res, "Invalid orgId", 400);

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    // optional filters
    const alertType = req.query.alert_type ? String(req.query.alert_type).toUpperCase() : null;
    const severity = req.query.severity ? String(req.query.severity).toUpperCase() : null;
    const isRead = req.query.is_read !== undefined ? req.query.is_read === "true" : null;

    let countSql = `SELECT COUNT(*) AS total FROM ai_alerts WHERE org_id = ?`;
    let sql = `SELECT id, org_id, alert_type, entity_id, entity_type,
                      message, severity, is_read, created_at
               FROM ai_alerts
               WHERE org_id = ?`;
    const params = [orgId];

    if (alertType && ["OVERDUE_KEY", "SUSPICIOUS_ACCESS", "PARKING_ANOMALY", "UNUSUAL_VISITOR"].includes(alertType)) {
      countSql += ` AND alert_type = ?`;
      sql += ` AND alert_type = ?`;
      params.push(alertType);
    }
    if (severity && ["LOW", "MEDIUM", "HIGH"].includes(severity)) {
      countSql += ` AND severity = ?`;
      sql += ` AND severity = ?`;
      params.push(severity);
    }
    if (isRead !== null) {
      countSql += ` AND is_read = ?`;
      sql += ` AND is_read = ?`;
      params.push(isRead);
    }

    const countRows = await exe(countSql, params);
    const total = countRows[0]?.total || 0;

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const rows = await exe(sql, [...params, limit, offset]);

    // unread count
    const unreadRows = await exe(
      `SELECT COUNT(*) AS unread FROM ai_alerts WHERE org_id = ? AND is_read = false`,
      [orgId]
    );

    return ok(res, {
      alerts: rows,
      total,
      unread: unreadRows[0]?.unread || 0,
      page,
      limit,
    }, "AI alerts");
  } catch (e) {
    logger.error("ai.listAlerts:", e.message);
    next(e);
  }
};

// ── PUT /api/ai/alerts/:id/read — mark alert as read ─────────────────────────

exports.markAlertRead = async (req, res, next) => {
  try {
    const alertId = Number(req.params.id);
    if (!alertId) return fail(res, "Invalid alert id", 400);

    const alert = await exe(
      `SELECT id, is_read FROM ai_alerts WHERE id = ? LIMIT 1`,
      [alertId]
    );
    if (!alert.length) return fail(res, "Alert not found", 404);

    if (alert[0].is_read) {
      return ok(res, { id: alertId, is_read: true }, "Alert already read");
    }

    await exe(`UPDATE ai_alerts SET is_read = true WHERE id = ?`, [alertId]);

    return ok(res, { id: alertId, is_read: true }, "Alert marked as read");
  } catch (e) {
    logger.error("ai.markAlertRead:", e.message);
    next(e);
  }
};
