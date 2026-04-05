// ============================================
// FILE: controllers/visitorController.js
// Visitor Management Operations
// ============================================

const db = require('../config/db');

// =====================================================
//               GET ALL VISITORS (Paginated)
// =====================================================
exports.getAllVisitors = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', blacklisted = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        Visitor_ID, Full_Name, Gender, Contact_No, Email,
        ID_Type, ID_Number, Company_Name, Address,
        Is_Blacklisted, Blacklist_Reason, Created_At
      FROM VISITOR
      WHERE 1=1
    `;

    let countQuery = `SELECT COUNT(*) AS total FROM VISITOR WHERE 1=1`;
    const params = [];
    const countParams = [];

    // Search filter
    if (search) {
      const s = `%${search}%`;
      query += ` AND (Full_Name LIKE ? OR Contact_No LIKE ? OR Email LIKE ? OR ID_Number LIKE ?)`;
      countQuery += ` AND (Full_Name LIKE ? OR Contact_No LIKE ? OR Email LIKE ? OR ID_Number LIKE ?)`;
      params.push(s, s, s, s);
      countParams.push(s, s, s, s);
    }

    // Blacklist filter
    if (blacklisted !== '') {
      const val = blacklisted === 'true' ? 1 : 0;
      query += ` AND Is_Blacklisted = ?`;
      countQuery += ` AND Is_Blacklisted = ?`;
      params.push(val);
      countParams.push(val);
    }

    // Pagination
    query += ` ORDER BY Created_At DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [visitors] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, countParams);

    res.status(200).json({
      success: true,
      data: visitors,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
//               GET VISITOR BY ID
// =====================================================
exports.getVisitorById = async (req, res, next) => {
  try {
    const [visitor] = await db.query(
      'SELECT * FROM VISITOR WHERE Visitor_ID = ?',
      [req.params.id]
    );

    if (!visitor.length) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found',
      });
    }

    res.status(200).json({ success: true, data: visitor[0] });
  } catch (error) {
    next(error);
  }
};

