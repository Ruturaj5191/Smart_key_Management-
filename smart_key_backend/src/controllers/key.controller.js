const  exe  = require('../config/db');

/**
 * CREATE KEY (ADMIN / SUPER_ADMIN)
 * POST /api/keys
 */
exports.createKey = async (req, res, next) => {
  try {
    const { unit_id, key_code, key_type, locker_no } = req.body;

    // Check duplicate key_code
    const existing = await exe(
      'SELECT id FROM keyss WHERE key_code = ?',
      [key_code]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Key code already exists'
      });
    }

    await exe(
      `INSERT INTO keyss (unit_id, key_code, key_type, locker_no)
       VALUES (?, ?, ?, ?)`,
      [unit_id, key_code, key_type, locker_no]
    );

    res.status(201).json({
      success: true,
      message: 'Key created successfully'
    });
  } catch (err) {
    console.error('CREATE KEY ERROR:', err);
    next(err);
  }
};

/**
 * GET ALL KEYS (ADMIN / SUPER_ADMIN)
 * GET /api/keys
 */
exports.getAllKeys = async (req, res, next) => {
  try {
    const keys = await exe(
      `SELECT k.id, k.key_code, k.key_type, k.status, k.locker_no,
              u.unit_name
       FROM keyss k
       JOIN units u ON u.id = k.unit_id
       ORDER BY k.id DESC`
    );

    res.json({
      success: true,
      data: keys
    });
  } catch (err) {
    console.error('GET KEYS ERROR:', err);
    next(err);
  }
};

/**
 * UPDATE KEY STATUS / DETAILS (ADMIN)
 * PATCH /api/keys/:id
 */
exports.updateKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { key_type, locker_no, status } = req.body;

    const result = await exe(
      `UPDATE keyss
       SET key_type = ?, locker_no = ?, status = ?
       WHERE id = ?`,
      [key_type, locker_no, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Key not found'
      });
    }

    res.json({
      success: true,
      message: 'Key updated successfully'
    });
  } catch (err) {
    console.error('UPDATE KEY ERROR:', err);
    next(err);
  }
};
