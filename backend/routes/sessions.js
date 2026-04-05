// ============================================
// FILE: routes/sessions.js
// Visit Session Routes
// ============================================

const express = require('express');
const router = express.Router();
const {
  getAllSessions,
  getActiveVisitors,
  getSessionById,
  checkInVisitor,
  quickCheckIn,
  checkOutVisitor,
  updateSessionStatus,
  addVerificationLog,
  getTodaySummary,
  getOverstayVisitors
} = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// Public routes (all authenticated users)
router.get('/', getAllSessions);
router.get('/active', getActiveVisitors);
router.get('/today/summary', getTodaySummary);
router.get('/:id', getSessionById);

// Receptionist, Security, Admin routes
router.post('/checkin', authorize('Receptionist', 'Security', 'Admin'), checkInVisitor);
router.post('/quick-checkin', authorize('Receptionist', 'Security', 'Admin'), quickCheckIn);
router.put('/:id/checkout', authorize('Receptionist', 'Security', 'Admin'), checkOutVisitor);

// Security, Admin routes
router.get('/overstay/all', authorize('Security', 'Admin'), getOverstayVisitors);
router.put('/:id/status', authorize('Security', 'Admin'), updateSessionStatus);
router.post('/:id/verify', authorize('Security', 'Admin'), addVerificationLog);

module.exports = router;