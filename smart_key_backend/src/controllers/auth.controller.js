const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const exe = require('../config/db');
const { generateToken } = require("../config/jwt");

exports.register = async (req, res, next) => {
  try {
    const { name, email, mobile, password, role_id } = req.body;

    // Check user exists
    const existing = await exe(
      'SELECT id FROM users WHERE email = ? OR mobile = ?',
      [email, mobile]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await exe(
      `INSERT INTO users (name, email, mobile, password, role_id)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, mobile, hashedPassword, role_id]
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    console.log('LOGIN BODY:', req.body);

    const { email, password } = req.body;

    const users = await exe(
      `SELECT id, name, email, password, role_id, status
       FROM users WHERE email = ?`,
      [email]
    );

    console.log('USER FROM DB:', users);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    console.log('DB PASSWORD:', user.password);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('PASSWORD MATCH:', isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('JWT SECRET:', process.env.JWT_SECRET);

const token = generateToken({ id: user.id, role_id: user.role_id });

    res.json({
      success: true,
      message: 'Login successful',
      token
    });
  } catch (err) {
    console.error('❌ LOGIN CONTROLLER ERROR:', err);
    next(err);
  }
};


exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const users = await exe(
      `SELECT id,name,email,mobile,role_id,status
       FROM users WHERE id=?`,
      [userId]
    );
    
    if (!req.user?.id) {
  return res.status(401).json({ success: false, message: "Unauthorized" });
}


    res.status(200).json({
      success: true,
      data: users[0]
    });
  } catch (err) {
    next(err);
  }
};