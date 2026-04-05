// ============================================
// FILE: controllers/reportController.js
// Reports and Analytics Operations
// ============================================

const db = require('../config/db');

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private (All roles)
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Today's summary
    const [todaySummary] = await db.query('SELECT * FROM vw_today_summary');

    // Active visitors count
    const [activeVisitors] = await db.query(
      'SELECT COUNT(*) as count FROM VISIT_SESSION WHERE Visit_Status = "Checked-In"'
    );

    // Overstay visitors count
    const [overstay] = await db.query(
      'SELECT COUNT(*) as count FROM VISIT_SESSION WHERE Visit_Status = "Overstay"'
    );

    // Total visitors (all time)
    const [totalVisitors] = await db.query(
      'SELECT COUNT(*) as count FROM VISITOR'
    );

    // Blacklisted visitors count
    const [blacklisted] = await db.query(
      'SELECT COUNT(*) as count FROM VISITOR WHERE Is_Blacklisted = TRUE'
    );

    // This week's visits
    const [weekVisits] = await db.query(
      `SELECT COUNT(*) as count FROM VISIT_SESSION 
       WHERE YEARWEEK(CheckIn_Time, 1) = YEARWEEK(CURDATE(), 1)`
    );

    // This month's visits
    const [monthVisits] = await db.query(
      `SELECT COUNT(*) as count FROM VISIT_SESSION 
       WHERE YEAR(CheckIn_Time) = YEAR(CURDATE()) 
       AND MONTH(CheckIn_Time) = MONTH(CURDATE())`
    );

    // Average visit duration (in minutes)
    const [avgDuration] = await db.query(
      `SELECT AVG(TIMESTAMPDIFF(MINUTE, CheckIn_Time, CheckOut_Time)) as avg_duration
       FROM VISIT_SESSION 
       WHERE CheckOut_Time IS NOT NULL 
       AND DATE(CheckIn_Time) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
    );

    res.status(200).json({
      success: true,
      data: {
        today: todaySummary[0],
        active_visitors: activeVisitors[0].count,
        overstay_visitors: overstay[0].count,
        total_visitors: totalVisitors[0].count,
        blacklisted_visitors: blacklisted[0].count,
        week_visits: weekVisits[0].count,
        month_visits: monthVisits[0].count,
        avg_duration_minutes: Math.round(avgDuration[0].avg_duration || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get visit statistics by date range
// @route   GET /api/reports/visits-by-date
// @access  Private (All roles)
exports.getVisitsByDate = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const [visits] = await db.query(
      `SELECT 
        DATE(CheckIn_Time) as visit_date,
        COUNT(*) as total_visits,
        SUM(CASE WHEN Visit_Status = 'Checked-Out' THEN 1 ELSE 0 END) as checked_out,
        SUM(CASE WHEN Visit_Status = 'Checked-In' THEN 1 ELSE 0 END) as still_inside,
        SUM(CASE WHEN Visit_Status = 'Overstay' THEN 1 ELSE 0 END) as overstays
       FROM VISIT_SESSION
       WHERE DATE(CheckIn_Time) BETWEEN ? AND ?
       GROUP BY DATE(CheckIn_Time)
       ORDER BY visit_date DESC`,
      [start_date, end_date]
    );

    res.status(200).json({
      success: true,
      data: visits
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get hourly visit distribution
// @route   GET /api/reports/hourly-distribution
// @access  Private (All roles)
exports.getHourlyDistribution = async (req, res, next) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const [distribution] = await db.query(
      `SELECT 
        HOUR(CheckIn_Time) as hour,
        COUNT(*) as visits
       FROM VISIT_SESSION
       WHERE DATE(CheckIn_Time) = ?
       GROUP BY HOUR(CheckIn_Time)
       ORDER BY hour`,
      [date]
    );

    // Fill in missing hours with 0 visits
    const fullDistribution = Array.from({ length: 24 }, (_, i) => {
      const hourData = distribution.find(d => d.hour === i);
      return {
        hour: i,
        visits: hourData ? hourData.visits : 0
      };
    });

    res.status(200).json({
      success: true,
      data: fullDistribution
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top visitors (frequent visitors)
// @route   GET /api/reports/top-visitors
// @access  Private (All roles)
exports.getTopVisitors = async (req, res, next) => {
  try {
    const { limit = 10, days = 30 } = req.query;

    const [visitors] = await db.query(
      `SELECT 
        v.Visitor_ID, v.Full_Name, v.Contact_No, v.Company_Name,
        COUNT(vs.Session_ID) as visit_count,
        MAX(vs.CheckIn_Time) as last_visit,
        AVG(TIMESTAMPDIFF(MINUTE, vs.CheckIn_Time, vs.CheckOut_Time)) as avg_duration
       FROM VISITOR v
       JOIN VISIT_SESSION vs ON v.Visitor_ID = vs.Visitor_ID
       WHERE vs.CheckIn_Time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY v.Visitor_ID
       ORDER BY visit_count DESC
       LIMIT ?`,
      [parseInt(days), parseInt(limit)]
    );

    res.status(200).json({
      success: true,
      data: visitors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get visit purposes breakdown
// @route   GET /api/reports/visit-purposes
// @access  Private (All roles)
exports.getVisitPurposes = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const [purposes] = await db.query(
      `SELECT 
        Visit_Purpose,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM VISIT_SESSION 
         WHERE CheckIn_Time >= DATE_SUB(CURDATE(), INTERVAL ? DAY))), 2) as percentage
       FROM VISIT_SESSION
       WHERE CheckIn_Time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY Visit_Purpose
       ORDER BY count DESC`,
      [parseInt(days), parseInt(days)]
    );

    res.status(200).json({
      success: true,
      data: purposes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get department-wise visits
// @route   GET /api/reports/department-wise
// @access  Private (All roles)
exports.getDepartmentWiseVisits = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const [departments] = await db.query(
      `SELECT 
        Host_Department,
        COUNT(*) as visit_count,
        COUNT(DISTINCT Visitor_ID) as unique_visitors
       FROM VISIT_SESSION
       WHERE CheckIn_Time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       AND Host_Department IS NOT NULL
       GROUP BY Host_Department
       ORDER BY visit_count DESC`,
      [parseInt(days)]
    );

    res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get vehicle statistics
// @route   GET /api/reports/vehicle-stats
// @access  Private (All roles)
exports.getVehicleStats = async (req, res, next) => {
  try {
    // Total vehicles
    const [totalVehicles] = await db.query(
      'SELECT COUNT(*) as count FROM VEHICLE'
    );

    // Vehicles by type
    const [vehicleTypes] = await db.query(
      `SELECT 
        Vehicle_Type,
        COUNT(*) as count
       FROM VEHICLE
       GROUP BY Vehicle_Type
       ORDER BY count DESC`
    );

    // Parking slot utilization
    const [parkingStats] = await db.query(
      `SELECT 
        COUNT(DISTINCT Parking_Slot) as occupied_slots,
        (SELECT Setting_Value FROM SYSTEM_SETTINGS WHERE Setting_Key = 'parking_slots_total') as total_slots
       FROM VEHICLE 
       WHERE Parking_Slot IS NOT NULL`
    );

    res.status(200).json({
      success: true,
      data: {
        total_vehicles: totalVehicles[0].count,
        vehicle_types: vehicleTypes,
        parking: {
          occupied: parkingStats[0].occupied_slots,
          total: parkingStats[0].total_slots,
          available: parkingStats[0].total_slots - parkingStats[0].occupied_slots
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get security officer performance
// @route   GET /api/reports/officer-performance
// @access  Private (Admin, Security)
exports.getOfficerPerformance = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const [performance] = await db.query(
      `SELECT 
        so.Officer_ID, so.Name, so.Shift,
        COUNT(DISTINCT vl.Log_ID) as total_verifications,
        COUNT(DISTINCT DATE(vl.Timestamp)) as days_active
       FROM SECURITY_OFFICER so
       LEFT JOIN VERIFICATION_LOG vl ON so.Officer_ID = vl.Officer_ID
         AND vl.Timestamp >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       WHERE so.Is_Active = TRUE
       GROUP BY so.Officer_ID
       ORDER BY total_verifications DESC`,
      [parseInt(days)]
    );

    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user activity report
// @route   GET /api/reports/user-activity
// @access  Private (Admin)
exports.getUserActivity = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const [activity] = await db.query(
      `SELECT 
        ua.User_ID, ua.Username, ua.Full_Name, ua.Role,
        COUNT(DISTINCT CASE WHEN vs.Checked_In_By = ua.User_ID THEN vs.Session_ID END) as checkins_performed,
        COUNT(DISTINCT CASE WHEN vs.Checked_Out_By = ua.User_ID THEN vs.Session_ID END) as checkouts_performed,
        MAX(CASE WHEN vs.Checked_In_By = ua.User_ID THEN vs.CheckIn_Time 
                 WHEN vs.Checked_Out_By = ua.User_ID THEN vs.CheckOut_Time END) as last_activity
       FROM USER_ACCOUNT ua
       LEFT JOIN VISIT_SESSION vs ON (ua.User_ID = vs.Checked_In_By OR ua.User_ID = vs.Checked_Out_By)
         AND vs.CheckIn_Time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       WHERE ua.Is_Active = TRUE
       GROUP BY ua.User_ID
       ORDER BY last_activity DESC`,
      [parseInt(days)]
    );

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overstay report
// @route   GET /api/reports/overstay-report
// @access  Private (Security, Admin)
exports.getOverstayReport = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;

    const [overstays] = await db.query(
      `SELECT 
        DATE(vs.CheckIn_Time) as date,
        COUNT(*) as overstay_count,
        AVG(TIMESTAMPDIFF(MINUTE, vs.Expected_CheckOut_Time, 
          IFNULL(vs.CheckOut_Time, NOW()))) as avg_overstay_minutes
       FROM VISIT_SESSION vs
       WHERE vs.CheckIn_Time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       AND vs.Expected_CheckOut_Time < IFNULL(vs.CheckOut_Time, NOW())
       GROUP BY DATE(vs.CheckIn_Time)
       ORDER BY date DESC`,
      [parseInt(days)]
    );

    // Current overstay visitors
    const [currentOverstays] = await db.query(
      `SELECT 
        v.Full_Name, v.Contact_No, vs.Host_Name, vs.Visit_Purpose,
        vs.Expected_CheckOut_Time,
        TIMESTAMPDIFF(MINUTE, vs.Expected_CheckOut_Time, NOW()) as overstay_minutes
       FROM VISIT_SESSION vs
       JOIN VISITOR v ON vs.Visitor_ID = v.Visitor_ID
       WHERE vs.Visit_Status = 'Overstay'
       ORDER BY overstay_minutes DESC`
    );

    res.status(200).json({
      success: true,
      data: {
        historical: overstays,
        current: currentOverstays
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export visit records (CSV format data)
// @route   GET /api/reports/export-visits
// @access  Private (Admin, Security)
exports.exportVisits = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const [visits] = await db.query(
      `SELECT 
        vs.Session_ID,
        v.Full_Name as Visitor_Name,
        v.Contact_No,
        v.Email,
        v.Company_Name,
        vs.Host_Name,
        vs.Host_Department,
        vs.Visit_Purpose,
        vs.CheckIn_Time,
        vs.CheckOut_Time,
        vs.Visit_Status,
        TIMESTAMPDIFF(MINUTE, vs.CheckIn_Time, IFNULL(vs.CheckOut_Time, NOW())) as Duration_Minutes
       FROM VISIT_SESSION vs
       JOIN VISITOR v ON vs.Visitor_ID = v.Visitor_ID
       WHERE DATE(vs.CheckIn_Time) BETWEEN ? AND ?
       ORDER BY vs.CheckIn_Time DESC`,
      [start_date, end_date]
    );

    res.status(200).json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get blacklist report
// @route   GET /api/reports/blacklist-report
// @access  Private (Security, Admin)
exports.getBlacklistReport = async (req, res, next) => {
  try {
    // Current blacklisted visitors
    const [blacklisted] = await db.query(
      `SELECT * FROM vw_blacklisted_visitors ORDER BY Blacklisted_Date DESC`
    );

    // Blacklist activity (additions/removals)
    const [activity] = await db.query(
      `SELECT 
        DATE(bl.Action_Date) as date,
        SUM(CASE WHEN bl.Action = 'Added' THEN 1 ELSE 0 END) as additions,
        SUM(CASE WHEN bl.Action = 'Removed' THEN 1 ELSE 0 END) as removals
       FROM BLACKLIST_LOG bl
       WHERE bl.Action_Date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(bl.Action_Date)
       ORDER BY date DESC`
    );

    res.status(200).json({
      success: true,
      data: {
        current_blacklisted: blacklisted,
        recent_activity: activity
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all verification logs
// @route   GET /api/reports/verification-logs
// @access  Private (Admin)
exports.getVerificationLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      start_date = '',
      end_date = '',
      action = ''
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        vl.Log_ID,
        vl.Session_ID,
        vl.Action,
        vl.Action_Details,
        vl.Timestamp,
        so.Name as Officer_Name,
        so.Shift as Officer_Shift,
        v.Full_Name as Visitor_Name,
        v.Contact_No as Visitor_Contact,
        vs.Visit_Purpose,
        vs.Host_Name
      FROM VERIFICATION_LOG vl
      LEFT JOIN SECURITY_OFFICER so ON vl.Officer_ID = so.Officer_ID
      LEFT JOIN VISIT_SESSION vs ON vl.Session_ID = vs.Session_ID
      LEFT JOIN VISITOR v ON vs.Visitor_ID = v.Visitor_ID
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM VERIFICATION_LOG vl
      LEFT JOIN VISIT_SESSION vs ON vl.Session_ID = vs.Session_ID
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    // Date range filter
    if (start_date && end_date) {
      query += ` AND DATE(vl.Timestamp) BETWEEN ? AND ?`;
      countQuery += ` AND DATE(vl.Timestamp) BETWEEN ? AND ?`;
      params.push(start_date, end_date);
      countParams.push(start_date, end_date);
    }

    // Action filter
    if (action) {
      query += ` AND vl.Action = ?`;
      countQuery += ` AND vl.Action = ?`;
      params.push(action);
      countParams.push(action);
    }

    query += ` ORDER BY vl.Timestamp DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [logs] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all visit sessions for reports
