-- CodeMtaani Group – Enhancement Migration 003
-- Adds: media_assets table, staff profile columns, staff number sequence & trigger.
-- Run after 002-platform-schema.sql.

-- ----------------------------------------------------------
-- 1. media_assets – Persistent image/media storage in PostgreSQL
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename    VARCHAR(255) NOT NULL,
  mime_type   VARCHAR(100) NOT NULL,
  size_bytes  INT          NOT NULL,
  data        BYTEA        NOT NULL,
  alt_text    VARCHAR(300),
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  created_by  UUID         REFERENCES admin_users(id) ON DELETE SET NULL
);

COMMENT ON TABLE media_assets IS 'Persistent binary media storage for images and files uploaded through the admin dashboard.';

CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_mime    ON media_assets(mime_type);

-- ----------------------------------------------------------
-- 2. Extend admin_users with staff profile columns
-- ----------------------------------------------------------
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS staff_number VARCHAR(30) UNIQUE;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS department   VARCHAR(80);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS position     VARCHAR(100);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS phone        VARCHAR(50);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS notes        TEXT;

-- ----------------------------------------------------------
-- 3. Concurrency-safe staff number sequence and trigger
-- ----------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS staff_number_seq START WITH 1 INCREMENT BY 1;

-- Trigger function: assigns CMG-STAFF-XXXX on INSERT if not already set
CREATE OR REPLACE FUNCTION generate_staff_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.staff_number IS NULL OR NEW.staff_number = '' THEN
    NEW.staff_number := 'CMG-STAFF-' || LPAD(nextval('staff_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if present, then recreate
DROP TRIGGER IF EXISTS trg_staff_number ON admin_users;
CREATE TRIGGER trg_staff_number
  BEFORE INSERT ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION generate_staff_number();

-- ----------------------------------------------------------
-- 4. Backfill existing staff who lack a staff number
-- ----------------------------------------------------------
DO $$
DECLARE
  rec RECORD;
  next_num TEXT;
BEGIN
  FOR rec IN
    SELECT id FROM admin_users
    WHERE staff_number IS NULL OR staff_number = ''
    ORDER BY created_at ASC
  LOOP
    next_num := 'CMG-STAFF-' || LPAD(nextval('staff_number_seq')::TEXT, 4, '0');
    UPDATE admin_users SET staff_number = next_num WHERE id = rec.id;
  END LOOP;
END $$;
