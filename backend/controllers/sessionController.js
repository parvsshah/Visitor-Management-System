// ============================================
// FILE: controllers/sessionController.js
// Visit Session Management Operations
// ============================================

const db = require('../config/db');

// @desc    Get all visit sessions with filters
// @route   GET /api/sessions
// @access  Private (All roles)
exports.getAllSessions = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = '', 
      date = '',
      visitor_name = ''
    } = req.query;
    
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        vs.Session_ID, vs.Visitor_ID, v.Full_Name, v.Contact_No,
        vs.Host_Name, vs.Host_Department, vs.Visit_Purpose,
        vs.CheckIn_Time, vs.CheckOut_Time, vs.Expected_CheckOut_Time,
        vs.Visit_Status, vs.Number_Of_Visitors, vs.Remarks,
        EXTRACT(EPOCH FROM (COALESCE(vs.CheckOut_Time, NOW()) - vs.CheckIn_Time))/60 as Duration_Minutes
      FROM VISIT_SESSION vs
      JOIN VISITOR v ON vs.Visitor_ID = v.Visitor_ID
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

    // Status filter
    if (status) {
      query += ` AND vs.Visit_Status = ?`;
      countQuery += ` AND vs.Visit_Status = ?`;
      params.push(status);
      countParams.push(status);
    }

    // Date filter
    if (date) {
      query += ` AND DATE(vs.CheckIn_Time) = ?`;
      countQuery += ` AND DATE(vs.CheckIn_Time) = ?`;
      params.push(date);
      countParams.push(date);
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

// @desc    Get active visitors (currently inside)
// @route   GET /api/sessions/active
// @access  Private (All roles)
exports.getActiveVisitors = async (req, res, next) => {
  try {
    const [visitors] = await db.query('SELECT * FROM sp_get_active_visitors()');

    res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single session by ID
// @route   GET /api/sessions/:id
// @access  Private (All roles)
exports.getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [session] = await db.query(
      `SELECT 
        vs.*, v.Full_Name, v.Contact_No, v.Email, v.Company_Name,
        EXTRACT(EPOCH FROM (COALESCE(vs.CheckOut_Time, NOW()) - vs.CheckIn_Time))/60 as Duration_Minutes
       FROM VISIT_SESSION vs
       JOIN VISITOR v ON vs.Visitor_ID = v.Visitor_ID
       WHERE vs.Session_ID = ?`,
      [id]
    );

    if (session.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Get verification logs for this session
    const [logs] = await db.query(
      `SELECT vl.*, so.Name as Officer_Name
       FROM VERIFICATION_LOG vl
       LEFT JOIN SECURITY_OFFICER so ON vl.Officer_ID = so.Officer_ID
       WHERE vl.Session_ID = ?
       ORDER BY vl.Timestamp DESC`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        session: session[0],
        verification_logs: logs
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-in visitor (Register new visitor and create session)
// @route   POST /api/sessions/checkin
// @access  Private (Receptionist, Security, Admin)
exports.checkInVisitor = async (req, res, next) => {
  try {
    const {
      // Visitor details
      full_name,
      gender,
      contact_no,
      email,
      id_type,
      id_number,
      company_name,
      address,
      // Session details
      host_name,
      host_department,
      host_contact,
      visit_purpose,
      expected_checkout_time,
      number_of_visitors = 1
    } = req.body;

    // Check if visitor is blacklisted
    const [blacklisted] = await db.query(
      'SELECT Is_Blacklisted FROM VISITOR WHERE (Contact_No = ? OR ID_Number = ?) AND Is_Blacklisted = TRUE',
      [contact_no, id_number]
    );

    if (blacklisted.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'This visitor is blacklisted and cannot check in'
      });
    }

    // Call stored function for registration and check-in
    const [result] = await db.query(
      `SELECT * FROM sp_register_and_checkin(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name, gender, contact_no, email, id_type, id_number, company_name,
        host_name, host_department, host_contact, visit_purpose,
        expected_checkout_time, req.user.id
      ]
    );

    const sessionId = result[0].session_id;

    // Fetch complete session details
    const [sessionDetails] = await db.query(
      `SELECT vs.*, v.Full_Name, v.Contact_No 
       FROM VISIT_SESSION vs
       JOIN VISITOR v ON vs.Visitor_ID = v.Visitor_ID
       WHERE vs.Session_ID = ?`,
      [sessionId]
    );

    res.status(201).json({
      success: true,
      message: 'Visitor checked in successfully',
      data: sessionDetails[0]
    });
  } catch (error) {
    if (error.message && error.message.includes('blacklisted')) {
      return res.status(403).json({
        success: false,
        message: 'This visitor is blacklisted and cannot check in'
      });
    }
    next(error);
  }
};

// @desc    Quick check-in for existing visitor
// @route   POST /api/sessions/quick-checkin
// @access  Private (Receptionist, Security, Admin)
exports.quickCheckIn = async (req, res, next) => {
  try {
    const {
      visitor_id,
      host_name,
      host_department,
      host_contact,
      visit_purpose,
      expected_checkout_time,
      number_of_visitors = 1
    } = req.body;

    // Check if visitor exists and not blacklisted
    const [visitor] = await db.query(
      'SELECT * FROM VISITOR WHERE Visitor_ID = ?',
      [visitor_id]
    );

    if (visitor.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found'
      });
    }

    if (visitor[0].Is_Blacklisted) {
      return res.status(403).json({
        success: false,
        message: 'This visitor is blacklisted and cannot check in'
      });
    }

    // Check if visitor is already checked in
    const [activeSession] = await db.query(
      `SELECT Session_ID FROM VISIT_SESSION WHERE Visitor_ID = ? AND Visit_Status = 'Checked-In'`,
      [visitor_id]
    );

    if (activeSession.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Visitor is already checked in',
        activeSessionId: activeSession[0].Session_ID
      });
    }

    // Create new session
    const [insertResult] = await db.query(
      `INSERT INTO VISIT_SESSION 
       (Visitor_ID, Host_Name, Host_Department, Host_Contact, Visit_Purpose, 
        Expected_CheckOut_Time, Number_Of_Visitors, Visit_Status, Checked_In_By)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Checked-In', ?)
       RETURNING Session_ID`,
      [visitor_id, host_name, host_department, host_contact, visit_purpose,
       expected_checkout_time, number_of_visitors, req.user.id]
    );

    const [sessionDetails] = await db.query(
      `SELECT vs.*, v.Full_Name, v.Contact_No 
       FROM VISIT_SESSION vs
       JOIN VISITOR v ON vs.Visitor_ID = v.Visitor_ID
       WHERE vs.Session_ID = ?`,
      [insertResult[0].session_id]
    );

    res.status(201).json({
      success: true,
      message: 'Visitor checked in successfully',
      data: sessionDetails[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-out visitor
// @route   PUT /api/sessions/:id/checkout
// @access  Private (Receptionist, Security, Admin)
exports.checkOutVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks = '' } = req.body;

    // Check if session exists and is checked in
    const [session] = await db.query(
      'SELECT * FROM VISIT_SESSION WHERE Session_ID = ?',
      [id]
    );

    if (session.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    if (session[0].Visit_Status !== 'Checked-In' && session[0].Visit_Status !== 'Overstay') {
      return res.status(400).json({
        success: false,
        message: `Cannot check out visitor with status: ${session[0].Visit_Status}`
      });
    }

    // Call stored function
    await db.query(
      'SELECT sp_checkout_visitor(?, ?, ?)',
      [id, req.user.id, remarks]
    );

    // Get updated session details
    const [updatedSession] = await db.query(
      `SELECT vs.*, v.Full_Name, v.Contact_No,
       EXTRACT(EPOCH FROM (vs.CheckOut_Time - vs.CheckIn_Time))/60 as Duration_Minutes
       FROM VISIT_SESSION vs
       JOIN VISITOR v ON vs.Visitor_ID = v.Visitor_ID
       WHERE vs.Session_ID = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Visitor checked out successfully',
      data: updatedSession[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update session status
// @route   PUT /api/sessions/:id/status
// @access  Private (Security, Admin)
exports.updateSessionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const validStatuses = ['Scheduled', 'Checked-In', 'Checked-Out', 'Cancelled', 'Overstay'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const [session] = await db.query(
      'SELECT * FROM VISIT_SESSION WHERE Session_ID = ?',
      [id]
    );

    if (session.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await db.query(
      'UPDATE VISIT_SESSION SET Visit_Status = ?, Remarks = ? WHERE Session_ID = ?',
      [status, remarks, id]
    );

    // Log the status update
    await db.query(
      `INSERT INTO VERIFICATION_LOG (Session_ID, Action, Action_Details)
       VALUES (?, 'Status Update', ?)`,
      [id, `Status changed to ${status}. ${remarks || ''}`]
    );

    const [updatedSession] = await db.query(
      'SELECT * FROM VISIT_SESSION WHERE Session_ID = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Session status updated successfully',
      data: updatedSession[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add verification log entry
// @route   POST /api/sessions/:id/verify
// @access  Private (Security, Admin)
exports.addVerificationLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { officer_id, action, action_details } = req.body;

    const [session] = await db.query(
      'SELECT Session_ID FROM VISIT_SESSION WHERE Session_ID = ?',
      [id]
    );

    if (session.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await db.query(
      `INSERT INTO VERIFICATION_LOG (Session_ID, Officer_ID, Action, Action_Details)
       VALUES (?, ?, ?, ?)`,
      [id, officer_id, action, action_details]
    );

    res.status(201).json({
      success: true,
      message: 'Verification log added successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's summary
// @route   GET /api/sessions/today/summary
// @access  Private (All roles)
exports.getTodaySummary = async (req, res, next) => {
  try {
    const [summary] = await db.query('SELECT * FROM vw_today_summary');

    res.status(200).json({
      success: true,
      data: summary[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overstay visitors
// @route   GET /api/sessions/overstay
// @access  Private (Security, Admin)
exports.getOverstayVisitors = async (req, res, next) => {
  try {
    const [visitors] = await db.query(
      `SELECT vs.*, v.Full_Name, v.Contact_No,
       EXTRACT(EPOCH FROM (NOW() - vs.Expected_CheckOut_Time))/60 as Overstay_Minutes
       FROM VISIT_SESSION vs
       JOIN VISITOR v ON vs.Visitor_ID = v.Visitor_ID
       WHERE vs.Visit_Status = 'Overstay'
       ORDER BY Overstay_Minutes DESC`
    );

    res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors
    });
  } catch (error) {
    next(error);
  }
};
