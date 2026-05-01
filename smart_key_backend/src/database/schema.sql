-- Drop tables in reverse order of dependencies to avoid foreign key constraints errors
DROP TABLE IF EXISTS ai_alerts;
DROP TABLE IF EXISTS visitor_logs;
DROP TABLE IF EXISTS visitors;
DROP TABLE IF EXISTS parking_logs;
DROP TABLE IF EXISTS parking_bookings;
DROP TABLE IF EXISTS parking_slots;

DROP TABLE IF EXISTS facility_requests;
DROP TABLE IF EXISTS key_setup_requests;
DROP TABLE IF EXISTS setup_requests;
DROP TABLE IF EXISTS security_assignments;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS key_transactions;
DROP TABLE IF EXISTS key_requests;
DROP TABLE IF EXISTS keyss;
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS organizations;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS service_prices;

-- ============================================================
-- EXISTING TABLES
-- ============================================================

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(15) UNIQUE,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE organizations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  address TEXT,
  phone_number VARCHAR(20),
  status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE units (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT NOT NULL,
  owner_id BIGINT NOT NULL,
  unit_name VARCHAR(100),
  status ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',

  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE keyss (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  unit_id BIGINT NOT NULL,
  key_code VARCHAR(50) UNIQUE NOT NULL,
  key_type ENUM('MAIN','SPARE','EMERGENCY'),
  locker_no VARCHAR(50),
  status ENUM('AVAILABLE','ISSUED','LOST') DEFAULT 'AVAILABLE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (unit_id) REFERENCES units(id)
);

CREATE TABLE key_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  key_id BIGINT NOT NULL,
  requested_by BIGINT NOT NULL,
  approved_by BIGINT,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (key_id) REFERENCES keyss(id),
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE key_transactions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  key_id BIGINT NOT NULL,
  request_id BIGINT,
  issued_to BIGINT NOT NULL,
  issued_by BIGINT NOT NULL,
  issue_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  return_time TIMESTAMP NULL,
  access_method ENUM('OTP','QR','RFID'),
  status ENUM('ISSUED','RETURNED','LOST') DEFAULT 'ISSUED',

  FOREIGN KEY (key_id) REFERENCES keyss(id),
  FOREIGN KEY (issued_to) REFERENCES users(id),
  FOREIGN KEY (issued_by) REFERENCES users(id)
);

CREATE TABLE audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT,
  action VARCHAR(100),
  entity VARCHAR(50),
  entity_id BIGINT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(100),
  message TEXT,
  channel ENUM('SMS','EMAIL','WHATSAPP'),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE security_assignments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  org_id BIGINT,
  user_id BIGINT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (org_id) REFERENCES organizations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE setup_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  requested_by BIGINT NOT NULL,
  org_name VARCHAR(150) NOT NULL,
  org_address TEXT,
  unit_name VARCHAR(100) NOT NULL,
  key_code VARCHAR(100),
  key_type VARCHAR(20),
  locker_no VARCHAR(50),
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  approved_by BIGINT NULL,
  note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE key_setup_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requested_by BIGINT NOT NULL,
  unit_id BIGINT NOT NULL,
  key_code VARCHAR(100) NOT NULL,
  key_type VARCHAR(20) DEFAULT 'MAIN',
  locker_no VARCHAR(50) NULL,
  status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  note VARCHAR(255) NULL,
  approved_by BIGINT NULL,
  created_key_id BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE facility_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  unit_id BIGINT NOT NULL,
  request_type ENUM('WATER', 'TEA', 'CLEANING') NOT NULL,
  description TEXT,
  quantity INT DEFAULT 1,
  amount DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (unit_id) REFERENCES units(id)
);

