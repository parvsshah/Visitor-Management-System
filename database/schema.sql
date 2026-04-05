-- ============================================
-- VISITOR MANAGEMENT SYSTEM - DATABASE SCHEMA
-- MySQL Database
-- ============================================

-- Create Database
CREATE DATABASE IF NOT EXISTS visitor_management_system;
USE visitor_management_system;

-- ============================================
-- TABLE: USER_ACCOUNT
-- Stores system users (Admin, Security, Receptionist)
-- ============================================
CREATE TABLE USER_ACCOUNT (
    User_ID INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Full_Name VARCHAR(100) NOT NULL,
    Role ENUM('Admin', 'Security', 'Receptionist') NOT NULL,
    Contact_No VARCHAR(15) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password_Hash VARCHAR(255) NOT NULL,
    Is_Active BOOLEAN DEFAULT TRUE,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (Username),
    INDEX idx_role (Role),
    INDEX idx_email (Email)
);

-- ============================================
-- TABLE: VISITOR
-- Stores visitor information
-- ============================================
CREATE TABLE VISITOR (
    Visitor_ID INT PRIMARY KEY AUTO_INCREMENT,
    Full_Name VARCHAR(100) NOT NULL,
    Gender ENUM('Male', 'Female', 'Other') NOT NULL,
    Contact_No VARCHAR(15) NOT NULL,
    Email VARCHAR(100),
    ID_Type ENUM('Aadhar', 'PAN', 'Driving License', 'Passport', 'Voter ID', 'Other') NOT NULL,
    ID_Number VARCHAR(50) NOT NULL,
    Company_Name VARCHAR(100),
    Is_Blacklisted BOOLEAN DEFAULT FALSE,
    Blacklist_Reason TEXT,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_contact (Contact_No),
    INDEX idx_email (Email),
    INDEX idx_id_number (ID_Number),
    INDEX idx_blacklist (Is_Blacklisted)
);

-- ============================================
-- TABLE: VISIT_SESSION
-- Central table for tracking visits
-- ============================================
CREATE TABLE VISIT_SESSION (
    Session_ID INT PRIMARY KEY AUTO_INCREMENT,
    Visitor_ID INT NOT NULL,
    Host_User_ID INT,
    Host_Name VARCHAR(100),
    Host_Department VARCHAR(100),
    Host_Contact VARCHAR(15),
    CheckIn_Time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CheckOut_Time DATETIME,
    Expected_CheckOut_Time DATETIME,
    Visit_Status ENUM('Scheduled', 'Checked-In', 'Checked-Out', 'Cancelled', 'Overstay') NOT NULL DEFAULT 'Checked-In',
    Visit_Purpose VARCHAR(255) NOT NULL,
    Number_Of_Visitors INT DEFAULT 1,
    Remarks TEXT,
    Checked_In_By INT,
    Checked_Out_By INT,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Visitor_ID) REFERENCES VISITOR(Visitor_ID) ON DELETE CASCADE,
    FOREIGN KEY (Host_User_ID) REFERENCES USER_ACCOUNT(User_ID) ON DELETE SET NULL,
    FOREIGN KEY (Checked_In_By) REFERENCES USER_ACCOUNT(User_ID) ON DELETE SET NULL,
    FOREIGN KEY (Checked_Out_By) REFERENCES USER_ACCOUNT(User_ID) ON DELETE SET NULL,
    INDEX idx_visitor (Visitor_ID),
    INDEX idx_host (Host_User_ID),
    INDEX idx_status (Visit_Status),
    INDEX idx_checkin_time (CheckIn_Time),
    INDEX idx_checkout_time (CheckOut_Time)
);

-- ============================================
-- TABLE: SECURITY_OFFICER
-- Stores security officer information
-- ============================================
CREATE TABLE SECURITY_OFFICER (
    Officer_ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Shift ENUM('Morning', 'Evening', 'Night', 'General') NOT NULL,
    Contact_No VARCHAR(15) NOT NULL,
    Is_Active BOOLEAN DEFAULT TRUE,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_shift (Shift),
    INDEX idx_active (Is_Active)
);

