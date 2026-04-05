
// ============================================
// FILE: utils/helpers.js
// ============================================
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.User_ID,
      username: user.Username,
      role: user.Role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Format date for MySQL
const formatDateForMySQL = (date) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

// Calculate duration between two dates in minutes
const calculateDuration = (startDate, endDate) => {
  const diff = Math.abs(new Date(endDate) - new Date(startDate));
  return Math.floor(diff / 60000); // Convert to minutes
};

module.exports = {
  generateToken,
  formatDateForMySQL,
  calculateDuration
};
