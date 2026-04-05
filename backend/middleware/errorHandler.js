
// ============================================
// FILE: middleware/errorHandler.js
// ============================================
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // PostgreSQL duplicate key error
  if (err.code === '23505') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry - record already exists'
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
