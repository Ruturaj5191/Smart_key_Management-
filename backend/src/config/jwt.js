const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token
 */
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: '1d'
    }
  );
};

/**
 * Verify JWT Token
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken
};
