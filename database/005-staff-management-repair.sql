-- ============================================================
-- CodeMtaani Group – Migration 005
-- Critical Staff Management Repair, Schema Resiliency & Mandatory Password Change
-- ============================================================

BEGIN;

-- ----------------------------------------------------------
-- 1. Ensure all profile & security columns exist on admin_users
-- ----------------------------------------------------------
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS staff_number VARCHAR(30);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS department VARCHAR(80);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS provisioning_status TEXT NOT NULL DEFAULT 'active';

-- ----------------------------------------------------------
-- 2. Drop obsolete / conflicting CHECK constraints on admin_users
-- ----------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'admin_users'
      AND con.contype = 'c'
      AND (
        conname LIKE '%role%' 
        OR conname LIKE '%check%' 
        OR conname LIKE '%scope%' 
        OR conname LIKE '%status%'
      )
  ) LOOP
    EXECUTE 'ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- ----------------------------------------------------------
-- 3. Add authoritative role, scope and provisioning constraints
-- ----------------------------------------------------------
ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_role_check
    CHECK (role IN (
      'super_admin',
      'executive_administrator',
      'technical_administrator',
      'department_head',
      'project_manager',
      'staff_member',
      'developer',
      'business_development',
      'marketing_and_communications',
      'research_and_innovation',
      'content_manager',
      'operations',
      'careers',
      'partnerships',
      'viewer'
    ));

ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_scope_check
    CHECK (scope IN ('all', 'enquiry', 'career', 'partnership'));

ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_provisioning_status_check
    CHECK (provisioning_status IN ('active', 'pending_password_change', 'inactive', 'provisioning_failed'));

-- ----------------------------------------------------------
-- 4. Case-insensitive unique email index
-- ----------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email_lower ON admin_users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_staff_number ON admin_users (staff_number) WHERE staff_number IS NOT NULL;

-- ----------------------------------------------------------
-- 5. Concurrency-safe staff number sequence & trigger
-- ----------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS staff_number_seq START WITH 1 INCREMENT BY 1;

-- Synchronize sequence with highest existing staff number to prevent collisions
DO $$
DECLARE
  max_num INT := 0;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(staff_number FROM 11)::INT), 0)
  INTO max_num
  FROM admin_users
  WHERE staff_number ~ '^CMG-STAFF-[0-9]+$';

  IF max_num > 0 THEN
    PERFORM setval('staff_number_seq', max_num);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION generate_staff_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.staff_number IS NULL OR NEW.staff_number = '' THEN
    NEW.staff_number := 'CMG-STAFF-' || LPAD(nextval('staff_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_staff_number ON admin_users;
CREATE TRIGGER trg_staff_number
  BEFORE INSERT ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION generate_staff_number();

-- ----------------------------------------------------------
-- 6. Backfill any staff who lack a staff number
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

COMMIT;
