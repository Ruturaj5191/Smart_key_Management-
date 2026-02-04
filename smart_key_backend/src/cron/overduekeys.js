// src/cron/overduekeys.js
const exe = require("../config/db");
const logger = require("../utils/logger");
const { OVERDUE_HOURS, CRON_INTERVAL_MIN } = require("../config/constants");

// Simple interval-based cron (no extra dependency)
async function checkOverdueKeys(hours) {
  const rows = await exe(
    `SELECT kt.id AS transaction_id, kt.key_id, kt.issue_time,
            k.key_code, u.owner_id
     FROM key_transactions kt
     JOIN keyss k ON k.id=kt.key_id
     JOIN units u ON u.id=k.unit_id
     WHERE kt.status='ISSUED' AND kt.return_time IS NULL
       AND kt.issue_time < (NOW() - INTERVAL ? HOUR)
     ORDER BY kt.issue_time ASC`,
    [Number(hours)]
  );

  for (const r of rows) {
    // Avoid spamming: check if notification already sent in last 24h
    const already = await exe(
      `SELECT id FROM notifications
       WHERE user_id=? AND title='Overdue key alert'
         AND message LIKE ? AND sent_at > (NOW() - INTERVAL 1 DAY)
       LIMIT 1`,
      [r.owner_id, `%Txn #${r.transaction_id}%`]
    );
    if (already.length) continue;

    await exe(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES (?, 'Overdue key alert', ?, 'EMAIL')`,
      [
        r.owner_id,
        `Key ${r.key_code} is overdue. Txn #${r.transaction_id}. Issued at ${r.issue_time}`,
      ]
    );

    await exe(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, ip_address)
       VALUES (?, 'OVERDUE_KEY_ALERT', 'key_transactions', ?, 'CRON')`,
      [r.owner_id, r.transaction_id]
    );
  }

  return rows.length;
}

let timer = null;

exports.startOverdueKeysCron = () => {
  if (timer) return;

  const intervalMs = CRON_INTERVAL_MIN * 60 * 1000;
  logger.info(`OverdueKeys cron started: every ${CRON_INTERVAL_MIN} min, overdue>${OVERDUE_HOURS}h`);

  timer = setInterval(async () => {
    try {
      const n = await checkOverdueKeys(OVERDUE_HOURS);
      if (n) logger.warn(`OverdueKeys: notified ${n} overdue transaction(s)`);
    } catch (e) {
      logger.error("OverdueKeys cron error:", e.message);
    }
  }, intervalMs);
};

exports.stopOverdueKeysCron = () => {
  if (timer) clearInterval(timer);
  timer = null;
};
