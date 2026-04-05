// ============================================
// FILE: routes/reports.js
// Report & Analytics Routes
// ============================================

const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getVisitsByDate,
  getHourlyDistribution,
  getTopVisitors,
  getVisitPurposes,
  getDepartmentWiseVisits,
  getVehicleStats,
  getOfficerPerformance,
  getUserActivity,
  getOverstayReport,
  exportVisits,
  getBlacklistReport,
  getVerificationLogs,
  getAllVisitSessions
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);

// Public routes (all authenticated users)
router.get('/dashboard', getDashboardStats);
router.get('/visits-by-date', getVisitsByDate);
router.get('/hourly-distribution', getHourlyDistribution);
router.get('/top-visitors', getTopVisitors);
router.get('/visit-purposes', getVisitPurposes);
router.get('/department-wise', getDepartmentWiseVisits);
router.get('/vehicle-stats', getVehicleStats);

// Security, Admin routes
router.get('/officer-performance', authorize('Security', 'Admin'), getOfficerPerformance);
router.get('/overstay-report', authorize('Security', 'Admin'), getOverstayReport);
router.get('/export-visits', authorize('Security', 'Admin'), exportVisits);
router.get('/blacklist-report', authorize('Security', 'Admin'), getBlacklistReport);

// Admin only routes
router.get('/user-activity', authorize('Admin'), getUserActivity);
router.get('/verification-logs', authorize('Admin'), getVerificationLogs);
router.get('/visit-sessions', authorize('Admin'), getAllVisitSessions);

module.exports = router;