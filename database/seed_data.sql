-- ============================================
-- VISITOR MANAGEMENT SYSTEM - SEED DATA
-- Sample data for testing
-- ============================================

USE visitor_management_system;

-- ============================================
-- Insert User Accounts
-- Password: 'admin123' hashed with bcrypt
-- ============================================
INSERT INTO USER_ACCOUNT (Username, Full_Name, Role, Contact_No, Email, Password_Hash) VALUES
('admin', 'Rajesh Kumar', 'Admin', '9876543210', 'admin@company.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8SAEyoqKztGfwGEMVNEPWvDCMI0z6'),
('security1', 'Amit Sharma', 'Security', '9876543211', 'amit.security@company.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8SAEyoqKztGfwGEMVNEPWvDCMI0z6'),
('security2', 'Priya Singh', 'Security', '9876543212', 'priya.security@company.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8SAEyoqKztGfwGEMVNEPWvDCMI0z6'),
('reception1', 'Neha Patel', 'Receptionist', '9876543213', 'neha.reception@company.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8SAEyoqKztGfwGEMVNEPWvDCMI0z6'),
('reception2', 'Anjali Verma', 'Receptionist', '9876543214', 'anjali.reception@company.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1J8SAEyoqKztGfwGEMVNEPWvDCMI0z6');

-- ============================================
-- Insert Security Officers
-- ============================================
INSERT INTO SECURITY_OFFICER (Name, Shift, Contact_No) VALUES
('Ramesh Yadav', 'Morning', '9123456780'),
('Suresh Kumar', 'Evening', '9123456781'),
('Vikram Singh', 'Night', '9123456782'),
('Mahesh Gupta', 'General', '9123456783');

-- ============================================
-- Insert Sample Visitors
-- ============================================
INSERT INTO VISITOR (Full_Name, Gender, Contact_No, Email, ID_Type, ID_Number, Company_Name) VALUES
('Rahul Mehta', 'Male', '9988776655', 'rahul.mehta@gmail.com', 'Aadhar', '1234-5678-9012', 'Tech Solutions Ltd'),
('Sneha Desai', 'Female', '9988776656', 'sneha.desai@yahoo.com', 'PAN', 'ABCDE1234F', 'Digital Marketing Co'),
('Arjun Kapoor', 'Male', '9988776657', 'arjun.k@outlook.com', 'Driving License', 'MH01-2023-001234', 'Freelancer'),
('Pooja Rao', 'Female', '9988776658', 'pooja.rao@gmail.com', 'Aadhar', '2345-6789-0123', 'HR Consultants'),
('Vikas Joshi', 'Male', '9988776659', 'vikas.joshi@company.com', 'Passport', 'A1234567', 'Import Export Inc'),
('Kavita Nair', 'Female', '9988776660', 'kavita.nair@gmail.com', 'Voter ID', 'VID123456789', 'Legal Services'),
('Sanjay Reddy', 'Male', '9988776661', 'sanjay.reddy@email.com', 'Aadhar', '3456-7890-1234', 'Construction Ltd'),
('Meera Iyer', 'Female', '9988776662', 'meera.iyer@gmail.com', 'PAN', 'FGHIJ5678K', 'Education Services');

-- ============================================
-- Insert Sample Vehicles
-- ============================================
INSERT INTO VEHICLE (Visitor_ID, Vehicle_No, Vehicle_Type, Parking_Slot) VALUES
(1, 'MH-12-AB-1234', 'Four Wheeler', 'A-101'),
(2, 'MH-14-CD-5678', 'Two Wheeler', 'B-205'),
(3, 'GJ-01-EF-9012', 'Four Wheeler', 'A-102'),
(5, 'KA-05-GH-3456', 'Four Wheeler', 'A-103'),
(7, 'TN-09-IJ-7890', 'Two Wheeler', 'B-206');

-- ============================================
-- Insert Active Visit Sessions (Currently Inside)
-- ============================================
INSERT INTO VISIT_SESSION (
    Visitor_ID, Host_Name, Host_Department, Host_Contact, 
    CheckIn_Time, Expected_CheckOut_Time, Visit_Status, 
    Visit_Purpose, Number_Of_Visitors, Checked_In_By
) VALUES
(1, 'Mr. Anil Sharma', 'IT Department', '9871234560', 
 NOW() - INTERVAL 2 HOUR, NOW() + INTERVAL 1 HOUR, 'Checked-In',
 'Technical Meeting', 1, 4),
 
(2, 'Ms. Sunita Reddy', 'Marketing', '9871234561',
 NOW() - INTERVAL 1 HOUR, NOW() + INTERVAL 2 HOUR, 'Checked-In',
 'Project Discussion', 1, 4),
 
(4, 'Mr. Prakash Jain', 'HR Department', '9871234562',
 NOW() - INTERVAL 30 MINUTE, NOW() + INTERVAL 1.5 HOUR, 'Checked-In',
 'Interview', 1, 5);

