// ============================================
// VISITOR MANAGEMENT SYSTEM - BACKEND API
// Project Structure and Installation Guide
// ============================================

/*
PROJECT STRUCTURE:
==================

visitor-management-backend/
│
├── config/
│   └── db.js                 # Database configuration
│
├── middleware/
│   ├── auth.js              # Authentication middleware
│   └── errorHandler.js      # Error handling middleware
│
├── models/
│   ├── Visitor.js           # Visitor model
│   ├── VisitSession.js      # Visit session model
│   ├── User.js              # User account model
│   ├── Vehicle.js           # Vehicle model
│   └── SecurityOfficer.js   # Security officer model
│
├── controllers/
│   ├── authController.js    # Authentication controller
│   ├── visitorController.js # Visitor operations
│   ├── sessionController.js # Visit session operations
│   ├── userController.js    # User management
│   └── reportController.js  # Reports and analytics
│
├── routes/
│   ├── auth.js              # Auth routes
│   ├── visitors.js          # Visitor routes
│   ├── sessions.js          # Session routes
│   ├── users.js             # User routes
│   └── reports.js           # Report routes
│
├── utils/
│   ├── validation.js        # Input validation
│   └── helpers.js           # Helper functions
│
├── .env                     # Environment variables
├── .gitignore              
├── package.json            
├── server.js               # Main application entry point
└── README.md
*/

/*
INSTALLATION STEPS:
===================

1. Initialize Node.js project:
   npm init -y

2. Install dependencies:
   npm install express mysql2 dotenv bcryptjs jsonwebtoken cors body-parser express-validator

3. Install dev dependencies:
   npm install --save-dev nodemon

4. Update package.json scripts:
   "scripts": {
     "start": "node server.js",
     "dev": "nodemon server.js"
   }
*/

// ============================================
// FILE: .env (Environment Variables)
// ============================================
/*
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=visitor_management_system
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d

# Other Configuration
BCRYPT_ROUNDS=10
*/

// ============================================
// FILE: server.js (Main Entry Point)
// ============================================
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { errorHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const visitorRoutes = require('./routes/visitors');
const sessionRoutes = require('./routes/sessions');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Visitor Management API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

//Configure Credentials
//The Admin page visitor edit info and delete not working
//Check for pages users
//Constraints for checkin page, info