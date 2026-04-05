-- ============================================
-- VISITOR MANAGEMENT SYSTEM - POSTGRESQL SEED DATA
-- ============================================

-- ============================================
-- Insert User Accounts (Password: admin123)
-- ============================================
INSERT INTO USER_ACCOUNT (Username, Full_Name, Role, Contact_No, Email, Password_Hash, Is_Active) VALUES
('admin', 'Admin User', 'Admin', '9999999999', 'admin@vms.com', '$2b$10$rZ0RkYlKGNqHvVEqH5XzEOxV3GzZ5qWJ1vFGwJqkxZ0JZqGZJQJZe', TRUE),
('reception1', 'Receptionist One', 'Receptionist', '9999999991', 'reception1@vms.com', '$2b$10$rZ0RkYlKGNqHvVEqH5XzEOxV3GzZ5qWJ1vFGwJqkxZ0JZqGZJQJZe', TRUE),
('reception2', 'Receptionist Two', 'Receptionist', '9999999992', 'reception2@vms.com', '$2b$10$rZ0RkYlKGNqHvVEqH5XzEOxV3GzZ5qWJ1vFGwJqkxZ0JZqGZJQJZe', TRUE),
('security1', 'Security One', 'Security', '9999999993', 'security1@vms.com', '$2b$10$rZ0RkYlKGNqHvVEqH5XzEOxV3GzZ5qWJ1vFGwJqkxZ0JZqGZJQJZe', TRUE),
('security2', 'Security Two', 'Security', '9999999994', 'security2@vms.com', '$2b$10$rZ0RkYlKGNqHvVEqH5XzEOxV3GzZ5qWJ1vFGwJqkxZ0JZqGZJQJZe', TRUE);

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
-- Insert Blacklisted Visitor
-- ============================================
INSERT INTO VISITOR (Full_Name, Gender, Contact_No, Email, ID_Type, ID_Number, Company_Name, Is_Blacklisted, Blacklist_Reason) VALUES
('Suspicious Person', 'Male', '9900112233', 'suspicious@email.com', 'Aadhar', '9999-8888-7777', 'Unknown', TRUE, 'Security threat - unauthorized access attempt on 2024-10-15');

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
-- Insert Active Visit Sessions
-- ============================================
INSERT INTO VISIT_SESSION (
    Visitor_ID, Host_Name, Host_Department, Host_Contact,
    CheckIn_Time, Expected_CheckOut_Time, Visit_Status,
    Visit_Purpose, Number_Of_Visitors, Checked_In_By
) VALUES
(1, 'Mr. Anil Sharma', 'IT Department', '9871234560',
 NOW() - INTERVAL '2 hours', NOW() + INTERVAL '1 hour', 'Checked-In',
 'Technical Meeting', 1, 2),
(2, 'Ms. Sunita Reddy', 'Marketing', '9871234561',
 NOW() - INTERVAL '1 hour', NOW() + INTERVAL '2 hours', 'Checked-In',
 'Project Discussion', 1, 2),
(4, 'Mr. Prakash Jain', 'HR Department', '9871234562',
 NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '90 minutes', 'Checked-In',
 'Interview', 1, 3);

-- ============================================
-- Insert Checked-Out Visit Sessions
-- ============================================
INSERT INTO VISIT_SESSION (
    Visitor_ID, Host_Name, Host_Department, Host_Contact,
    CheckIn_Time, CheckOut_Time, Expected_CheckOut_Time,
    Visit_Status, Visit_Purpose, Number_Of_Visitors,
    Checked_In_By, Checked_Out_By, Remarks
) VALUES
(3, 'Mr. Ramesh Verma', 'Finance', '9871234563',
 NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours',
 'Checked-Out', 'Financial Audit', 1, 2, 4, 'Normal checkout'),
(5, 'Ms. Kavita Shah', 'Operations', '9871234564',
 NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', NOW() - INTERVAL '23 hours',
 'Checked-Out', 'Vendor Meeting', 1, 3, 4, 'Completed successfully'),
(6, 'Mr. Deepak Malhotra', 'Legal', '9871234565',
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '46 hours', NOW() - INTERVAL '46 hours',
 'Checked-Out', 'Legal Consultation', 1, 2, 5, NULL),
(7, 'Ms. Anjali Deshmukh', 'Admin', '9871234566',
 NOW() - INTERVAL '3 days', NOW() - INTERVAL '68 hours', NOW() - INTERVAL '68 hours',
 'Checked-Out', 'Facility Inspection', 1, 3, 4, 'Inspection completed');

-- ============================================
-- Insert Overstay Session
-- ============================================
INSERT INTO VISIT_SESSION (
    Visitor_ID, Host_Name, Host_Department, Host_Contact,
    CheckIn_Time, Expected_CheckOut_Time, Visit_Status,
    Visit_Purpose, Number_Of_Visitors, Checked_In_By
) VALUES
(8, 'Mr. Suresh Pillai', 'Engineering', '9871234567',
 NOW() - INTERVAL '4 hours', NOW() - INTERVAL '1 hour', 'Overstay',
 'Technical Support', 1, 2);

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
-- Verification Logs (additional demo entries)
-- ============================================
INSERT INTO VERIFICATION_LOG (Session_ID, Officer_ID, Action, Action_Details, Timestamp) VALUES
(1, 1, 'Verification', 'ID verified - Aadhar card checked', NOW() - INTERVAL '2 hours'),
(2, 1, 'Verification', 'ID verified - PAN card checked', NOW() - INTERVAL '1 hour'),
(3, 2, 'Verification', 'ID verified - Aadhar card checked', NOW() - INTERVAL '30 minutes'),
(4, 1, 'Verification', 'ID verified - Driving License checked', NOW() - INTERVAL '5 hours'),
(5, 2, 'Verification', 'ID verified - Passport checked', NOW() - INTERVAL '1 day');

-- Verify
SELECT 'PostgreSQL seed data inserted successfully!' as Status;
