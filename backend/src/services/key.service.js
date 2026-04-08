// src/services/key.service.js
const exe = require("../config/db");
const { TABLES } = require("../config/constants");

exports.createKey = async ({ unit_id, key_code, key_type, locker_no }) => {
  const unit = await exe(`SELECT id FROM units WHERE id=? AND status='ACTIVE'`, [unit_id]);
  if (unit.length === 0) throw Object.assign(new Error("Invalid or inactive unit"), { statusCode: 400 });

  const dup = await exe(`SELECT id FROM ${TABLES.KEYS} WHERE key_code=?`, [key_code]);
  if (dup.length) throw Object.assign(new Error("key_code already exists"), { statusCode: 409 });

  const result = await exe(
    `INSERT INTO ${TABLES.KEYS} (unit_id, key_code, key_type, locker_no) VALUES (?, ?, ?, ?)`,
    [unit_id, key_code, key_type || "MAIN", locker_no || null]
  );

  return { id: result.insertId, unit_id, key_code, key_type: key_type || "MAIN", locker_no: locker_no || null };
};

exports.listKeys = async ({ org_id, unit_id, status } = {}) => {
  let sql = `
    SELECT k.id, k.unit_id, u.unit_name, u.org_id, o.name AS org_name,
           k.key_code, k.key_type, k.locker_no, k.status, k.created_at
    FROM ${TABLES.KEYS} k
    JOIN units u ON u.id = k.unit_id
    JOIN organizations o ON o.id = u.org_id
  `;
  const where = [];
  const params = [];

  if (org_id) { where.push("u.org_id=?"); params.push(org_id); }
  if (unit_id) { where.push("k.unit_id=?"); params.push(unit_id); }
  if (status) { where.push("k.status=?"); params.push(status); }

  if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
  sql += ` ORDER BY k.id DESC`;

  return exe(sql, params);
};

exports.updateKey = async (id, { key_type, locker_no, status }) => {
  const existing = await exe(`SELECT id FROM ${TABLES.KEYS} WHERE id=?`, [id]);
  if (!existing.length) throw Object.assign(new Error("Key not found"), { statusCode: 404 });

  const fields = [];
  const params = [];
  if (key_type !== undefined) { fields.push("key_type=?"); params.push(key_type); }
  if (locker_no !== undefined) { fields.push("locker_no=?"); params.push(locker_no); }
  if (status !== undefined) { fields.push("status=?"); params.push(status); }

  if (!fields.length) throw Object.assign(new Error("No fields to update"), { statusCode: 400 });

  params.push(id);
  await exe(`UPDATE ${TABLES.KEYS} SET ${fields.join(", ")} WHERE id=?`, params);
  return true;
};

exports.listOwnerUnits = async (owner_id) => {
  return exe(
    `SELECT u.id, u.unit_name, u.org_id, o.name AS org_name, u.status
     FROM units u JOIN organizations o ON o.id=u.org_id
     WHERE u.owner_id=? ORDER BY u.id DESC`,
    [owner_id]
  );
};

exports.listOwnerKeys = async (owner_id) => {
  return exe(
    `SELECT k.id, k.key_code, k.key_type, k.locker_no, k.status,
            u.id AS unit_id, u.unit_name, o.id AS org_id, o.name AS org_name
     FROM ${TABLES.KEYS} k
     JOIN units u ON u.id=k.unit_id
     JOIN organizations o ON o.id=u.org_id
     WHERE u.owner_id=? ORDER BY k.id DESC`,
    [owner_id]
  );
};

exports.securityAssignedOrgs = async (security_user_id) => {
  return exe(
    `SELECT o.id, o.name, o.address, o.status, sa.assigned_at
     FROM security_assignments sa
     JOIN organizations o ON o.id=sa.org_id
     WHERE sa.user_id=? ORDER BY sa.id DESC`,
    [security_user_id]
  );
};
