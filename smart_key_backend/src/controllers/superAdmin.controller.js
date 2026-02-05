const bcrypt = require("bcrypt");
const exe = require("../config/db");
const { ok } = require("../utils/response");          // ✅ ADD
const { ROLE } = require("../config/constants");  

// ✅ GET /api/superadmin/roles
exports.listRoles = async (req, res, next) => {
  try {
    const rows = await exe(`SELECT id, name, created_at FROM roles ORDER BY id ASC`, []);
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

// // ✅ GET /api/superadmin/users?role_id=4&status=ACTIVE&q=abc
// exports.listUsers = async (req, res, next) => {
//   try {
//     const { role_id, status, q } = req.query;

//     let sql = `
//       SELECT u.id, u.name, u.email, u.mobile, u.role_id, r.name AS role_name, u.status, u.created_at
//       FROM users u
//       JOIN roles r ON r.id = u.role_id
//     `;
//     const where = [];
//     const params = [];

//     if (role_id) {
//       where.push("u.role_id = ?");
//       params.push(Number(role_id));
//     }
//     if (status) {
//       where.push("u.status = ?");
//       params.push(status);
//     }
//     if (q) {
//       where.push("(u.name LIKE ? OR u.email LIKE ? OR u.mobile LIKE ?)");
//       params.push(`%${q}%`, `%${q}%`, `%${q}%`);
//     }

//     if (where.length) sql += ` WHERE ${where.join(" AND ")}`;
//     sql += ` ORDER BY u.id DESC`;

//     const rows = await exe(sql, params);
//     return res.json({ success: true, data: rows });
//   } catch (err) {
//     next(err);
//   }
// };

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




// exports.overview = async (req, res, next) => {
//   try {
//     // ---- totals ----
//     const [orgTotal] = await exe(`SELECT COUNT(*) AS c FROM organizations`, []);
//     const [unitTotal] = await exe(`SELECT COUNT(*) AS c FROM units`, []);
//     const [ownerTotal] = await exe(
//       `SELECT COUNT(*) AS c FROM users WHERE role_id = ?`,
//       [ROLE.OWNER]
//     );
//     const [securityTotal] = await exe(
//       `SELECT COUNT(*) AS c FROM users WHERE role_id = ?`,
//       [ROLE.SECURITY]
//     );

//     // ---- orgs + units + owner ----
//     const orgUnitRows = await exe(
//       `
//       SELECT
//         o.id   AS org_id,
//         o.name AS org_name,
//         o.address,
//         o.phone_number,
//         o.status AS org_status,

//         u.id   AS unit_id,
//         u.unit_name,
//         u.status AS unit_status,
//         u.owner_id,
//         ow.name AS owner_name
//       FROM organizations o
//       LEFT JOIN units u      ON u.org_id = o.id
//       LEFT JOIN users ow     ON ow.id = u.owner_id
//       ORDER BY o.id DESC, u.id DESC
//       `,
//       []
//     );

//     // ---- security assignments per org ----
//     const secRows = await exe(
//       `
//       SELECT
//         sa.org_id,
//         su.id   AS security_id,
//         su.name AS security_name
//       FROM security_assignments sa
//       JOIN users su ON su.id = sa.user_id
//       ORDER BY sa.org_id DESC
//       `,
//       []
//     );

//     // ---- build nested response ----
//     const orgMap = new Map();

//     for (const r of orgUnitRows) {
//       if (!orgMap.has(r.org_id)) {
//         orgMap.set(r.org_id, {
//           org_id: r.org_id,
//           org_name: r.org_name,
//           address: r.address,
//           phone_number: r.phone_number,
//           org_status: r.org_status,
//           units: [],
//           security_users: [],
//         });
//       }

//       // add unit only if exists
//       if (r.unit_id) {
//         orgMap.get(r.org_id).units.push({
//           unit_id: r.unit_id,
//           unit_name: r.unit_name,
//           unit_status: r.unit_status,
//           owner_id: r.owner_id,
//           owner_name: r.owner_name,
//         });
//       }
//     }

//     // attach security users
//     for (const s of secRows) {
//       if (!orgMap.has(s.org_id)) continue;
//       orgMap.get(s.org_id).security_users.push({
//         security_id: s.security_id,
//         security_name: s.security_name,
//       });
//     }

//     // optional: add org-level counts
//     const organizations = Array.from(orgMap.values()).map((o) => {
//       const uniqueOwners = new Set(o.units.map((u) => u.owner_id).filter(Boolean));
//       return {
//         ...o,
//         total_units: o.units.length,
//         total_owners: uniqueOwners.size,
//         total_security: o.security_users.length,
//       };
//     });

//     return ok(
//       res,
//       {
//         totals: {
//           organizations: orgTotal.c,
//           units: unitTotal.c,
//           owners: ownerTotal.c,
//           security: securityTotal.c,
//         },
//         organizations,
//       },
//       "SuperAdmin overview"
//     );
//   } catch (e) {
//     next(e);
//   }
// };



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

// ✅ overview API (SuperAdmin home page)
exports.overview = async (req, res, next) => {
  try {
    // ---- totals ----
    const [orgTotal] = await exe(`SELECT COUNT(*) AS c FROM organizations`, []);
    const [unitTotal] = await exe(`SELECT COUNT(*) AS c FROM units`, []);
    const [ownerTotal] = await exe(`SELECT COUNT(*) AS c FROM users WHERE role_id = ?`, [ROLE.OWNER]);
    const [securityTotal] = await exe(`SELECT COUNT(*) AS c FROM users WHERE role_id = ?`, [ROLE.SECURITY]);

    // ---- orgs + units + owner ----
    const orgUnitRows = await exe(
      `
      SELECT
        o.id   AS org_id,
        o.name AS org_name,
        o.address,
        o.phone_number,     -- ✅ requires column in DB
        o.status AS org_status,

        u.id   AS unit_id,
        u.unit_name,
        u.status AS unit_status,
        u.owner_id,
        ow.name AS owner_name
      FROM organizations o
      LEFT JOIN units u  ON u.org_id = o.id
      LEFT JOIN users ow ON ow.id = u.owner_id
      ORDER BY o.id DESC, u.id DESC
      `,
      []
    );

    // ---- security assignments per org ----
    const secRows = await exe(
      `
      SELECT
        sa.org_id,
        su.id   AS security_id,
        su.name AS security_name
      FROM security_assignments sa
      JOIN users su ON su.id = sa.user_id
      ORDER BY sa.org_id DESC
      `,
      []
    );

    // ---- build nested response ----
    const orgMap = new Map();

    for (const r of orgUnitRows) {
      if (!orgMap.has(r.org_id)) {
        orgMap.set(r.org_id, {
          org_id: r.org_id,
          org_name: r.org_name,
          address: r.address,
          phone_number: r.phone_number,
          org_status: r.org_status,
          units: [],
          security_users: [],
        });
      }

      if (r.unit_id) {
        orgMap.get(r.org_id).units.push({
          unit_id: r.unit_id,
          unit_name: r.unit_name,
          unit_status: r.unit_status,
          owner_id: r.owner_id,
          owner_name: r.owner_name,
        });
      }
    }

    for (const s of secRows) {
      if (!orgMap.has(s.org_id)) continue;
      orgMap.get(s.org_id).security_users.push({
        security_id: s.security_id,
        security_name: s.security_name,
      });
    }

    const organizations = Array.from(orgMap.values()).map((o) => {
      const uniqueOwners = new Set(o.units.map((u) => u.owner_id).filter(Boolean));
      return {
        ...o,
        total_units: o.units.length,
        total_owners: uniqueOwners.size,
        total_security: o.security_users.length,
      };
    });

    return ok(
      res,
      {
        totals: {
          organizations: orgTotal.c || 0,
          units: unitTotal.c || 0,
          owners: ownerTotal.c || 0,
          security: securityTotal.c || 0,
        },
        organizations,
      },
      "SuperAdmin overview"
    );
  } catch (e) {
    next(e);
  }
};