-- ============================================
-- Insert Checked-Out Visit Sessions (Recent History)
-- ============================================
INSERT INTO VISIT_SESSION (
    Visitor_ID, Host_Name, Host_Department, Host_Contact,
    CheckIn_Time, CheckOut_Time, Expected_CheckOut_Time,
    Visit_Status, Visit_Purpose, Number_Of_Visitors,
    Checked_In_By, Checked_Out_By, Remarks
) VALUES
(3, 'Mr. Ramesh Verma', 'Finance', '9871234563',
 NOW() - INTERVAL 5 HOUR, NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 3 HOUR,
 'Checked-Out', 'Financial Audit', 1, 4, 2, 'Normal checkout'),
 
(5, 'Ms. Kavita Shah', 'Operations', '9871234564',
 NOW() - INTERVAL 1 DAY, NOW() - INTERVAL 23 HOUR, NOW() - INTERVAL 23 HOUR,
 'Checked-Out', 'Vendor Meeting', 1, 5, 2, 'Completed successfully'),
 
(6, 'Mr. Deepak Malhotra', 'Legal', '9871234565',
 NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 1 DAY - INTERVAL 22 HOUR, NOW() - INTERVAL 1 DAY - INTERVAL 22 HOUR,
 'Checked-Out', 'Legal Consultation', 1, 4, 3, NULL),

(7, 'Ms. Anjali Deshmukh', 'Admin', '9871234566',
 NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 2 DAY - INTERVAL 20 HOUR, NOW() - INTERVAL 2 DAY - INTERVAL 20 HOUR,
 'Checked-Out', 'Facility Inspection', 1, 5, 2, 'Inspection completed');

-- ============================================
-- Insert Overstay Session (For Testing)
-- ============================================
INSERT INTO VISIT_SESSION (
    Visitor_ID, Host_Name, Host_Department, Host_Contact,
    CheckIn_Time, Expected_CheckOut_Time, Visit_Status,
    Visit_Purpose, Number_Of_Visitors, Checked_In_By
) VALUES
(8, 'Mr. Suresh Pillai', 'Engineering', '9871234567',
 NOW() - INTERVAL 4 HOUR, NOW() - INTERVAL 1 HOUR, 'Overstay',
 'Technical Support', 1, 4);

-- ============================================
-- Insert Blacklisted Visitor
-- ============================================
INSERT INTO VISITOR (Full_Name, Gender, Contact_No, Email, ID_Type, ID_Number, Company_Name, Is_Blacklisted, Blacklist_Reason) VALUES
('Suspicious Person', 'Male', '9900112233', 'suspicious@email.com', 'Aadhar', '9999-8888-7777', 'Unknown', TRUE, 'Security threat - unauthorized access attempt on 2024-10-15');

-- ============================================
-- Insert System Settings
-- ============================================
INSERT INTO SYSTEM_SETTINGS (Setting_Key, Setting_Value, Description) VALUES
('facility_name', 'Corporate Headquarters', 'Name of the facility'),
('facility_address', '123 Business Park, Indore, MP 452001', 'Facility address'),
('max_visit_duration_hours', '8', 'Maximum allowed visit duration in hours'),
('parking_slots_total', '150', 'Total parking slots available'),
('visitor_pass_prefix', 'VIS', 'Prefix for visitor pass numbers'),
('enable_vehicle_registration', 'true', 'Enable/disable vehicle registration'),
('working_hours_start', '09:00', 'Facility working hours start time'),
('working_hours_end', '18:00', 'Facility working hours end time');

-- ============================================
-- Verification Logs (Auto-generated by triggers)
-- Additional manual entries for demo
-- ============================================
INSERT INTO VERIFICATION_LOG (Session_ID, Officer_ID, Action, Action_Details, Timestamp) VALUES
(1, 1, 'Verification', 'ID verified - Aadhar card checked', NOW() - INTERVAL 2 HOUR),
(2, 1, 'Verification', 'ID verified - PAN card checked', NOW() - INTERVAL 1 HOUR),
(3, 2, 'Verification', 'ID verified - Aadhar card checked', NOW() - INTERVAL 30 MINUTE),
(4, 1, 'Verification', 'ID verified - Driving License checked', NOW() - INTERVAL 5 HOUR),
(5, 2, 'Verification', 'ID verified - Passport checked', NOW() - INTERVAL 1 DAY);

-- ============================================
-- Query to verify data insertion
-- ============================================
SELECT 'Data insertion completed successfully!' as Status;

-- Show summary
SELECT 
    (SELECT COUNT(*) FROM USER_ACCOUNT) as Total_Users,
    (SELECT COUNT(*) FROM VISITOR) as Total_Visitors,
    (SELECT COUNT(*) FROM VEHICLE) as Total_Vehicles,
    (SELECT COUNT(*) FROM VISIT_SESSION) as Total_Sessions,
    (SELECT COUNT(*) FROM SECURITY_OFFICER) as Total_Officers,
    (SELECT COUNT(*) FROM VERIFICATION_LOG) as Total_Logs;

-- Show active visitors
SELECT * FROM vw_active_visitors;

-- Show today's summary
SELECT * FROM vw_today_summary;

