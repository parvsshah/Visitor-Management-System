// ============================================
// FILE: controllers/userController.js
// User Account Management Operations
// ============================================

const db = require('../config/db');
const bcrypt = require('bcryptjs');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role = '', active = '' } = req.query;

    let query = `
      SELECT 
        User_ID, Username, Full_Name, Role, Contact_No, 
        Email, Is_Active, Created_At, Updated_At
      FROM USER_ACCOUNT
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ` AND Role = ?`;
      params.push(role);
    }

    if (active !== '') {
      query += ` AND Is_Active = ?`;
      params.push(active === 'true' ? 1 : 0);
    }

    query += ` ORDER BY Created_At DESC`;

    const [users] = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private (Admin only)
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [user] = await db.query(
      `SELECT 
        User_ID, Username, Full_Name, Role, Contact_No, 
        Email, Is_Active, Created_At, Updated_At
       FROM USER_ACCOUNT 
       WHERE User_ID = ?`,
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin only)
exports.createUser = async (req, res, next) => {
  try {
    const {
      username,
      full_name,
      role,
      contact_no,
      email,
      password
    } = req.body;

    // Validate role
    const validRoles = ['Admin', 'Security', 'Receptionist'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be Admin, Security, or Receptionist'
      });
    }

    // Check if username or email already exists
    const [existing] = await db.query(
      'SELECT User_ID FROM USER_ACCOUNT WHERE Username = ? OR Email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      `INSERT INTO USER_ACCOUNT 
       (Username, Full_Name, Role, Contact_No, Email, Password_Hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, full_name, role, contact_no, email, password_hash]
    );

    const [newUser] = await db.query(
      `SELECT 
        User_ID, Username, Full_Name, Role, Contact_No, 
        Email, Is_Active, Created_At
       FROM USER_ACCOUNT 
       WHERE User_ID = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      username,
      full_name,
      role,
      contact_no,
      email
    } = req.body;

    // Check if user exists
    const [user] = await db.query(
      'SELECT * FROM USER_ACCOUNT WHERE User_ID = ?',
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate role
    const validRoles = ['Admin', 'Security', 'Receptionist'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be Admin, Security, or Receptionist'
      });
    }

    // Check if username or email already taken by another user
    const [existing] = await db.query(
      'SELECT User_ID FROM USER_ACCOUNT WHERE (Username = ? OR Email = ?) AND User_ID != ?',
      [username, email, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already taken'
      });
    }

    await db.query(
      `UPDATE USER_ACCOUNT 
       SET Username = ?, Full_Name = ?, Role = ?, Contact_No = ?, Email = ?
       WHERE User_ID = ?`,
      [username, full_name, role, contact_no, email, id]
    );

    const [updatedUser] = await db.query(
      `SELECT 
        User_ID, Username, Full_Name, Role, Contact_No, 
        Email, Is_Active, Created_At, Updated_At
       FROM USER_ACCOUNT 
       WHERE User_ID = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const [user] = await db.query(
      'SELECT * FROM USER_ACCOUNT WHERE User_ID = ?',
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await db.query('DELETE FROM USER_ACCOUNT WHERE User_ID = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate/Deactivate user
// @route   PUT /api/users/:id/toggle-active
// @access  Private (Admin only)
exports.toggleUserActive = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deactivating themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    const [user] = await db.query(
      'SELECT * FROM USER_ACCOUNT WHERE User_ID = ?',
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newStatus = !user[0].Is_Active;

    await db.query(
      'UPDATE USER_ACCOUNT SET Is_Active = ? WHERE User_ID = ?',
      [newStatus, id]
    );

    const [updatedUser] = await db.query(
      `SELECT 
        User_ID, Username, Full_Name, Role, Contact_No, 
        Email, Is_Active, Created_At, Updated_At
       FROM USER_ACCOUNT 
       WHERE User_ID = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password
// @route   PUT /api/users/:id/change-password
// @access  Private (Admin or own account)
exports.changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { current_password, new_password } = req.body;

    // Check if user is changing their own password or is admin
    if (parseInt(id) !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to change this password'
      });
    }

    const [user] = await db.query(
      'SELECT * FROM USER_ACCOUNT WHERE User_ID = ?',
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If user is changing their own password, verify current password
    if (parseInt(id) === req.user.id) {
      const isMatch = await bcrypt.compare(current_password, user[0].Password_Hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
    const password_hash = await bcrypt.hash(new_password, salt);

    await db.query(
      'UPDATE USER_ACCOUNT SET Password_Hash = ? WHERE User_ID = ?',
      [password_hash, id]
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private (All authenticated users)
exports.getMyProfile = async (req, res, next) => {
  try {
    const [user] = await db.query(
      `SELECT 
        User_ID, Username, Full_Name, Role, Contact_No, 
        Email, Is_Active, Created_At, Updated_At
       FROM USER_ACCOUNT 
       WHERE User_ID = ?`,
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private (All authenticated users)
exports.updateMyProfile = async (req, res, next) => {
  try {
    const { full_name, contact_no, email } = req.body;

    // Check if email already taken by another user
    const [existing] = await db.query(
      'SELECT User_ID FROM USER_ACCOUNT WHERE Email = ? AND User_ID != ?',
      [email, req.user.id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already taken'
      });
    }

    await db.query(
      `UPDATE USER_ACCOUNT 
       SET Full_Name = ?, Contact_No = ?, Email = ?
       WHERE User_ID = ?`,
      [full_name, contact_no, email, req.user.id]
    );

    const [updatedUser] = await db.query(
      `SELECT 
        User_ID, Username, Full_Name, Role, Contact_No, 
        Email, Is_Active, Created_At, Updated_At
       FROM USER_ACCOUNT 
       WHERE User_ID = ?`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user activity statistics
// @route   GET /api/users/:id/stats
// @access  Private (Admin only)
exports.getUserStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [user] = await db.query(
      'SELECT User_ID FROM USER_ACCOUNT WHERE User_ID = ?',
      [id]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get check-ins performed
    const [checkins] = await db.query(
      'SELECT COUNT(*) as total FROM VISIT_SESSION WHERE Checked_In_By = ?',
      [id]
    );

    // Get check-outs performed
    const [checkouts] = await db.query(
      'SELECT COUNT(*) as total FROM VISIT_SESSION WHERE Checked_Out_By = ?',
      [id]
    );

    // Get recent activities
    const [recentActivities] = await db.query(
      `SELECT vs.Session_ID, v.Full_Name, vs.CheckIn_Time, vs.Visit_Status
       FROM VISIT_SESSION vs
       JOIN VISITOR v ON vs.Visitor_ID = v.Visitor_ID
       WHERE vs.Checked_In_By = ? OR vs.Checked_Out_By = ?
       ORDER BY vs.CheckIn_Time DESC
       LIMIT 10`,
      [id, id]
    );

    res.status(200).json({
      success: true,
      data: {
        total_checkins: checkins[0].total,
        total_checkouts: checkouts[0].total,
        recent_activities: recentActivities
      }
    });
  } catch (error) {
    next(error);
  }
};