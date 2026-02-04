// src/controllers/transaction.controller.js
// Handles issuing/returning keys (key_transactions) + updates key status + audit + notifications.

const exe = require("../config/db");

const KEY_TABLE = "keyss"; // change to "keys" if you rename the table later

// ---------- helpers ----------
async function logAudit({ userId, action, entity, entityId, ip }) {
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

async function notify({ userId, title, message, channel = "EMAIL" }) {
  try {
    await exe(
      `INSERT INTO notifications (user_id, title, message, channel)
       VALUES (?, ?, ?, ?)`,
      [userId, title, message, channel]
    );
  } catch (e) {
    console.error("NOTIFY_FAIL:", e.message);
  }
}

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

// ---------- ISSUE KEY ----------
/**
 * Body:
 *  - key_id (required)
 *  - issued_to (required)  -> user id who is taking key
 *  - access_method (required) -> OTP | QR | RFID
 *  - request_id (optional) -> key_requests.id (recommended)
 */
exports.issueKey = async (req, res, next) => {
  try {
    const { key_id, issued_to, access_method, request_id } = req.body;

    if (!key_id || !issued_to || !access_method) {
      return res.status(400).json({
        success: false,
        message: "key_id, issued_to and access_method are required",
      });
    }

    const method = String(access_method).toUpperCase();
    if (!["OTP", "QR", "RFID"].includes(method)) {
      return res.status(400).json({
        success: false,
        message: "access_method must be one of OTP, QR, RFID",
      });
    }

    // Validate issued_to user
    const issuedToUser = await exe(
      `SELECT id, name, status FROM users WHERE id = ?`,
      [issued_to]
    );
    if (issuedToUser.length === 0 || issuedToUser[0].status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "issued_to user is invalid or inactive",
      });
    }

    // Validate approved request (flow requirement)
    // If request_id provided -> validate it matches key + user and APPROVED
    // Else -> try to find latest APPROVED request for this key + user
    let approvedReqId = null;

    if (request_id) {
      const reqRows = await exe(
        `SELECT id, key_id, requested_by, status
         FROM key_requests
         WHERE id = ?`,
        [request_id]
      );
      if (reqRows.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid request_id" });
      }
      const r = reqRows[0];
      if (Number(r.key_id) !== Number(key_id) || Number(r.requested_by) !== Number(issued_to)) {
        return res.status(400).json({
          success: false,
          message: "request_id does not match key_id / issued_to",
        });
      }
      if (r.status !== "APPROVED") {
        return res.status(400).json({
          success: false,
          message: "Request is not APPROVED",
        });
      }
      approvedReqId = r.id;
    } else {
      const reqRows = await exe(
        `SELECT id
         FROM key_requests
         WHERE key_id = ? AND requested_by = ? AND status = 'APPROVED'
         ORDER BY requested_at DESC
         LIMIT 1`,
        [key_id, issued_to]
      );
      if (reqRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No APPROVED request found for this key and user (provide request_id or approve request first)",
        });
      }
      approvedReqId = reqRows[0].id;
    }

    // Start transaction to avoid double-issue
    await exe("START TRANSACTION");

    // Lock key row (InnoDB required)
    const keys = await exe(
      `SELECT k.id, k.status, k.key_code, k.unit_id, u.owner_id
       FROM ${KEY_TABLE} k
       JOIN units u ON u.id = k.unit_id
       WHERE k.id = ?
       FOR UPDATE`,
      [key_id]
    );

    if (keys.length === 0) {
      await exe("ROLLBACK");
      return res.status(400).json({ success: false, message: "Invalid key_id" });
    }

    const keyRow = keys[0];
    if (keyRow.status !== "AVAILABLE") {
      await exe("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: `Key is not AVAILABLE (current status: ${keyRow.status})`,
      });
    }

    // Ensure no open transaction exists for this key
    const openTx = await exe(
      `SELECT id
       FROM key_transactions
       WHERE key_id = ? AND status = 'ISSUED' AND return_time IS NULL
       FOR UPDATE`,
      [key_id]
    );
    if (openTx.length > 0) {
      await exe("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "This key is already issued (open transaction exists)",
      });
    }

    // Insert transaction
    const txResult = await exe(
      `INSERT INTO key_transactions (key_id, issued_to, issued_by, access_method, status)
       VALUES (?, ?, ?, ?, 'ISSUED')`,
      [key_id, issued_to, req.user.id, method]
    );

    // Update key status
    await exe(`UPDATE ${KEY_TABLE} SET status = 'ISSUED' WHERE id = ?`, [key_id]);

    await exe("COMMIT");

    // Audit + notifications (outside transaction)
    await logAudit({
      userId: req.user?.id,
      action: `ISSUE_KEY (request_id=${approvedReqId})`,
      entity: "key_transactions",
      entityId: txResult.insertId,
      ip: getClientIp(req),
    });

    // notify owner + issued_to
    if (keyRow.owner_id) {
      await notify({
        userId: keyRow.owner_id,
        title: "Key issued",
        message: `Key ${keyRow.key_code} was issued to user_id=${issued_to}. Txn #${txResult.insertId}`,
        channel: "EMAIL",
      });
    }
    await notify({
      userId: issued_to,
      title: "Key issued to you",
      message: `You received key ${keyRow.key_code}. Transaction #${txResult.insertId}`,
      channel: "EMAIL",
    });

    return res.status(201).json({
      success: true,
      message: "Key issued successfully",
      data: {
        transaction_id: txResult.insertId,
        key_id: Number(key_id),
        issued_to: Number(issued_to),
        issued_by: req.user.id,
        access_method: method,
        request_id: approvedReqId,
      },
    });
  } catch (err) {
    try {
      await exe("ROLLBACK");
    } catch (_) {}
    next(err);
  }
};