-- ============================================
-- TABLE: VERIFICATION_LOG
-- Audit trail for all verification activities
-- ============================================
CREATE TABLE VERIFICATION_LOG (
    Log_ID INT PRIMARY KEY AUTO_INCREMENT,
    Session_ID INT NOT NULL,
    Officer_ID INT,
    Action ENUM('Check-In', 'Check-Out', 'Verification', 'Status Update', 'Cancelled', 'Other') NOT NULL,
    Action_Details TEXT,
    Timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Session_ID) REFERENCES VISIT_SESSION(Session_ID) ON DELETE CASCADE,
    FOREIGN KEY (Officer_ID) REFERENCES SECURITY_OFFICER(Officer_ID) ON DELETE SET NULL,
    INDEX idx_session (Session_ID),
    INDEX idx_officer (Officer_ID),
    INDEX idx_timestamp (Timestamp),
    INDEX idx_action (Action)
);

-- ============================================
-- TABLE: BLACKLIST_LOG
-- Track blacklist history
-- ============================================
CREATE TABLE BLACKLIST_LOG (
    Log_ID INT PRIMARY KEY AUTO_INCREMENT,
    Visitor_ID INT NOT NULL,
    Action ENUM('Added', 'Removed') NOT NULL,
    Reason TEXT NOT NULL,
    Added_By INT,
    Action_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Visitor_ID) REFERENCES VISITOR(Visitor_ID) ON DELETE CASCADE,
    FOREIGN KEY (Added_By) REFERENCES USER_ACCOUNT(User_ID) ON DELETE SET NULL,
    INDEX idx_visitor (Visitor_ID),
    INDEX idx_action_date (Action_Date)
);

