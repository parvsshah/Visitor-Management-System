// ============================================
// FILE: routes/visitors.js
// Visitor Routes
// ============================================

const express = require('express');
const router = express.Router();
const {
  getAllVisitors,
  getVisitorById,
  createVisitor,
  updateVisitor,
  deleteVisitor,
  addToBlacklist,
  removeFromBlacklist,
  getVisitorHistory,
  searchVisitor
} = require('../controllers/visitorController');
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

// Visitor validation rules
const visitorValidation = [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('contact_no').trim().notEmpty().withMessage('Contact number is required')
    .isLength({ min: 10, max: 15 }).withMessage('Contact number must be 10-15 digits'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
  body('id_type').trim().notEmpty().withMessage('ID type is required'),
  body('id_number').trim().notEmpty().withMessage('ID number is required'),
  body('company_name').optional({ checkFalsy: true }),
  body('address').optional({ checkFalsy: true })
];

// Apply authentication to all routes
router.use(protect);

// Public routes (all authenticated users)
router.get('/', getAllVisitors);
router.get('/search', searchVisitor);
router.get('/:id', getVisitorById);
router.get('/:id/history', getVisitorHistory);

// Receptionist, Security, Admin routes
router.post('/', authorize('Receptionist', 'Admin'), visitorValidation, validate, createVisitor);
router.put('/:id', authorize('Receptionist', 'Admin'), visitorValidation, validate, updateVisitor);

// Admin only routes
router.post('/:id/blacklist', authorize('Admin'), addToBlacklist);
router.delete('/:id/blacklist', authorize('Admin'), removeFromBlacklist);
router.delete('/:id', authorize('Admin'), deleteVisitor);

module.exports = router;