// ---------- RETURN KEY ----------
/**
 * Body:
 *  - transaction_id (optional)
 *  - key_id (optional)
 * One of them is required.
 */
exports.returnKey = async (req, res, next) => {
  try {
    const { transaction_id, key_id } = req.body;

    if (!transaction_id && !key_id) {
      return res.status(400).json({
        success: false,
        message: "transaction_id or key_id is required",
      });
    }

    await exe("START TRANSACTION");

    let txRows = [];
    if (transaction_id) {
      txRows = await exe(
        `SELECT kt.id, kt.key_id, kt.issued_to, kt.status, kt.return_time,
                k.key_code, k.unit_id, u.owner_id
         FROM key_transactions kt
         JOIN ${KEY_TABLE} k ON k.id = kt.key_id
         JOIN units u ON u.id = k.unit_id
         WHERE kt.id = ?
         FOR UPDATE`,
        [transaction_id]
      );
    } else {
      txRows = await exe(
        `SELECT kt.id, kt.key_id, kt.issued_to, kt.status, kt.return_time,
                k.key_code, k.unit_id, u.owner_id
         FROM key_transactions kt
         JOIN ${KEY_TABLE} k ON k.id = kt.key_id
         JOIN units u ON u.id = k.unit_id
         WHERE kt.key_id = ? AND kt.status='ISSUED' AND kt.return_time IS NULL
         ORDER BY kt.issue_time DESC
         LIMIT 1
         FOR UPDATE`,
        [key_id]
      );
    }

    if (txRows.length === 0) {
      await exe("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Open issued transaction not found",
      });
    }

    const tx = txRows[0];

    if (tx.status !== "ISSUED" || tx.return_time !== null) {
      await exe("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Transaction is not currently ISSUED/open",
      });
    }

    // Close transaction
    await exe(
      `UPDATE key_transactions
       SET status='RETURNED', return_time = NOW()
       WHERE id = ?`,
      [tx.id]
    );

    // Update key status back to AVAILABLE
    await exe(`UPDATE ${KEY_TABLE} SET status='AVAILABLE' WHERE id = ?`, [tx.key_id]);

    await exe("COMMIT");

    await logAudit({
      userId: req.user?.id,
      action: "RETURN_KEY",
      entity: "key_transactions",
      entityId: tx.id,
      ip: getClientIp(req),
    });

    // notify owner + issued_to
    if (tx.owner_id) {
      await notify({
        userId: tx.owner_id,
        title: "Key returned",
        message: `Key ${tx.key_code} has been returned. Txn #${tx.id}`,
        channel: "EMAIL",
      });
    }
    await notify({
      userId: tx.issued_to,
      title: "Key return recorded",
      message: `Return confirmed for key ${tx.key_code}. Transaction #${tx.id}`,
      channel: "EMAIL",
    });

    return res.status(200).json({
      success: true,
      message: "Key returned successfully",
      data: {
        transaction_id: tx.id,
        key_id: tx.key_id,
        status: "RETURNED",
      },
    });
  } catch (err) {
    try {
      await exe("ROLLBACK");
    } catch (_) {}
    next(err);
  }
};

// ---------- MARK LOST (optional) ----------
/**
 * PATCH /api/transactions/:id/lost
 */
exports.markLost = async (req, res, next) => {
  try {
    const txId = Number(req.params.id);
    if (!txId) {
      return res.status(400).json({ success: false, message: "Invalid transaction id" });
    }

    await exe("START TRANSACTION");

    const rows = await exe(
      `SELECT kt.id, kt.key_id, kt.status, kt.return_time,
              k.key_code
       FROM key_transactions kt
       JOIN ${KEY_TABLE} k ON k.id = kt.key_id
       WHERE kt.id = ?
       FOR UPDATE`,
      [txId]
    );

    if (rows.length === 0) {
      await exe("ROLLBACK");
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    const tx = rows[0];

    // Mark transaction lost
    await exe(
      `UPDATE key_transactions
       SET status='LOST', return_time = IFNULL(return_time, NOW())
       WHERE id = ?`,
      [txId]
    );

    // Mark key lost
    await exe(`UPDATE ${KEY_TABLE} SET status='LOST' WHERE id = ?`, [tx.key_id]);

    await exe("COMMIT");

    await logAudit({
      userId: req.user?.id,
      action: "MARK_KEY_LOST",
      entity: "key_transactions",
      entityId: txId,
      ip: getClientIp(req),
    });

    return res.status(200).json({
      success: true,
      message: "Key marked as LOST",
      data: { transaction_id: txId, key_id: tx.key_id, key_code: tx.key_code },
    });
  } catch (err) {
    try {
      await exe("ROLLBACK");
    } catch (_) {}
    next(err);
  }
};

// ---------- LIST OPEN ISSUED TRANSACTIONS (optional) ----------
exports.listOpenIssued = async (req, res, next) => {
  try {
    const rows = await exe(
      `SELECT kt.id AS transaction_id,
              kt.key_id, k.key_code, k.key_type,
              kt.issued_to, ut.name AS issued_to_name,
              kt.issued_by, ub.name AS issued_by_name,
              kt.issue_time, kt.access_method, kt.status
       FROM key_transactions kt
       JOIN ${KEY_TABLE} k ON k.id = kt.key_id
       JOIN users ut ON ut.id = kt.issued_to
       JOIN users ub ON ub.id = kt.issued_by
       WHERE kt.status = 'ISSUED' AND kt.return_time IS NULL
       ORDER BY kt.issue_time DESC`,
      []
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};
