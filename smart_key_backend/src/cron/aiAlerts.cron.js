// src/cron/aiAlerts.cron.js
const exe = require("../config/db");
const logger = require("../utils/logger");
const aiService = require("../services/ai.service");

// ── Check 1: Overdue keys (ISSUED > 8 hours) ─────────────────────────────────

async function checkOverdueKeys() {
  try {
    const rows = await exe(
      `SELECT kt.id AS transaction_id, kt.key_id, kt.issue_time,
              k.key_code, u.org_id, u.unit_name,
              usr.name AS issued_to_name
       FROM key_transactions kt
       JOIN keyss k ON k.id = kt.key_id
       JOIN units u ON u.id = k.unit_id
       JOIN users usr ON usr.id = kt.issued_to
       WHERE kt.status = 'ISSUED'
         AND kt.return_time IS NULL
         AND kt.issue_time < (NOW() - INTERVAL 8 HOUR)
       ORDER BY kt.issue_time ASC`
    );

    let count = 0;
    for (const r of rows) {
      const hoursSince = Math.round(
        (Date.now() - new Date(r.issue_time).getTime()) / (1000 * 60 * 60)
      );

      const alertId = await aiService.createAlert({
        orgId: r.org_id,
        alertType: "OVERDUE_KEY",
        entityId: r.transaction_id,
        entityType: "key_transactions",
        message: `Key "${r.key_code}" issued to ${r.issued_to_name} (unit: ${r.unit_name}) has been out for ${hoursSince} hours without return.`,
        severity: hoursSince > 24 ? "HIGH" : "MEDIUM",
      });
      if (alertId) count++;
    }

    return count;
  } catch (e) {
    logger.error("aiCron.checkOverdueKeys:", e.message);
    return 0;
  }
}

// ── Check 2: Suspicious visitor entries (11 PM – 5 AM) ───────────────────────

async function checkSuspiciousVisitors() {
  try {
    const rows = await exe(
      `SELECT vl.id AS log_id, vl.entry_time, vl.visitor_id,
              v.visitor_name, v.visitor_phone,
              un.org_id, un.unit_name
       FROM visitor_logs vl
       JOIN visitors v ON v.id = vl.visitor_id
       JOIN units un ON un.id = vl.unit_id
       WHERE DATE(vl.entry_time) = CURDATE()
         AND (
           HOUR(vl.entry_time) >= 23
           OR HOUR(vl.entry_time) < 5
         )
       ORDER BY vl.entry_time DESC`
    );

    let count = 0;
    for (const r of rows) {
      const entryHour = new Date(r.entry_time).getHours();
      const timeLabel = entryHour >= 23 ? "late night" : "early morning";

      const alertId = await aiService.createAlert({
        orgId: r.org_id,
        alertType: "UNUSUAL_VISITOR",
        entityId: r.log_id,
        entityType: "visitor_logs",
        message: `Visitor "${r.visitor_name}" (${r.visitor_phone}) entered unit "${r.unit_name}" at ${timeLabel} (${new Date(r.entry_time).toLocaleTimeString()}). This is outside normal visiting hours.`,
        severity: "HIGH",
      });
      if (alertId) count++;
    }

    return count;
  } catch (e) {
    logger.error("aiCron.checkSuspiciousVisitors:", e.message);
    return 0;
  }
}

// ── Check 3: Parking anomaly (same vehicle 3+ entries in a day) ──────────────

async function checkParkingAnomalies() {
  try {
    const rows = await exe(
      `SELECT pl.vehicle_number, ps.org_id,
              COUNT(*) AS entry_count,
              GROUP_CONCAT(pl.id ORDER BY pl.id ASC) AS log_ids
       FROM parking_logs pl
       JOIN parking_slots ps ON ps.id = pl.slot_id
       WHERE DATE(pl.entry_time) = CURDATE()
       GROUP BY pl.vehicle_number, ps.org_id
       HAVING entry_count >= 3
       ORDER BY entry_count DESC`
    );

    let count = 0;
    for (const r of rows) {
      const firstLogId = Number(r.log_ids.split(",")[0]);

      const alertId = await aiService.createAlert({
        orgId: r.org_id,
        alertType: "PARKING_ANOMALY",
        entityId: firstLogId,
        entityType: "parking_logs",
        message: `Vehicle "${r.vehicle_number}" has entered the parking area ${r.entry_count} times today. This is unusual and may need investigation.`,
        severity: r.entry_count >= 5 ? "HIGH" : "MEDIUM",
      });
      if (alertId) count++;
    }

    return count;
  } catch (e) {
    logger.error("aiCron.checkParkingAnomalies:", e.message);
    return 0;
  }
}

// ── Cron runner (every 30 minutes) ────────────────────────────────────────────

const AI_CRON_INTERVAL_MIN = Number(process.env.AI_CRON_INTERVAL_MIN || 30);

let timer = null;

async function runAllChecks() {
  try {
    logger.info("AI Alerts cron: running checks...");

    const [overdueCount, visitorCount, parkingCount] = await Promise.all([
      checkOverdueKeys(),
      checkSuspiciousVisitors(),
      checkParkingAnomalies(),
    ]);

    const totalAlerts = overdueCount + visitorCount + parkingCount;
    if (totalAlerts > 0) {
      logger.warn(
        `AI Alerts cron: created ${totalAlerts} alert(s) — overdue:${overdueCount}, visitor:${visitorCount}, parking:${parkingCount}`
      );
    } else {
      logger.info("AI Alerts cron: no new alerts.");
    }
  } catch (e) {
    logger.error("AI Alerts cron error:", e.message);
  }
}

exports.startAiAlertsCron = () => {
  if (timer) return;

  const intervalMs = AI_CRON_INTERVAL_MIN * 60 * 1000;
  logger.info(`AI Alerts cron started: every ${AI_CRON_INTERVAL_MIN} min`);

  // run once on startup (after 10s delay to let DB connect)
  setTimeout(() => {
    runAllChecks();
  }, 10000);

  timer = setInterval(runAllChecks, intervalMs);
};

exports.stopAiAlertsCron = () => {
  if (timer) clearInterval(timer);
  timer = null;
};