-- ============================================
-- TABLE: SYSTEM_SETTINGS
-- Store system configuration
-- ============================================
CREATE TABLE SYSTEM_SETTINGS (
    Setting_ID INT PRIMARY KEY AUTO_INCREMENT,
    Setting_Key VARCHAR(50) UNIQUE NOT NULL,
    Setting_Value TEXT NOT NULL,
    Description VARCHAR(255),
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Auto-update visit status to 'Overstay'
DELIMITER //
CREATE TRIGGER check_overstay_before_update
BEFORE UPDATE ON VISIT_SESSION
FOR EACH ROW
BEGIN
    IF NEW.Visit_Status = 'Checked-In' 
       AND NEW.Expected_CheckOut_Time IS NOT NULL 
       AND NOW() > NEW.Expected_CheckOut_Time THEN
        SET NEW.Visit_Status = 'Overstay';
    END IF;
END//
DELIMITER ;

-- Trigger: Create verification log on check-in
DELIMITER //
CREATE TRIGGER log_checkin
AFTER INSERT ON VISIT_SESSION
FOR EACH ROW
BEGIN
    INSERT INTO VERIFICATION_LOG (Session_ID, Action, Action_Details, Timestamp)
    VALUES (NEW.Session_ID, 'Check-In', CONCAT('Visitor checked in. Purpose: ', NEW.Visit_Purpose), NEW.CheckIn_Time);
END//
DELIMITER ;

-- Trigger: Create verification log on check-out
DELIMITER //
CREATE TRIGGER log_checkout
AFTER UPDATE ON VISIT_SESSION
FOR EACH ROW
BEGIN
    IF OLD.CheckOut_Time IS NULL AND NEW.CheckOut_Time IS NOT NULL THEN
        INSERT INTO VERIFICATION_LOG (Session_ID, Action, Action_Details, Timestamp)
        VALUES (NEW.Session_ID, 'Check-Out', 'Visitor checked out', NEW.CheckOut_Time);
    END IF;
END//
DELIMITER ;

-- Trigger: Log blacklist actions
DELIMITER //
CREATE TRIGGER log_blacklist_action
AFTER UPDATE ON VISITOR
FOR EACH ROW
BEGIN
    IF OLD.Is_Blacklisted != NEW.Is_Blacklisted THEN
        IF NEW.Is_Blacklisted = TRUE THEN
            INSERT INTO BLACKLIST_LOG (Visitor_ID, Action, Reason)
            VALUES (NEW.Visitor_ID, 'Added', IFNULL(NEW.Blacklist_Reason, 'No reason provided'));
        ELSE
            INSERT INTO BLACKLIST_LOG (Visitor_ID, Action, Reason)
            VALUES (NEW.Visitor_ID, 'Removed', 'Blacklist removed');
        END IF;
    END IF;
END//
DELIMITER ;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedure: Register new visitor and check-in
DELIMITER //
CREATE PROCEDURE sp_register_and_checkin(
    IN p_full_name VARCHAR(100),
    IN p_gender VARCHAR(10),
    IN p_contact VARCHAR(15),
    IN p_email VARCHAR(100),
    IN p_id_type VARCHAR(50),
    IN p_id_number VARCHAR(50),
    IN p_company VARCHAR(100),
    IN p_host_name VARCHAR(100),
    IN p_host_dept VARCHAR(100),
    IN p_host_contact VARCHAR(15),
    IN p_purpose VARCHAR(255),
    IN p_expected_checkout DATETIME,
    IN p_checked_in_by INT,
    OUT p_session_id INT,
    OUT p_visitor_id INT
)
BEGIN
    DECLARE v_is_blacklisted BOOLEAN;
    DECLARE v_existing_visitor INT;
    
    -- Check if visitor exists
    SELECT Visitor_ID, Is_Blacklisted INTO v_existing_visitor, v_is_blacklisted
    FROM VISITOR 
    WHERE Contact_No = p_contact OR ID_Number = p_id_number
    LIMIT 1;
    
    -- If blacklisted, raise error
    IF v_is_blacklisted = TRUE THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Visitor is blacklisted and cannot check in';
    END IF;
    
    -- If visitor doesn't exist, create new
    IF v_existing_visitor IS NULL THEN
        INSERT INTO VISITOR (Full_Name, Gender, Contact_No, Email, ID_Type, ID_Number, Company_Name)
        VALUES (p_full_name, p_gender, p_contact, p_email, p_id_type, p_id_number, p_company);
        SET v_existing_visitor = LAST_INSERT_ID();
    END IF;
    
    -- Create visit session
    INSERT INTO VISIT_SESSION (
        Visitor_ID, Host_Name, Host_Department, Host_Contact, 
        Visit_Purpose, Expected_CheckOut_Time, Visit_Status, Checked_In_By
    )
    VALUES (
        v_existing_visitor, p_host_name, p_host_dept, p_host_contact,
        p_purpose, p_expected_checkout, 'Checked-In', p_checked_in_by
    );
    
    SET p_session_id = LAST_INSERT_ID();
    SET p_visitor_id = v_existing_visitor;
END//
DELIMITER ;

-- Procedure: Check-out visitor
DELIMITER //
CREATE PROCEDURE sp_checkout_visitor(
    IN p_session_id INT,
    IN p_checked_out_by INT,
    IN p_remarks TEXT
)
BEGIN
    UPDATE VISIT_SESSION
    SET CheckOut_Time = NOW(),
        Visit_Status = 'Checked-Out',
        Checked_Out_By = p_checked_out_by,
        Remarks = p_remarks
    WHERE Session_ID = p_session_id
    AND Visit_Status = 'Checked-In';
    
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Invalid session or visitor already checked out';
    END IF;
END//
DELIMITER ;

-- Procedure: Get active visitors
DELIMITER //
CREATE PROCEDURE sp_get_active_visitors()
BEGIN
    SELECT 
        vs.Session_ID,
        v.Full_Name,
        v.Contact_No,
        v.Company_Name,
        vs.Host_Name,
        vs.Host_Department,
        vs.Visit_Purpose,
        vs.CheckIn_Time,
        vs.Expected_CheckOut_Time,
        vs.Visit_Status,
        TIMESTAMPDIFF(MINUTE, vs.CheckIn_Time, NOW()) as Duration_Minutes
    FROM VISIT_SESSION vs
    JOIN VISITOR v ON vs.Visitor_ID = v.Visitor_ID
    WHERE vs.Visit_Status IN ('Checked-In', 'Overstay')
    ORDER BY vs.CheckIn_Time DESC;
END//
DELIMITER ;

-- Procedure: Get visitor history
DELIMITER //
CREATE PROCEDURE sp_get_visitor_history(
    IN p_visitor_id INT
)
BEGIN
    SELECT 
        vs.Session_ID,
        vs.Host_Name,
        vs.Visit_Purpose,
        vs.CheckIn_Time,
        vs.CheckOut_Time,
        vs.Visit_Status,
        TIMESTAMPDIFF(MINUTE, vs.CheckIn_Time, IFNULL(vs.CheckOut_Time, NOW())) as Duration_Minutes
    FROM VISIT_SESSION vs
    WHERE vs.Visitor_ID = p_visitor_id
    ORDER BY vs.CheckIn_Time DESC;
END//
DELIMITER ;

-- Procedure: Add to blacklist
DELIMITER //
CREATE PROCEDURE sp_add_to_blacklist(
    IN p_visitor_id INT,
    IN p_reason TEXT,
    IN p_added_by INT
)
BEGIN
    UPDATE VISITOR
    SET Is_Blacklisted = TRUE,
        Blacklist_Reason = p_reason
    WHERE Visitor_ID = p_visitor_id;
    
    UPDATE BLACKLIST_LOG
    SET Added_By = p_added_by
    WHERE Visitor_ID = p_visitor_id
    AND Action = 'Added'
    ORDER BY Action_Date DESC
    LIMIT 1;
END//
DELIMITER ;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Current active visitors
CREATE VIEW vw_active_visitors AS
SELECT 
    vs.Session_ID,
    v.Visitor_ID,
    v.Full_Name,
    v.Contact_No,
    v.Company_Name,
    vs.Host_Name,
    vs.Host_Department,
    vs.Visit_Purpose,
    vs.CheckIn_Time,
    vs.Expected_CheckOut_Time,
    TIMESTAMPDIFF(MINUTE, vs.CheckIn_Time, NOW()) as Duration_Minutes,
    vs.Visit_Status
FROM VISIT_SESSION vs
JOIN VISITOR v ON vs.Visitor_ID = v.Visitor_ID
WHERE vs.Visit_Status IN ('Checked-In', 'Overstay');

-- View: Today's visit summary
CREATE VIEW vw_today_summary AS
SELECT 
    COUNT(*) as Total_Visits,
    SUM(CASE WHEN Visit_Status = 'Checked-In' THEN 1 ELSE 0 END) as Currently_Inside,
    SUM(CASE WHEN Visit_Status = 'Checked-Out' THEN 1 ELSE 0 END) as Checked_Out,
    SUM(CASE WHEN Visit_Status = 'Overstay' THEN 1 ELSE 0 END) as Overstays
FROM VISIT_SESSION
WHERE DATE(CheckIn_Time) = CURDATE();

-- View: Blacklisted visitors
CREATE VIEW vw_blacklisted_visitors AS
SELECT 
    v.Visitor_ID,
    v.Full_Name,
    v.Contact_No,
    v.Email,
    v.ID_Type,
    v.ID_Number,
    v.Blacklist_Reason,
    v.Updated_At as Blacklisted_Date
FROM VISITOR v
WHERE v.Is_Blacklisted = TRUE;

-- ============================================
-- ADD ADDRESS COLUMN TO VISITOR TABLE
-- Run this SQL to add address field
-- ============================================

USE visitor_management_system;

-- Add Address column to VISITOR table
ALTER TABLE VISITOR 
ADD COLUMN Address VARCHAR(255) AFTER Company_Name;

-- Verify the change
DESC VISITOR;

-- Update existing records with default address (optional)
UPDATE VISITOR SET Address = 'Not provided' WHERE Address IS NULL;

SELECT 'Address column added successfully!' as Status;