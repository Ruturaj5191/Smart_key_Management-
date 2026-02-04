// src/services/transaction.service.js
const exe = require("../config/db");
const { TABLES } = require("../config/constants");

exports.issueKey = async ({ key_id, issued_to, issued_by, access_method, request_id }) => {
  const method = String(access_method || "").toUpperCase();
  if (!["OTP", "QR", "RFID"].includes(method)) {
    throw Object.assign(new Error("access_method must be OTP/QR/RFID"), { statusCode: 400 });
  }

  // Load APPROVED request (must match key_id + issued_to)
  const reqRows = await exe(`SELECT * FROM key_requests WHERE id=?`, [request_id]);
  if (!reqRows.length) throw Object.assign(new Error("Invalid request_id"), { statusCode: 400 });

  const reqRow = reqRows[0];
  if (reqRow.status !== "APPROVED") throw Object.assign(new Error("Request is not APPROVED"), { statusCode: 400 });
  if (Number(reqRow.key_id) !== Number(key_id) || Number(reqRow.requested_by) !== Number(issued_to)) {
    throw Object.assign(new Error("request_id does not match key_id/issued_to"), { statusCode: 400 });
  }

  // Key must be AVAILABLE
  const keys = await exe(`SELECT id, status, key_code FROM keyss WHERE id=?`, [key_id]);
  if (!keys.length) throw Object.assign(new Error("Invalid key_id"), { statusCode: 400 });
  if (keys[0].status !== "AVAILABLE") throw Object.assign(new Error(`Key not AVAILABLE (${keys[0].status})`), { statusCode: 400 });

  // No open issue txn
  const open = await exe(
    `SELECT id FROM key_transactions WHERE key_id=? AND status='ISSUED' AND return_time IS NULL LIMIT 1`,
    [key_id]
  );
  if (open.length) throw Object.assign(new Error("Key already issued (open transaction exists)"), { statusCode: 400 });

  try {
    await exe("START TRANSACTION");

    const tx = await exe(
      `INSERT INTO key_transactions (key_id, request_id, issued_to, issued_by, access_method, status)
       VALUES (?, ?, ?, ?, ?, 'ISSUED')`,
      [key_id, reqRow.id, issued_to, issued_by, method]
    );

// key status
await exe(`UPDATE ${TABLES.KEYS} SET status='ISSUED' WHERE id=?`, [key_id]);

// ✅ close request
await exe(`UPDATE key_requests SET status='ISSUED' WHERE id=?`, [reqRow.id]);

    await exe("COMMIT");

    return {
      transaction_id: tx.insertId,
      key_id: Number(key_id),
      key_code: keys[0].key_code,
      issued_to: Number(issued_to),
      issued_by: Number(issued_by),
      access_method: method,
      request_id: reqRow.id,
    };
  } catch (e) {
    try { await exe("ROLLBACK"); } catch (_) {}
    throw e;
  }
};


exports.returnKey = async ({ key_id, transaction_id }) => {
  let rows = [];
  if (transaction_id) {
    rows = await exe(
      `SELECT kt.id, kt.key_id
       FROM key_transactions kt
       WHERE kt.id=?`,
      [transaction_id]
    );
  } else {
    rows = await exe(
      `SELECT kt.id, kt.key_id
       FROM key_transactions kt
       WHERE kt.key_id=? AND kt.status='ISSUED' AND kt.return_time IS NULL
       ORDER BY kt.issue_time DESC LIMIT 1`,
      [key_id]
    );
  }

  if (!rows.length) throw Object.assign(new Error("Open issued transaction not found"), { statusCode: 404 });
  const tx = rows[0];

  await exe(`UPDATE key_transactions SET status='RETURNED', return_time=NOW() WHERE id=?`, [tx.id]);
  await exe(`UPDATE ${TABLES.KEYS} SET status='AVAILABLE' WHERE id=?`, [tx.key_id]);

  return { transaction_id: tx.id, key_id: tx.key_id };
};

exports.markLost = async (transaction_id) => {
  const rows = await exe(
    `SELECT id, key_id FROM key_transactions WHERE id=?`,
    [transaction_id]
  );
  if (!rows.length) throw Object.assign(new Error("Transaction not found"), { statusCode: 404 });

  await exe(`UPDATE key_transactions SET status='LOST', return_time=IFNULL(return_time, NOW()) WHERE id=?`, [transaction_id]);
  await exe(`UPDATE ${TABLES.KEYS} SET status='LOST' WHERE id=?`, [rows[0].key_id]);

  return { transaction_id, key_id: rows[0].key_id };
};

exports.listOpenIssued = async () => {
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
