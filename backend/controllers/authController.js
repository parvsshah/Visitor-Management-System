// ============================================
// FILE: controllers/authController.js
// Authentication Operations
// ============================================

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/helpers');

// @desc    Register new user (For initial setup only)
// @route   POST /api/auth/register
// @access  Public (can be restricted later)
exports.register = async (req, res, next) => {
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

    // Create user
    const [result] = await db.query(
      `INSERT INTO USER_ACCOUNT 
       (Username, Full_Name, Role, Contact_No, Email, Password_Hash)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING User_ID, Username, Full_Name, Role, Contact_No, Email, Is_Active, Created_At`,
      [username, full_name, role, contact_no, email, password_hash]
    );

    const newUser = [result[0]];

    // Generate token
    const token = generateToken(newUser[0]);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: newUser[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Check if user exists
    const [users] = await db.query(
      'SELECT * FROM USER_ACCOUNT WHERE Username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Check if user is active
    if (!user.Is_Active) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordMatch = await bcrypt.compare(password, user.Password_Hash);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user);

    // Update last login time (optional - would need to add column)
    // await db.query('UPDATE USER_ACCOUNT SET Last_Login = NOW() WHERE User_ID = ?', [user.User_ID]);

    // Remove password from response
    delete user.Password_Hash;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        User_ID: user.User_ID,
        Username: user.Username,
        Full_Name: user.Full_Name,
        Role: user.Role,
        Contact_No: user.Contact_No,
        Email: user.Email,
        Is_Active: user.Is_Active
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const [user] = await db.query(
      `SELECT User_ID, Username, Full_Name, Role, Contact_No, Email, Is_Active, Created_At
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

// @desc    Logout user / Clear token
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // In a JWT-based system, logout is handled on the client side
    // by removing the token from storage
    // This endpoint is mainly for logging purposes

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
exports.verifyToken = async (req, res, next) => {
  try {
    // If this endpoint is reached, the token is valid (protected by auth middleware)
    res.status(200).json({
      success: true,
      valid: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password'
      });
    }

    // Validate new password length
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const [users] = await db.query(
      'SELECT * FROM USER_ACCOUNT WHERE User_ID = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Verify current password
    const isPasswordMatch = await bcrypt.compare(current_password, user.Password_Hash);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
    const password_hash = await bcrypt.hash(new_password, salt);

    // Update password
    await db.query(
      'UPDATE USER_ACCOUNT SET Password_Hash = ? WHERE User_ID = ?',
      [password_hash, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password (Generate reset token)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address'
      });
    }

    // Check if user exists
    const [users] = await db.query(
      'SELECT User_ID, Username, Email FROM USER_ACCOUNT WHERE Email = ?',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal that user doesn't exist (security)
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent'
      });
    }

    // In production, you would:
    // 1. Generate reset token
    // 2. Save token to database with expiry
    // 3. Send email with reset link
    // For now, we'll just return success

    res.status(200).json({
      success: true,
      message: 'Password reset instructions sent to email',
      // In development, you might return this info (remove in production)
      ...(process.env.NODE_ENV === 'development' && {
        dev_info: {
          user_id: users[0].User_ID,
          username: users[0].Username
        }
      })
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { new_password } = req.body;

    if (!new_password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new password'
      });
    }

    // Validate password length
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // In production, you would:
    // 1. Verify reset token from database
    // 2. Check if token is expired
    // 3. Update password if valid
    // For now, return not implemented

    res.status(501).json({
      success: false,
      message: 'Password reset functionality not fully implemented yet'
    });
  } catch (error) {
    next(error);
  }
};