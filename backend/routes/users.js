// ============================================
// FILE: routes/users.js
// User Management Routes
// ============================================

const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  changePassword,
  getMyProfile,
  updateMyProfile,
  getUserStats
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const userValidation = [
  body('username').trim().notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('role').isIn(['Admin', 'Security', 'Receptionist']).withMessage('Invalid role'),
  body('contact_no').matches(/^[0-9]{10}$/).withMessage('Invalid contact number'),
  body('email').isEmail().withMessage('Invalid email'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const passwordValidation = [
  body('new_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Apply authentication to all routes
router.use(protect);

// Current user routes (available to all authenticated users)
router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.put('/me/change-password', passwordValidation, validate, changePassword);

// Admin only routes
router.get('/', authorize('Admin'), getAllUsers);
router.get('/:id', authorize('Admin'), getUserById);
router.post('/', authorize('Admin'), userValidation, validate, createUser);
router.put('/:id', authorize('Admin'), userValidation.slice(0, -1), validate, updateUser);
router.delete('/:id', authorize('Admin'), deleteUser);
router.put('/:id/toggle-active', authorize('Admin'), toggleUserActive);
router.put('/:id/change-password', authorize('Admin'), passwordValidation, validate, changePassword);
router.get('/:id/stats', authorize('Admin'), getUserStats);

module.exports = router;