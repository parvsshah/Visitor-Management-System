
// ============================================
// FILE: utils/validation.js
// ============================================
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
  body('contact_no')
  .trim()
  .isLength({ min: 10, max: 10 })
  .withMessage('Contact number must be 10 digits')
  .isNumeric()
  .withMessage('Contact number must contain only numbers'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('id_type').notEmpty().withMessage('ID type is required'),
  body('id_number').notEmpty().withMessage('ID number is required')
];

// Session validation rules
const sessionValidation = [
  body('visitor_id').isInt().withMessage('Valid visitor ID required'),
  body('host_name').trim().notEmpty().withMessage('Host name is required'),
  body('visit_purpose').trim().notEmpty().withMessage('Visit purpose is required')
];

// Login validation rules
const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

module.exports = {
  validate,
  visitorValidation,
  sessionValidation,
  loginValidation
};
