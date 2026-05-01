// src/services/ai.service.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const exe = require("../config/db");
const logger = require("../utils/logger");

// ── Gemini client (lazy init) ─────────────────────────────────────────────────

let genAI = null;
let model = null;

function getModel() {
  if (!model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }
  return model;
}

// ── Chat: owner asks questions about their keys/visitors ──────────────────────

/**
 * @param {number} userId  – the owner's user id
 * @param {string} question – free-text question from the owner
 * @returns {string} AI-generated answer
 */
exports.chat = async (userId, question) => {
  // 1. Gather owner context from DB
  const [keys, requests, transactions, visitors, bookings] = await Promise.all([
    exe(
      `SELECT k.key_code, k.key_type, k.status, u.unit_name, o.name AS org_name
       FROM keyss k
       JOIN units u ON u.id = k.unit_id
       JOIN organizations o ON o.id = u.org_id
       WHERE u.owner_id = ?
       ORDER BY k.id DESC LIMIT 20`,
      [userId]
    ),
    exe(
      `SELECT kr.id, k.key_code, kr.status, kr.requested_at
       FROM key_requests kr
       JOIN keyss k ON k.id = kr.key_id
       WHERE kr.requested_by = ?
       ORDER BY kr.id DESC LIMIT 10`,
      [userId]
    ),
    exe(
      `SELECT kt.id, k.key_code, kt.status, kt.issue_time, kt.return_time, kt.access_method
       FROM key_transactions kt
       JOIN keyss k ON k.id = kt.key_id
       WHERE kt.issued_to = ?
       ORDER BY kt.id DESC LIMIT 10`,
      [userId]
    ),
    exe(
      `SELECT v.visitor_name, v.visitor_phone, v.expected_date, v.status,
              vl.entry_time, vl.exit_time
       FROM visitors v
       LEFT JOIN visitor_logs vl ON vl.visitor_id = v.id
       WHERE v.owner_id = ?
       ORDER BY v.id DESC LIMIT 10`,
      [userId]
    ),
    exe(
      `SELECT pb.vehicle_number, pb.booking_date, pb.start_time, pb.end_time,
              pb.status, ps.slot_number, ps.floor
       FROM parking_bookings pb
       JOIN parking_slots ps ON ps.id = pb.slot_id
       WHERE pb.owner_id = ?
       ORDER BY pb.id DESC LIMIT 10`,
      [userId]
    ),
  ]);

  // 2. Build system prompt with context
  const systemPrompt = `You are a helpful Smart Key Management assistant. Answer questions about the owner's keys, visitors, and parking using ONLY the data provided below. Be concise and friendly. If you don't have enough data, say so.

=== OWNER's KEYS ===
${keys.length ? JSON.stringify(keys, null, 2) : "No keys found."}

=== RECENT KEY REQUESTS ===
${requests.length ? JSON.stringify(requests, null, 2) : "No recent requests."}

=== RECENT TRANSACTIONS ===
${transactions.length ? JSON.stringify(transactions, null, 2) : "No recent transactions."}

=== RECENT VISITORS ===
${visitors.length ? JSON.stringify(visitors, null, 2) : "No recent visitors."}

=== PARKING BOOKINGS ===
${bookings.length ? JSON.stringify(bookings, null, 2) : "No parking bookings."}
`;

  // 3. Call Gemini
  const geminiModel = getModel();
  const result = await geminiModel.generateContent([
    { text: systemPrompt },
    { text: `User question: ${question}` },
  ]);

  const response = result.response;
  const text = response.text();

  return text;
};

// ── Alert creation helper ─────────────────────────────────────────────────────

/**
 * Insert an AI alert (de-duplicated by entity_type + entity_id + alert_type within 24h)
 */
exports.createAlert = async ({ orgId, alertType, entityId, entityType, message, severity }) => {
  // avoid duplicate alerts within 24 hours
  const existing = await exe(
    `SELECT id FROM ai_alerts
     WHERE alert_type = ? AND entity_type = ? AND entity_id = ?
       AND created_at > (NOW() - INTERVAL 1 DAY)
     LIMIT 1`,
    [alertType, entityType, entityId]
  );
  if (existing.length) return null;

  const result = await exe(
    `INSERT INTO ai_alerts (org_id, alert_type, entity_id, entity_type, message, severity)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [orgId || null, alertType, entityId || null, entityType || null, message, severity || "MEDIUM"]
  );

  logger.info(`AI Alert created: [${alertType}] ${message} (id=${result.insertId})`);
  return result.insertId;
};
