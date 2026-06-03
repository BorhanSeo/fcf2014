const jwt = require('jsonwebtoken');

/**
 * JWT Token Generate করে
 * @param {Object} payload - { id, role }
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
