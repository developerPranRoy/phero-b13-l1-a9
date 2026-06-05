-- Migration: 003_create_bookings
-- Up

CREATE TABLE IF NOT EXISTS bookings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id        UUID        NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  tutor_name      VARCHAR(150) NOT NULL,
  student_name    VARCHAR(150) NOT NULL,
  student_email   VARCHAR(255) NOT NULL,
  phone           VARCHAR(20)  NOT NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'cancelled')),
  session_token   UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  booked_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_student_email ON bookings(student_email);
CREATE INDEX IF NOT EXISTS idx_bookings_tutor_id      ON bookings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status        ON bookings(status);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
