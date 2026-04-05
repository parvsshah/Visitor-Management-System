// THIS IS REQUIRED!
// Without this, login won't work

const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  logout,
  verifyToken,
  changePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Login validation
const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Public routes
router.post('/login', loginValidation, validate, login);
router.post('/register', register);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.get('/verify', protect, verifyToken);
router.put('/change-password', protect, changePassword);

module.exports = router;