// =====================================================
//               CREATE NEW VISITOR
// =====================================================
exports.createVisitor = async (req, res, next) => {
  try {
    const {
      full_name,
      gender,
      contact_no,
      email,
      id_type,
      id_number,
      company_name,
      address,
    } = req.body;

    // Check duplicates
    const [existing] = await db.query(
      'SELECT Visitor_ID FROM VISITOR WHERE Contact_No = ? OR ID_Number = ?',
      [contact_no, id_number]
    );

    if (existing.length) {
      return res.status(400).json({
        success: false,
        message: 'Visitor with this contact number or ID already exists',
        existingVisitorId: existing[0].Visitor_ID,
      });
    }

    // Insert
    const [insert] = await db.query(
      `INSERT INTO VISITOR 
      (Full_Name, Gender, Contact_No, Email, ID_Type, ID_Number, Company_Name, Address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, gender, contact_no, email, id_type, id_number, company_name, address]
    );

    const [newVisitor] = await db.query(
      'SELECT * FROM VISITOR WHERE Visitor_ID = ?',
      [insert.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Visitor created successfully',
      data: newVisitor[0],
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
//                 UPDATE VISITOR
// =====================================================
exports.updateVisitor = async (req, res, next) => {
  console.log("PUT /visitors/:id BODY =>", req.body);
  console.log("PUT /visitors/:id PARAMS =>", req.params);
  try {

    console.log("Visitor ID:", req.params.id);
    console.log("Received body:", req.body);
    
    

    const { id } = req.params;
    const {
      full_name,
      gender,
      contact_no,
      email,
      id_type,
      id_number,
      company_name,
      address,
    } = req.body;

    const [visitor] = await db.query(
      'SELECT * FROM VISITOR WHERE Visitor_ID = ?',
      [id]
    );

    if (!visitor.length) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found',
      });
    }

    await db.query(
      `UPDATE VISITOR SET 
        Full_Name = ?, Gender = ?, Contact_No = ?, Email = ?, 
        ID_Type = ?, ID_Number = ?, Company_Name = ?, Address = ?
      WHERE Visitor_ID = ?`,
      [
        full_name,
        gender,
        contact_no,
        email || null,
        id_type,
        id_number,
        company_name || null,
        address || null,
        id,
      ]
    );

    const [updated] = await db.query(
      'SELECT * FROM VISITOR WHERE Visitor_ID = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Visitor updated successfully',
      data: updated[0],
    });
  } catch (error) {

    // 🔍 DEBUG ERROR LOG
    console.error("UPDATE ERROR:", error);

    next(error);
  }
};

// =====================================================
//                 DELETE VISITOR
// =====================================================
exports.deleteVisitor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [visitor] = await db.query(
      'SELECT * FROM VISITOR WHERE Visitor_ID = ?',
      [id]
    );

    if (!visitor.length) {
      return res.status(404).json({ success: false, message: 'Visitor not found' });
    }

    await db.query('DELETE FROM VISITOR WHERE Visitor_ID = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Visitor deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
//             ADD TO BLACKLIST
// =====================================================
exports.addToBlacklist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason)
      return res.status(400).json({ success: false, message: 'Reason is required' });

    const [visitor] = await db.query(
      'SELECT * FROM VISITOR WHERE Visitor_ID = ?',
      [id]
    );

    if (!visitor.length)
      return res.status(404).json({ success: false, message: 'Visitor not found' });

    if (visitor[0].Is_Blacklisted)
      return res.status(400).json({ success: false, message: 'Already blacklisted' });

    // Using stored procedure
    await db.query('CALL sp_add_to_blacklist(?, ?, ?)', [
      id,
      reason,
      req.user.id, // Admin/Security ID
    ]);

    res.status(200).json({
      success: true,
      message: 'Visitor added to blacklist',
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
//             REMOVE FROM BLACKLIST
// =====================================================
exports.removeFromBlacklist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [visitor] = await db.query(
      'SELECT * FROM VISITOR WHERE Visitor_ID = ?',
      [id]
    );

    if (!visitor.length)
      return res.status(404).json({ success: false, message: 'Visitor not found' });

    if (!visitor[0].Is_Blacklisted)
      return res.status(400).json({
        success: false,
        message: 'Visitor is not blacklisted',
      });

    await db.query(
      'UPDATE VISITOR SET Is_Blacklisted = FALSE, Blacklist_Reason = NULL WHERE Visitor_ID = ?',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Visitor removed from blacklist',
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
//             GET VISITOR VISIT HISTORY
// =====================================================
exports.getVisitorHistory = async (req, res, next) => {
  try {
    const [history] = await db.query(`CALL sp_get_visitor_history(?)`, [
      req.params.id,
    ]);

    res.status(200).json({
      success: true,
      data: history[0],
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
//                 SEARCH VISITOR
// =====================================================
exports.searchVisitor = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query)
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });

    const s = `%${query}%`;

    const [results] = await db.query(
      `SELECT * FROM VISITOR 
       WHERE Contact_No LIKE ? 
       OR ID_Number LIKE ? 
       OR Full_Name LIKE ?
       LIMIT 10`,
      [s, s, s]
    );

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

// =====================================================
//                 GET BLACKLISTED VISITORS
// =====================================================
exports.getBlacklistedVisitors = async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT * FROM vw_blacklisted_visitors`);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

// =====================================================
//                 BLACKLIST HISTORY
// =====================================================
exports.getBlacklistHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [history] = await db.query(
      `SELECT bl.*, ua.Username AS Added_By_Username
       FROM BLACKLIST_LOG bl
       LEFT JOIN USER_ACCOUNT ua ON bl.Added_By = ua.User_ID
       WHERE bl.Visitor_ID = ?
       ORDER BY bl.Action_Date DESC`,
      [id]
    );

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