// @route   GET /api/reports/visit-sessions
// @access  Private (Admin)
exports.getAllVisitSessions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      start_date = '',
      end_date = '',
      status = '',
      visitor_name = ''
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        vs.Session_ID,
        vs.Visitor_ID,
        v.Full_Name as Visitor_Name,
        v.Contact_No,
        v.Email,
        v.Company_Name,
        vs.Host_Name,
        vs.Host_Department,
        vs.Host_Contact,
        vs.Visit_Purpose,
        vs.CheckIn_Time,
        vs.CheckOut_Time,
        vs.Expected_CheckOut_Time,
        vs.Visit_Status,
        vs.Number_Of_Visitors,
        vs.Remarks,
        TIMESTAMPDIFF(MINUTE, vs.CheckIn_Time, IFNULL(vs.CheckOut_Time, NOW())) as Duration_Minutes,
        u1.Full_Name as Checked_In_By_Name,
        u2.Full_Name as Checked_Out_By_Name
      FROM VISIT_SESSION vs
      JOIN VISITOR v ON vs.Visitor_ID = v.Visitor_ID
      LEFT JOIN USER_ACCOUNT u1 ON vs.Checked_In_By = u1.User_ID
      LEFT JOIN USER_ACCOUNT u2 ON vs.Checked_Out_By = u2.User_ID
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM VISIT_SESSION vs
      JOIN VISITOR v ON vs.Visitor_ID = v.Visitor_ID
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    // Date range filter
    if (start_date && end_date) {
      query += ` AND DATE(vs.CheckIn_Time) BETWEEN ? AND ?`;
      countQuery += ` AND DATE(vs.CheckIn_Time) BETWEEN ? AND ?`;
      params.push(start_date, end_date);
      countParams.push(start_date, end_date);
    }

    // Status filter
    if (status) {
      query += ` AND vs.Visit_Status = ?`;
      countQuery += ` AND vs.Visit_Status = ?`;
      params.push(status);
      countParams.push(status);
    }

    // Visitor name filter
    if (visitor_name) {
      query += ` AND v.Full_Name LIKE ?`;
      countQuery += ` AND v.Full_Name LIKE ?`;
      params.push(`%${visitor_name}%`);
      countParams.push(`%${visitor_name}%`);
    }

    query += ` ORDER BY vs.CheckIn_Time DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [sessions] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.status(200).json({
      success: true,
      data: sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};