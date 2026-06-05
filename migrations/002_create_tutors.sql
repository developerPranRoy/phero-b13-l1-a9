-- Migration: 002_create_tutors
-- Up

CREATE TABLE IF NOT EXISTS tutors (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(150)  NOT NULL,
  photo               TEXT          NOT NULL,
  subject             VARCHAR(100)  NOT NULL,
  available_days      VARCHAR(100)  NOT NULL,
  available_time      VARCHAR(100)  NOT NULL,
  hourly_fee          NUMERIC(10,2) NOT NULL CHECK (hourly_fee >= 0),
  total_slot          INTEGER       NOT NULL CHECK (total_slot >= 0),
  session_start_date  DATE          NOT NULL,
  institution         VARCHAR(200)  NOT NULL,
  experience          VARCHAR(100)  NOT NULL,
  location            VARCHAR(150)  NOT NULL,
  teaching_mode       VARCHAR(10)   NOT NULL
                        CHECK (teaching_mode IN ('Online', 'Offline', 'Both')),
  created_by          VARCHAR(255)  NOT NULL,  -- user email
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Indexes for search and filter
CREATE INDEX IF NOT EXISTS idx_tutors_name        ON tutors USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_tutors_subject     ON tutors(subject);
CREATE INDEX IF NOT EXISTS idx_tutors_session_date ON tutors(session_start_date);
CREATE INDEX IF NOT EXISTS idx_tutors_created_by  ON tutors(created_by);

CREATE TRIGGER tutors_updated_at
  BEFORE UPDATE ON tutors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