CREATE TABLE service_prices (
  service_type ENUM('WATER', 'TEA', 'CLEANING') PRIMARY KEY,
  price DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO service_prices (service_type, price) VALUES
('WATER', 20.00),
('TEA', 10.00),
('CLEANING', 100.00)
ON DUPLICATE KEY UPDATE price = VALUES(price);

-- ============================================================
-- NEW MODULES (SMART PARKING, VISITOR MANAGEMENT, AI ALERTS)
-- ============================================================

-- 1A. Parking Slots
CREATE TABLE IF NOT EXISTS parking_slots (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  org_id      BIGINT NOT NULL,
  slot_number VARCHAR(20) NOT NULL,
  slot_type   ENUM('TWO_WHEELER', 'FOUR_WHEELER') NOT NULL,
  floor       VARCHAR(10) DEFAULT 'G',
  status      ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED') DEFAULT 'AVAILABLE',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,

  -- Prevent duplicate slot numbers within the same org
  UNIQUE KEY uq_org_slot (org_id, slot_number)
);

-- Indexes for frequent queries
CREATE INDEX idx_ps_org_status  ON parking_slots (org_id, status);
CREATE INDEX idx_ps_org_type    ON parking_slots (org_id, slot_type);
CREATE INDEX idx_ps_floor       ON parking_slots (org_id, floor);


-- 1B. Parking Bookings
CREATE TABLE IF NOT EXISTS parking_bookings (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  slot_id       BIGINT NOT NULL,
  unit_id       BIGINT NOT NULL,
  owner_id      BIGINT NOT NULL,
  vehicle_number VARCHAR(20) NOT NULL,
  booking_date  DATE NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  status        ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') DEFAULT 'PENDING',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (slot_id)   REFERENCES parking_slots(id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id)   REFERENCES units(id)          ON DELETE CASCADE,
  FOREIGN KEY (owner_id)  REFERENCES users(id)           ON DELETE CASCADE
);

-- Indexes for frequent queries
CREATE INDEX idx_pb_slot_date     ON parking_bookings (slot_id, booking_date);
CREATE INDEX idx_pb_owner         ON parking_bookings (owner_id);
CREATE INDEX idx_pb_unit          ON parking_bookings (unit_id);
CREATE INDEX idx_pb_status        ON parking_bookings (status);
CREATE INDEX idx_pb_vehicle       ON parking_bookings (vehicle_number);
CREATE INDEX idx_pb_booking_date  ON parking_bookings (booking_date);


-- 1C. Parking Logs (vehicle entry / exit tracked by security)
CREATE TABLE IF NOT EXISTS parking_logs (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  slot_id         BIGINT NOT NULL,
  vehicle_number  VARCHAR(20) NOT NULL,
  driver_name     VARCHAR(100) DEFAULT NULL,
  unit_id         BIGINT DEFAULT NULL,
  security_id     BIGINT NOT NULL,
  entry_time      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  exit_time       TIMESTAMP NULL DEFAULT NULL,
  type            ENUM('VISITOR', 'RESIDENT', 'DELIVERY') NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (slot_id)     REFERENCES parking_slots(id)  ON DELETE CASCADE,
  FOREIGN KEY (unit_id)     REFERENCES units(id)           ON DELETE SET NULL,
  FOREIGN KEY (security_id) REFERENCES users(id)           ON DELETE CASCADE
);

-- Indexes for frequent queries
CREATE INDEX idx_pl_slot          ON parking_logs (slot_id);
CREATE INDEX idx_pl_vehicle       ON parking_logs (vehicle_number);
CREATE INDEX idx_pl_security      ON parking_logs (security_id);
CREATE INDEX idx_pl_entry_time    ON parking_logs (entry_time);
CREATE INDEX idx_pl_type          ON parking_logs (type);
CREATE INDEX idx_pl_exit_null     ON parking_logs (exit_time);


-- 2A. Visitors (pre-approved by owner with OTP)
CREATE TABLE IF NOT EXISTS visitors (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  unit_id         BIGINT NOT NULL,
  owner_id        BIGINT NOT NULL,
  visitor_name    VARCHAR(100) NOT NULL,
  visitor_phone   VARCHAR(15) NOT NULL,
  purpose         VARCHAR(255) DEFAULT NULL,
  expected_date   DATE NOT NULL,
  otp             VARCHAR(6) DEFAULT NULL,
  otp_expiry      TIMESTAMP NULL DEFAULT NULL,
  status          ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED') DEFAULT 'PENDING',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (unit_id)  REFERENCES units(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for frequent queries
CREATE INDEX idx_v_unit           ON visitors (unit_id);
CREATE INDEX idx_v_owner          ON visitors (owner_id);
CREATE INDEX idx_v_status         ON visitors (status);
CREATE INDEX idx_v_expected_date  ON visitors (expected_date);
CREATE INDEX idx_v_phone          ON visitors (visitor_phone);
CREATE INDEX idx_v_otp            ON visitors (otp);


-- 2B. Visitor Logs (entry / exit tracked by security)
CREATE TABLE IF NOT EXISTS visitor_logs (
  id              BIGINT AUTO_INCREMENT PRIMARY KEY,
  visitor_id      BIGINT NOT NULL,
  security_id     BIGINT NOT NULL,
  unit_id         BIGINT NOT NULL,
  entry_time      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  exit_time       TIMESTAMP NULL DEFAULT NULL,
  vehicle_number  VARCHAR(20) DEFAULT NULL,
  photo_url       VARCHAR(500) DEFAULT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (visitor_id)  REFERENCES visitors(id)  ON DELETE CASCADE,
  FOREIGN KEY (security_id) REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (unit_id)     REFERENCES units(id)      ON DELETE CASCADE
);

-- Indexes for frequent queries
CREATE INDEX idx_vl_visitor       ON visitor_logs (visitor_id);
CREATE INDEX idx_vl_security      ON visitor_logs (security_id);
CREATE INDEX idx_vl_unit          ON visitor_logs (unit_id);
CREATE INDEX idx_vl_entry_time    ON visitor_logs (entry_time);
CREATE INDEX idx_vl_exit_null     ON visitor_logs (exit_time);


-- 3. AI FEATURES (Gemini-powered alerts)
CREATE TABLE IF NOT EXISTS ai_alerts (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  org_id        BIGINT DEFAULT NULL,
  alert_type    ENUM(
                  'OVERDUE_KEY',
                  'SUSPICIOUS_ACCESS',
                  'PARKING_ANOMALY',
                  'UNUSUAL_VISITOR'
                ) NOT NULL,
  entity_id     BIGINT DEFAULT NULL,
  entity_type   VARCHAR(50) DEFAULT NULL,
  message       TEXT NOT NULL,
  severity      ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- Indexes for frequent queries
CREATE INDEX idx_ai_org           ON ai_alerts (org_id);
CREATE INDEX idx_ai_type          ON ai_alerts (alert_type);
CREATE INDEX idx_ai_severity      ON ai_alerts (severity);
CREATE INDEX idx_ai_is_read       ON ai_alerts (is_read);
CREATE INDEX idx_ai_created       ON ai_alerts (created_at);
CREATE INDEX idx_ai_entity        ON ai_alerts (entity_type, entity_id);
