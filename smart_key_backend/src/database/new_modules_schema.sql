-- ============================================================
-- SMART KEY MANAGEMENT SYSTEM — NEW MODULES SCHEMA
-- Run AFTER the existing schema.sql tables are in place.
-- This script only creates NEW tables; no ALTER on existing ones.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- MODULE 1: SMART PARKING
-- ────────────────────────────────────────────────────────────

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes for frequent queries
CREATE INDEX idx_pl_slot          ON parking_logs (slot_id);
CREATE INDEX idx_pl_vehicle       ON parking_logs (vehicle_number);
CREATE INDEX idx_pl_security      ON parking_logs (security_id);
CREATE INDEX idx_pl_entry_time    ON parking_logs (entry_time);
CREATE INDEX idx_pl_type          ON parking_logs (type);
CREATE INDEX idx_pl_exit_null     ON parking_logs (exit_time);


-- ────────────────────────────────────────────────────────────
-- MODULE 2: VISITOR MANAGEMENT (MyGate style)
-- ────────────────────────────────────────────────────────────

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes for frequent queries
CREATE INDEX idx_vl_visitor       ON visitor_logs (visitor_id);
CREATE INDEX idx_vl_security      ON visitor_logs (security_id);
CREATE INDEX idx_vl_unit          ON visitor_logs (unit_id);
CREATE INDEX idx_vl_entry_time    ON visitor_logs (entry_time);
CREATE INDEX idx_vl_exit_null     ON visitor_logs (exit_time);


-- ────────────────────────────────────────────────────────────
-- MODULE 3: AI FEATURES (Gemini-powered alerts)
-- ────────────────────────────────────────────────────────────

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes for frequent queries
CREATE INDEX idx_ai_org           ON ai_alerts (org_id);
CREATE INDEX idx_ai_type          ON ai_alerts (alert_type);
CREATE INDEX idx_ai_severity      ON ai_alerts (severity);
CREATE INDEX idx_ai_is_read       ON ai_alerts (is_read);
CREATE INDEX idx_ai_created       ON ai_alerts (created_at);
CREATE INDEX idx_ai_entity        ON ai_alerts (entity_type, entity_id);
