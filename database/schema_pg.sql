-- ============================================
-- VISITOR MANAGEMENT SYSTEM - POSTGRESQL SCHEMA
-- Migrated from MySQL
-- ============================================

-- ============================================
-- TABLE: USER_ACCOUNT
-- ============================================
CREATE TABLE IF NOT EXISTS USER_ACCOUNT (
    User_ID SERIAL PRIMARY KEY,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Full_Name VARCHAR(100) NOT NULL,
    Role VARCHAR(20) NOT NULL CHECK (Role IN ('Admin', 'Security', 'Receptionist')),
    Contact_No VARCHAR(15) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password_Hash VARCHAR(255) NOT NULL,
    Is_Active BOOLEAN DEFAULT TRUE,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_username ON USER_ACCOUNT(Username);
CREATE INDEX IF NOT EXISTS idx_user_role ON USER_ACCOUNT(Role);
CREATE INDEX IF NOT EXISTS idx_user_email ON USER_ACCOUNT(Email);

-- ============================================
-- TABLE: VISITOR
-- ============================================
CREATE TABLE IF NOT EXISTS VISITOR (
    Visitor_ID SERIAL PRIMARY KEY,
    Full_Name VARCHAR(100) NOT NULL,
    Gender VARCHAR(10) NOT NULL CHECK (Gender IN ('Male', 'Female', 'Other')),
    Contact_No VARCHAR(15) NOT NULL,
    Email VARCHAR(100),
    ID_Type VARCHAR(20) NOT NULL CHECK (ID_Type IN ('Aadhar', 'PAN', 'Driving License', 'Passport', 'Voter ID', 'Other')),
    ID_Number VARCHAR(50) NOT NULL,
    Company_Name VARCHAR(100),
    Address VARCHAR(255),
    Is_Blacklisted BOOLEAN DEFAULT FALSE,
    Blacklist_Reason TEXT,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_visitor_contact ON VISITOR(Contact_No);
CREATE INDEX IF NOT EXISTS idx_visitor_email ON VISITOR(Email);
CREATE INDEX IF NOT EXISTS idx_visitor_id_number ON VISITOR(ID_Number);
CREATE INDEX IF NOT EXISTS idx_visitor_blacklist ON VISITOR(Is_Blacklisted);

-- ============================================
-- TABLE: VISIT_SESSION
-- ============================================
CREATE TABLE IF NOT EXISTS VISIT_SESSION (
    Session_ID SERIAL PRIMARY KEY,
    Visitor_ID INT NOT NULL,
    Host_User_ID INT,
    Host_Name VARCHAR(100),
    Host_Department VARCHAR(100),
    Host_Contact VARCHAR(15),
    CheckIn_Time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CheckOut_Time TIMESTAMP,
    Expected_CheckOut_Time TIMESTAMP,
    Visit_Status VARCHAR(20) NOT NULL DEFAULT 'Checked-In' CHECK (Visit_Status IN ('Scheduled', 'Checked-In', 'Checked-Out', 'Cancelled', 'Overstay')),
    Visit_Purpose VARCHAR(255) NOT NULL,
    Number_Of_Visitors INT DEFAULT 1,
    Remarks TEXT,
    Checked_In_By INT,
    Checked_Out_By INT,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Visitor_ID) REFERENCES VISITOR(Visitor_ID) ON DELETE CASCADE,
    FOREIGN KEY (Host_User_ID) REFERENCES USER_ACCOUNT(User_ID) ON DELETE SET NULL,
    FOREIGN KEY (Checked_In_By) REFERENCES USER_ACCOUNT(User_ID) ON DELETE SET NULL,
    FOREIGN KEY (Checked_Out_By) REFERENCES USER_ACCOUNT(User_ID) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_session_visitor ON VISIT_SESSION(Visitor_ID);
CREATE INDEX IF NOT EXISTS idx_session_host ON VISIT_SESSION(Host_User_ID);
CREATE INDEX IF NOT EXISTS idx_session_status ON VISIT_SESSION(Visit_Status);
CREATE INDEX IF NOT EXISTS idx_session_checkin ON VISIT_SESSION(CheckIn_Time);
CREATE INDEX IF NOT EXISTS idx_session_checkout ON VISIT_SESSION(CheckOut_Time);

-- ============================================
-- TABLE: SECURITY_OFFICER
-- ============================================
CREATE TABLE IF NOT EXISTS SECURITY_OFFICER (
    Officer_ID SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Shift VARCHAR(10) NOT NULL CHECK (Shift IN ('Morning', 'Evening', 'Night', 'General')),
    Contact_No VARCHAR(15) NOT NULL,
    Is_Active BOOLEAN DEFAULT TRUE,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_officer_shift ON SECURITY_OFFICER(Shift);
CREATE INDEX IF NOT EXISTS idx_officer_active ON SECURITY_OFFICER(Is_Active);

-- ============================================
-- TABLE: VERIFICATION_LOG
-- ============================================
CREATE TABLE IF NOT EXISTS VERIFICATION_LOG (
    Log_ID SERIAL PRIMARY KEY,
    Session_ID INT NOT NULL,
    Officer_ID INT,
    Action VARCHAR(20) NOT NULL CHECK (Action IN ('Check-In', 'Check-Out', 'Verification', 'Status Update', 'Cancelled', 'Other')),
    Action_Details TEXT,
    Timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Session_ID) REFERENCES VISIT_SESSION(Session_ID) ON DELETE CASCADE,
    FOREIGN KEY (Officer_ID) REFERENCES SECURITY_OFFICER(Officer_ID) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_vlog_session ON VERIFICATION_LOG(Session_ID);
CREATE INDEX IF NOT EXISTS idx_vlog_officer ON VERIFICATION_LOG(Officer_ID);
CREATE INDEX IF NOT EXISTS idx_vlog_timestamp ON VERIFICATION_LOG(Timestamp);
CREATE INDEX IF NOT EXISTS idx_vlog_action ON VERIFICATION_LOG(Action);

-- ============================================
-- TABLE: BLACKLIST_LOG
-- ============================================
CREATE TABLE IF NOT EXISTS BLACKLIST_LOG (
    Log_ID SERIAL PRIMARY KEY,
    Visitor_ID INT NOT NULL,
    Action VARCHAR(10) NOT NULL CHECK (Action IN ('Added', 'Removed')),
    Reason TEXT NOT NULL,
    Added_By INT,
    Action_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Visitor_ID) REFERENCES VISITOR(Visitor_ID) ON DELETE CASCADE,
    FOREIGN KEY (Added_By) REFERENCES USER_ACCOUNT(User_ID) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_blist_visitor ON BLACKLIST_LOG(Visitor_ID);
CREATE INDEX IF NOT EXISTS idx_blist_date ON BLACKLIST_LOG(Action_Date);

-- ============================================
-- TABLE: SYSTEM_SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS SYSTEM_SETTINGS (
    Setting_ID SERIAL PRIMARY KEY,
    Setting_Key VARCHAR(50) UNIQUE NOT NULL,
    Setting_Value TEXT NOT NULL,
    Description VARCHAR(255),
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE: VEHICLE
-- ============================================
CREATE TABLE IF NOT EXISTS VEHICLE (
    Vehicle_ID SERIAL PRIMARY KEY,
    Visitor_ID INT NOT NULL,
    Vehicle_No VARCHAR(20) NOT NULL,
    Vehicle_Type VARCHAR(20) NOT NULL CHECK (Vehicle_Type IN ('Two Wheeler', 'Four Wheeler', 'Other')),
    Parking_Slot VARCHAR(10),
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Visitor_ID) REFERENCES VISITOR(Visitor_ID) ON DELETE CASCADE
);

-- ============================================
-- AUTO-UPDATE Updated_At TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.Updated_At = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with Updated_At
CREATE TRIGGER trg_user_updated_at BEFORE UPDATE ON USER_ACCOUNT
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_visitor_updated_at BEFORE UPDATE ON VISITOR
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_session_updated_at BEFORE UPDATE ON VISIT_SESSION
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_officer_updated_at BEFORE UPDATE ON SECURITY_OFFICER
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER: Auto-update visit status to 'Overstay'
-- ============================================
CREATE OR REPLACE FUNCTION check_overstay()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.Visit_Status = 'Checked-In'
       AND NEW.Expected_CheckOut_Time IS NOT NULL
       AND NOW() > NEW.Expected_CheckOut_Time THEN
        NEW.Visit_Status := 'Overstay';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_overstay BEFORE UPDATE ON VISIT_SESSION
    FOR EACH ROW EXECUTE FUNCTION check_overstay();

-- ============================================
-- TRIGGER: Log check-in
-- ============================================
CREATE OR REPLACE FUNCTION log_checkin()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO VERIFICATION_LOG (Session_ID, Action, Action_Details, Timestamp)
    VALUES (NEW.Session_ID, 'Check-In', 'Visitor checked in. Purpose: ' || NEW.Visit_Purpose, NEW.CheckIn_Time);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_checkin AFTER INSERT ON VISIT_SESSION
    FOR EACH ROW EXECUTE FUNCTION log_checkin();

-- ============================================
-- TRIGGER: Log check-out
-- ============================================
CREATE OR REPLACE FUNCTION log_checkout()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.CheckOut_Time IS NULL AND NEW.CheckOut_Time IS NOT NULL THEN
        INSERT INTO VERIFICATION_LOG (Session_ID, Action, Action_Details, Timestamp)
        VALUES (NEW.Session_ID, 'Check-Out', 'Visitor checked out', NEW.CheckOut_Time);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_checkout AFTER UPDATE ON VISIT_SESSION
    FOR EACH ROW EXECUTE FUNCTION log_checkout();

-- ============================================
-- TRIGGER: Log blacklist actions
-- ============================================
CREATE OR REPLACE FUNCTION log_blacklist_action()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.Is_Blacklisted IS DISTINCT FROM NEW.Is_Blacklisted THEN
        IF NEW.Is_Blacklisted = TRUE THEN
            INSERT INTO BLACKLIST_LOG (Visitor_ID, Action, Reason)
            VALUES (NEW.Visitor_ID, 'Added', COALESCE(NEW.Blacklist_Reason, 'No reason provided'));
        ELSE
            INSERT INTO BLACKLIST_LOG (Visitor_ID, Action, Reason)
            VALUES (NEW.Visitor_ID, 'Removed', 'Blacklist removed');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_blacklist AFTER UPDATE ON VISITOR
    FOR EACH ROW EXECUTE FUNCTION log_blacklist_action();

-- ============================================
-- STORED PROCEDURES (as PostgreSQL functions)
-- ============================================

-- Function: Register new visitor and check-in
CREATE OR REPLACE FUNCTION sp_register_and_checkin(
    p_full_name VARCHAR, p_gender VARCHAR, p_contact VARCHAR,
    p_email VARCHAR, p_id_type VARCHAR, p_id_number VARCHAR,
    p_company VARCHAR, p_host_name VARCHAR, p_host_dept VARCHAR,
    p_host_contact VARCHAR, p_purpose VARCHAR,
    p_expected_checkout TIMESTAMP, p_checked_in_by INT
)
RETURNS TABLE(session_id INT, visitor_id INT) AS $$
DECLARE
    v_is_blacklisted BOOLEAN;
    v_existing_visitor INT;
    v_session_id INT;
    v_visitor_id INT;
BEGIN
    -- Check if visitor exists
    SELECT v.Visitor_ID, v.Is_Blacklisted INTO v_existing_visitor, v_is_blacklisted
    FROM VISITOR v
    WHERE v.Contact_No = p_contact OR v.ID_Number = p_id_number
    LIMIT 1;

    -- If blacklisted, raise error
    IF v_is_blacklisted = TRUE THEN
        RAISE EXCEPTION 'Visitor is blacklisted and cannot check in';
    END IF;

    -- If visitor doesn't exist, create new
    IF v_existing_visitor IS NULL THEN
        INSERT INTO VISITOR (Full_Name, Gender, Contact_No, Email, ID_Type, ID_Number, Company_Name)
        VALUES (p_full_name, p_gender, p_contact, p_email, p_id_type, p_id_number, p_company)
        RETURNING VISITOR.Visitor_ID INTO v_existing_visitor;
    END IF;

    -- Create visit session
    INSERT INTO VISIT_SESSION (
        Visitor_ID, Host_Name, Host_Department, Host_Contact,
        Visit_Purpose, Expected_CheckOut_Time, Visit_Status, Checked_In_By
    ) VALUES (
        v_existing_visitor, p_host_name, p_host_dept, p_host_contact,
        p_purpose, p_expected_checkout, 'Checked-In', p_checked_in_by
    ) RETURNING VISIT_SESSION.Session_ID INTO v_session_id;

    v_visitor_id := v_existing_visitor;
    RETURN QUERY SELECT v_session_id, v_visitor_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Check-out visitor
CREATE OR REPLACE FUNCTION sp_checkout_visitor(
    p_session_id INT, p_checked_out_by INT, p_remarks TEXT
)
RETURNS VOID AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE VISIT_SESSION
    SET CheckOut_Time = NOW(),
        Visit_Status = 'Checked-Out',
        Checked_Out_By = p_checked_out_by,
        Remarks = p_remarks
    WHERE Session_ID = p_session_id
    AND Visit_Status IN ('Checked-In', 'Overstay');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count = 0 THEN
        RAISE EXCEPTION 'Invalid session or visitor already checked out';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Get active visitors
CREATE OR REPLACE FUNCTION sp_get_active_visitors()
RETURNS TABLE(
    Session_ID INT, Full_Name VARCHAR, Contact_No VARCHAR,
    Company_Name VARCHAR, Host_Name VARCHAR, Host_Department VARCHAR,
    Visit_Purpose VARCHAR, CheckIn_Time TIMESTAMP,
    Expected_CheckOut_Time TIMESTAMP, Visit_Status VARCHAR,
    Duration_Minutes DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vs.Session_ID, v.Full_Name, v.Contact_No,
        v.Company_Name, vs.Host_Name, vs.Host_Department,
        vs.Visit_Purpose, vs.CheckIn_Time,
        vs.Expected_CheckOut_Time, vs.Visit_Status,
        EXTRACT(EPOCH FROM (NOW() - vs.CheckIn_Time))/60 as Duration_Minutes
    FROM VISIT_SESSION vs
    JOIN VISITOR v ON vs.Visitor_ID = v.Visitor_ID
    WHERE vs.Visit_Status IN ('Checked-In', 'Overstay')
    ORDER BY vs.CheckIn_Time DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get visitor history
CREATE OR REPLACE FUNCTION sp_get_visitor_history(p_visitor_id INT)
RETURNS TABLE(
    Session_ID INT, Host_Name VARCHAR, Visit_Purpose VARCHAR,
    CheckIn_Time TIMESTAMP, CheckOut_Time TIMESTAMP,
    Visit_Status VARCHAR, Duration_Minutes DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vs.Session_ID, vs.Host_Name, vs.Visit_Purpose,
        vs.CheckIn_Time, vs.CheckOut_Time, vs.Visit_Status,
        EXTRACT(EPOCH FROM (COALESCE(vs.CheckOut_Time, NOW()) - vs.CheckIn_Time))/60 as Duration_Minutes
    FROM VISIT_SESSION vs
    WHERE vs.Visitor_ID = p_visitor_id
    ORDER BY vs.CheckIn_Time DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Add to blacklist
CREATE OR REPLACE FUNCTION sp_add_to_blacklist(
    p_visitor_id INT, p_reason TEXT, p_added_by INT
)
RETURNS VOID AS $$
BEGIN
    UPDATE VISITOR
    SET Is_Blacklisted = TRUE,
        Blacklist_Reason = p_reason
    WHERE Visitor_ID = p_visitor_id;

    UPDATE BLACKLIST_LOG
    SET Added_By = p_added_by
    WHERE Visitor_ID = p_visitor_id
    AND Action = 'Added'
    AND Log_ID = (
        SELECT Log_ID FROM BLACKLIST_LOG
        WHERE Visitor_ID = p_visitor_id AND Action = 'Added'
        ORDER BY Action_Date DESC LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS
-- ============================================

CREATE OR REPLACE VIEW vw_active_visitors AS
SELECT
    vs.Session_ID, v.Visitor_ID, v.Full_Name, v.Contact_No,
    v.Company_Name, vs.Host_Name, vs.Host_Department,
    vs.Visit_Purpose, vs.CheckIn_Time, vs.Expected_CheckOut_Time,
    EXTRACT(EPOCH FROM (NOW() - vs.CheckIn_Time))/60 as Duration_Minutes,
    vs.Visit_Status
FROM VISIT_SESSION vs
JOIN VISITOR v ON vs.Visitor_ID = v.Visitor_ID
WHERE vs.Visit_Status IN ('Checked-In', 'Overstay');

CREATE OR REPLACE VIEW vw_today_summary AS
SELECT
    COUNT(*) as Total_Visits,
    SUM(CASE WHEN Visit_Status = 'Checked-In' THEN 1 ELSE 0 END) as Currently_Inside,
    SUM(CASE WHEN Visit_Status = 'Checked-Out' THEN 1 ELSE 0 END) as Checked_Out,
    SUM(CASE WHEN Visit_Status = 'Overstay' THEN 1 ELSE 0 END) as Overstays
FROM VISIT_SESSION
WHERE DATE(CheckIn_Time) = CURRENT_DATE;

CREATE OR REPLACE VIEW vw_blacklisted_visitors AS
SELECT
    v.Visitor_ID, v.Full_Name, v.Contact_No, v.Email,
    v.ID_Type, v.ID_Number, v.Blacklist_Reason,
    v.Updated_At as Blacklisted_Date
FROM VISITOR v
WHERE v.Is_Blacklisted = TRUE;
