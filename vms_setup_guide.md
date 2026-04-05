# Visitor Management System - Complete Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [API Documentation](#api-documentation)
5. [Testing Guide](#testing-guide)

---

## Prerequisites

### Required Software
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **Git** (optional) - [Download](https://git-scm.com/)
- **Postman** (for testing) - [Download](https://www.postman.com/)

---

## Database Setup

### Step 1: Install MySQL
1. Download and install MySQL Community Server
2. Set root password during installation
3. Start MySQL service

### Step 2: Create Database
Open MySQL command line or MySQL Workbench and run:

```sql
-- Execute the complete database schema
-- (Use the SQL file from artifact: vms_database_schema)

mysql -u root -p < database_schema.sql
```

### Step 3: Insert Seed Data
```sql
-- Execute the seed data
mysql -u root -p visitor_management_system < seed_data.sql
```

### Step 4: Verify Installation
```sql
USE visitor_management_system;
SHOW TABLES;
SELECT * FROM USER_ACCOUNT;
```

---

## Backend Setup

### Step 1: Create Project Directory
```bash
mkdir visitor-management-backend
cd visitor-management-backend
npm init -y
```

### Step 2: Install Dependencies
```bash
npm install express mysql2 dotenv bcryptjs jsonwebtoken cors body-parser express-validator
npm install --save-dev nodemon
```

### Step 3: Create Directory Structure
```bash
mkdir config middleware models controllers routes utils
```

### Step 4: Create .env File
Create `.env` in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=visitor_management_system
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# Other Configuration
BCRYPT_ROUNDS=10
```

### Step 5: Update package.json
Add these scripts to `package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### Step 6: Create All Files
Copy the code from all artifacts into their respective files:

1. **server.js** - Main entry point
2. **config/db.js** - Database configuration
3. **middleware/auth.js** - Authentication middleware
4. **middleware/errorHandler.js** - Error handling
5. **utils/validation.js** - Input validation
6. **utils/helpers.js** - Helper functions
7. **controllers/** - All controller files
8. **routes/** - All route files

### Step 7: Run the Server
```bash
npm run dev
```

You should see:
```
✓ MySQL Database connected successfully
Server running in development mode on port 5000
```

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Most endpoints require JWT token in header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔐 Authentication Endpoints
*(Note: Create auth controller separately)*

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "User_ID": 1,
    "Username": "admin",
    "Full_Name": "Rajesh Kumar",
    "Role": "Admin"
  }
}
```

---

## 👥 Visitor Endpoints

### 1. Get All Visitors
```http
GET /api/visitors?page=1&limit=10&search=&blacklisted=false
Authorization: Bearer TOKEN
```

### 2. Get Single Visitor
```http
GET /api/visitors/:id
Authorization: Bearer TOKEN
```

### 3. Create Visitor
```http
POST /api/visitors
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "full_name": "John Doe",
  "gender": "Male",
  "contact_no": "9876543210",
  "email": "john@example.com",
  "id_type": "Aadhar",
  "id_number": "1234-5678-9012",
  "company_name": "Tech Corp"
}
```

### 4. Update Visitor
```http
PUT /api/visitors/:id
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "full_name": "John Doe Updated",
  "gender": "Male",
  "contact_no": "9876543210",
  "email": "john@example.com",
  "id_type": "Aadhar",
  "id_number": "1234-5678-9012",
  "company_name": "Tech Corp"
}
```

### 5. Add to Blacklist
```http
POST /api/visitors/:id/blacklist
Authorization: Bearer TOKEN (Security/Admin)
Content-Type: application/json

{
  "reason": "Security threat - unauthorized access attempt"
}
```

### 6. Remove from Blacklist
```http
DELETE /api/visitors/:id/blacklist
Authorization: Bearer TOKEN (Admin only)
```

### 7. Get Visitor History
```http
GET /api/visitors/:id/history
Authorization: Bearer TOKEN
```

### 8. Search Visitor
```http
GET /api/visitors/search?query=9876543210
Authorization: Bearer TOKEN
```

---

## 📋 Visit Session Endpoints

### 1. Get All Sessions
```http
GET /api/sessions?page=1&limit=10&status=Checked-In&date=2024-11-12
Authorization: Bearer TOKEN
```

### 2. Get Active Visitors
```http
GET /api/sessions/active
Authorization: Bearer TOKEN
```

### 3. Check-In Visitor (New + Check-in)
```http
POST /api/sessions/checkin
Authorization: Bearer TOKEN (Receptionist/Security/Admin)
Content-Type: application/json

{
  "full_name": "Jane Smith",
  "gender": "Female",
  "contact_no": "9123456789",
  "email": "jane@example.com",
  "id_type": "PAN",
  "id_number": "ABCDE1234F",
  "company_name": "Marketing Agency",
  "host_name": "Mr. Anil Sharma",
  "host_department": "Marketing",
  "host_contact": "9871234560",
  "visit_purpose": "Project Discussion",
  "expected_checkout_time": "2024-11-12 17:00:00",
  "number_of_visitors": 1
}
```

### 4. Quick Check-In (Existing Visitor)
```http
POST /api/sessions/quick-checkin
Authorization: Bearer TOKEN (Receptionist/Security/Admin)
Content-Type: application/json

{
  "visitor_id": 5,
  "host_name": "Ms. Sunita Reddy",
  "host_department": "HR",
  "host_contact": "9871234561",
  "visit_purpose": "Interview",
  "expected_checkout_time": "2024-11-12 16:00:00",
  "number_of_visitors": 1
}
```

### 5. Check-Out Visitor
```http
PUT /api/sessions/:id/checkout
Authorization: Bearer TOKEN (Receptionist/Security/Admin)
Content-Type: application/json

{
  "remarks": "Visit completed successfully"
}
```

### 6. Update Session Status
```http
PUT /api/sessions/:id/status
Authorization: Bearer TOKEN (Security/Admin)
Content-Type: application/json

{
  "status": "Cancelled",
  "remarks": "Visitor requested cancellation"
}
```

### 7. Get Today's Summary
```http
GET /api/sessions/today/summary
Authorization: Bearer TOKEN
```

### 8. Get Overstay Visitors
```http
GET /api/sessions/overstay/all
Authorization: Bearer TOKEN (Security/Admin)
```

---

## 👤 User Management Endpoints

### 1. Get All Users
```http
GET /api/users?role=Security&active=true
Authorization: Bearer TOKEN (Admin)
```

### 2. Create User
```http
POST /api/users
Authorization: Bearer TOKEN (Admin)
Content-Type: application/json

{
  "username": "newuser",
  "full_name": "New User Name",
  "role": "Receptionist",
  "contact_no": "9876543210",
  "email": "newuser@company.com",
  "password": "password123"
}
```

### 3. Update User
```http
PUT /api/users/:id
Authorization: Bearer TOKEN (Admin)
Content-Type: application/json

{
  "username": "updateduser",
  "full_name": "Updated Name",
  "role": "Security",
  "contact_no": "9876543210",
  "email": "updated@company.com"
}
```

### 4. Toggle User Active Status
```http
PUT /api/users/:id/toggle-active
Authorization: Bearer TOKEN (Admin)
```

### 5. Change Password
```http
PUT /api/users/:id/change-password
Authorization: Bearer TOKEN (Admin or Own Account)
Content-Type: application/json

{
  "current_password": "oldpass123",
  "new_password": "newpass123"
}
```

### 6. Get My Profile
```http
GET /api/users/me
Authorization: Bearer TOKEN
```

### 7. Update My Profile
```http
PUT /api/users/me
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "full_name": "Updated Name",
  "contact_no": "9876543210",
  "email": "myemail@company.com"
}
```

---

## 📊 Report & Analytics Endpoints

### 1. Get Dashboard Statistics
```http
GET /api/reports/dashboard
Authorization: Bearer TOKEN
```

**Response includes:**
- Today's summary
- Active visitors
- Week/Month visits
- Average duration
- Blacklisted count

### 2. Get Visits by Date Range
```http
GET /api/reports/visits-by-date?start_date=2024-11-01&end_date=2024-11-12
Authorization: Bearer TOKEN
```

### 3. Get Hourly Distribution
```http
GET /api/reports/hourly-distribution?date=2024-11-12
Authorization: Bearer TOKEN
```

### 4. Get Top Visitors
```http
GET /api/reports/top-visitors?limit=10&days=30
Authorization: Bearer TOKEN
```

### 5. Get Visit Purposes Breakdown
```http
GET /api/reports/visit-purposes?days=30
Authorization: Bearer TOKEN
```

### 6. Get Department-Wise Visits
```http
GET /api/reports/department-wise?days=30
Authorization: Bearer TOKEN
```

### 7. Get Vehicle Statistics
```http
GET /api/reports/vehicle-stats
Authorization: Bearer TOKEN
```

### 8. Export Visits (CSV Data)
```http
GET /api/reports/export-visits?start_date=2024-11-01&end_date=2024-11-12
Authorization: Bearer TOKEN (Security/Admin)
```

### 9. Get Overstay Report
```http
GET /api/reports/overstay-report?days=7
Authorization: Bearer TOKEN (Security/Admin)
```

### 10. Get Blacklist Report
```http
GET /api/reports/blacklist-report
Authorization: Bearer TOKEN (Security/Admin)
```

---

## Testing Guide

### Using Postman

1. **Import Environment Variables:**
   - Create new environment
   - Add variable: `base_url` = `http://localhost:5000/api`
   - Add variable: `token` = (will be set after login)

2. **Test Login:**
   ```
   POST {{base_url}}/auth/login
   {
     "username": "admin",
     "password": "admin123"
   }
   ```
   Copy the token from response

3. **Set Token:**
   - Add to Headers: `Authorization: Bearer YOUR_TOKEN`
   - Or use Postman Auth tab (Bearer Token)

4. **Test Other Endpoints:**
   Follow the API documentation above

### Sample Test Users (from seed data):
```
Username: admin        Password: admin123      Role: Admin
Username: security1    Password: admin123      Role: Security
Username: reception1   Password: admin123      Role: Receptionist
```

---

## Role-Based Access Control

| Endpoint | Admin | Security | Receptionist |
|----------|-------|----------|--------------|
| View Visitors | ✅ | ✅ | ✅ |
| Create Visitor | ✅ | ✅ | ✅ |
| Update Visitor | ✅ | ✅ | ✅ |
| Delete Visitor | ✅ | ❌ | ❌ |
| Add Blacklist | ✅ | ✅ | ❌ |
| Remove Blacklist | ✅ | ❌ | ❌ |
| Check-In | ✅ | ✅ | ✅ |
| Check-Out | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ |
| User Activity Report | ✅ | ❌ | ❌ |

---

## Common Issues & Solutions

### Issue: Database connection failed
**Solution:** 
- Check MySQL service is running
- Verify credentials in .env file
- Ensure database exists

### Issue: Token expired
**Solution:**
- Login again to get new token
- Token expires based on JWT_EXPIRE setting

### Issue: Port already in use
**Solution:**
- Change PORT in .env file
- Or kill process using port 5000

### Issue: Foreign key constraint fails
**Solution:**
- Check referenced records exist
- Ensure proper order of operations

---

## Next Steps

1. ✅ **Database Schema** - Complete
2. ✅ **Backend API** - Complete  
3. 🔄 **Create Authentication Controller** - Pending
4. 🔄 **Build Frontend Dashboard** - Next Phase
5. 🔄 **Deploy Application** - Final Phase

---

## Support & Contact

For issues or questions:
- Check MySQL logs: `/var/log/mysql/error.log`
- Check application logs in console
- Review error messages carefully

**Project Status:** Backend API Development Complete ✅