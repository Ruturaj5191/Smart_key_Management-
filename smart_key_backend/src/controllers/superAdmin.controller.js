const bcrypt = require("bcrypt");
const exe = require("../config/db");

// ✅ GET /api/superadmin/roles
exports.listRoles = async (req, res, next) => {
  try {
    const rows = await exe(`SELECT id, name, created_at FROM roles ORDER BY id ASC`, []);
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// ✅ GET /api/superadmin/users?role_id=4&status=ACTIVE&q=abc
exports.listUsers = async (req, res, next) => {
  try {
    const { role_id, status, q } = req.query;

    let sql = `
      SELECT u.id, u.name, u.email, u.mobile, u.role_id, r.name AS role_name, u.status, u.created_at
      FROM users u
      JOIN roles r ON r.id = u.role_id
    `;
    const where = [];
    const params = [];

    if (role_id) {
      where.push("u.role_id = ?");
      params.push(Number(role_id));
    }
    if (status) {
      where.push("u.status = ?");
      params.push(status);
    }
    if (q) {
      where.push("(u.name LIKE ? OR u.email LIKE ? OR u.mobile LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
    sql += ` ORDER BY u.id DESC`;

    const rows = await exe(sql, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// ✅ POST /api/superadmin/users  (SuperAdmin only)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, mobile, password, role_id } = req.body;

    if (!name || !email || !password || !role_id) {
      return res.status(400).json({ success: false, message: "name, email, password, role_id required" });
    }

    const exists = await exe(
      `SELECT id FROM users WHERE email = ? OR mobile = ?`,
      [email, mobile || null]
    );
    if (exists.length) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await exe(
      `INSERT INTO users (name, email, mobile, password, role_id)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, mobile || null, hashed, Number(role_id)]
    );

    return res.status(201).json({
      success: true,
      message: "User created",
      data: { id: result.insertId, name, email, mobile: mobile || null, role_id: Number(role_id) }
    });
  } catch (err) {
    next(err);
  }
};

// ✅ PATCH /api/superadmin/users/:id  (SuperAdmin only)
exports.updateUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, email, mobile, role_id } = req.body;

    const rows = await exe(`SELECT id FROM users WHERE id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "User not found" });

    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push("name=?"); params.push(name); }
    if (email !== undefined) { updates.push("email=?"); params.push(email); }
    if (mobile !== undefined) { updates.push("mobile=?"); params.push(mobile); }
    if (role_id !== undefined) { updates.push("role_id=?"); params.push(Number(role_id)); }

    if (!updates.length) return res.status(400).json({ success: false, message: "No fields to update" });

    params.push(id);
    await exe(`UPDATE users SET ${updates.join(", ")} WHERE id=?`, params);

    return res.json({ success: true, message: "User updated" });
  } catch (err) {
    next(err);
  }
};

// ✅ PATCH /api/superadmin/users/:id/status  (SuperAdmin only)
exports.updateUserStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be ACTIVE or INACTIVE" });
    }

    await exe(`UPDATE users SET status=? WHERE id=?`, [status, id]);
    return res.json({ success: true, message: "Status updated" });
  } catch (err) {
    next(err);
  }
};
