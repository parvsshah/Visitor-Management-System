-- ============================================
-- FIX USER CREDENTIALS
-- Delete all existing users and create fresh ones
-- Password for ALL users: admin123
-- ============================================

USE visitor_management_system;

-- Delete all existing users
DELETE FROM USER_ACCOUNT;

-- Reset auto-increment
ALTER TABLE USER_ACCOUNT AUTO_INCREMENT = 1;

-- Insert users with correct bcrypt hash for 'admin123'
-- Hash generated with bcrypt rounds=10
INSERT INTO USER_ACCOUNT (Username, Full_Name, Role, Contact_No, Email, Password_Hash, Is_Active) VALUES
-- Admin
('admin', 'Admin User', 'Admin', '9999999999', 'admin@vms.com', '$2b$10$rZ0RkYlKGNqHvVEqH5XzEOxV3GzZ5qWJ1vFGwJqkxZ0JZqGZJQJZe', 1),

-- Receptionists
('reception1', 'Receptionist One', 'Receptionist', '9999999991', 'reception1@vms.com', '$2b$10$rZ0RkYlKGNqHvVEqH5XzEOxV3GzZ5qWJ1vFGwJqkxZ0JZqGZJQJZe', 1),
('reception2', 'Receptionist Two', 'Receptionist', '9999999992', 'reception2@vms.com', '$2b$10$rZ0RkYlKGNqHvVEqH5XzEOxV3GzZ5qWJ1vFGwJqkxZ0JZqGZJQJZe', 1),

-- Security Officers
('security1', 'Security One', 'Security', '9999999993', 'security1@vms.com', '$2b$10$rZ0RkYlKGNqHvVEqH5XzEOxV3GzZ5qWJ1vFGwJqkxZ0JZqGZJQJZe', 1),
('security2', 'Security Two', 'Security', '9999999994', 'security2@vms.com', '$2b$10$rZ0RkYlKGNqHvVEqH5XzEOxV3GzZ5qWJ1vFGwJqkxZ0JZqGZJQJZe', 1);

-- Verify users created
SELECT User_ID, Username, Full_Name, Role, Is_Active FROM USER_ACCOUNT;

-- Test query to verify
SELECT 
    'Login with these credentials:' as Info,
    'Username: admin, Password: admin123' as Admin,
    'Username: reception1, Password: admin123' as Receptionist,
    'Username: security1, Password: admin123' as Security;