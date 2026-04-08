// src/services/report.service.js
const exe = require("../config/db");
const { TABLES } = require("../config/constants");

exports.auditLogs = async ({ user_id, entity, limit = 500 } = {}) => {
  let sql = `
    SELECT al.id, al.user_id, u.name AS user_name,
           al.action, al.entity, al.entity_id, al.ip_address, al.created_at
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.user_id
  `;
  const where = [];
  const params = [];

  if (user_id) { where.push("al.user_id=?"); params.push(user_id); }
  if (entity) { where.push("al.entity=?"); params.push(entity); }

  if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
  sql += ` ORDER BY al.id DESC LIMIT ${Number(limit)}`;

  return exe(sql, params);
};

exports.issuedKeys = async () => {
  return exe(
    `SELECT kt.id AS transaction_id, kt.key_id, k.key_code, k.key_type,
            kt.issued_to, ut.name AS issued_to_name,
            kt.issued_by, ub.name AS issued_by_name,
            kt.issue_time, kt.access_method, kt.status
     FROM key_transactions kt
     JOIN ${TABLES.KEYS} k ON k.id=kt.key_id
     JOIN users ut ON ut.id=kt.issued_to
     JOIN users ub ON ub.id=kt.issued_by
     WHERE kt.status='ISSUED' AND kt.return_time IS NULL
     ORDER BY kt.issue_time DESC`,
    []
  );
};

exports.overdueKeys = async (hours = 24) => {
  return exe(
    `SELECT kt.id AS transaction_id, kt.key_id, k.key_code, kt.issue_time,
            u.owner_id
     FROM key_transactions kt
     JOIN ${TABLES.KEYS} k ON k.id=kt.key_id
     JOIN units u ON u.id=k.unit_id
     WHERE kt.status='ISSUED' AND kt.return_time IS NULL
       AND kt.issue_time < (NOW() - INTERVAL ? HOUR)
     ORDER BY kt.issue_time ASC`,
    [Number(hours)]
  );
};
