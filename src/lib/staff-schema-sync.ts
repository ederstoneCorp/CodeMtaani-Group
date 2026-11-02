import { query } from "./db";

let _synced = false;

/**
 * Ensures all staff management columns, constraints, and sequences exist in PostgreSQL.
 * Self-healing and idempotent: drops legacy restrictive CHECK constraints and establishes
 * modern role and scope permissions.
 */
export async function ensureStaffSchema(force = false): Promise<void> {
  if (_synced && !force) return;

  try {
    // 1. Add all required profile & security columns if not present
    await query(`
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS staff_number VARCHAR(30);
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS department VARCHAR(80);
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS position VARCHAR(100);
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS provisioning_status TEXT NOT NULL DEFAULT 'active';
    `);

    // 2. Drop legacy / conflicting CHECK constraints by known names
    await query(`
      ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_check;
      ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_check1;
      ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_check2;
      ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_check3;
      ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
      ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_scope_check;
      ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_provisioning_status_check;
      ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS chk_admin_role;
    `);

    // 3. Dynamically scan and drop any remaining anonymous check constraints that inspect role/scope
    await query(`
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
    `);

    // 4. Add authoritative modern role and scope check constraints
    await query(`
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
    `);

    // 5. Ensure sequence exists and is synchronized to highest existing staff number
    await query(`CREATE SEQUENCE IF NOT EXISTS staff_number_seq START WITH 1 INCREMENT BY 1;`);

    await query(`
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
    `);

    // 6. Ensure trigger function exists
    await query(`
      CREATE OR REPLACE FUNCTION generate_staff_number()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.staff_number IS NULL OR NEW.staff_number = '' THEN
          NEW.staff_number := 'CMG-STAFF-' || LPAD(nextval('staff_number_seq')::TEXT, 4, '0');
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 7. Ensure trigger is attached
    await query(`
      DROP TRIGGER IF EXISTS trg_staff_number ON admin_users;
      CREATE TRIGGER trg_staff_number
        BEFORE INSERT ON admin_users
        FOR EACH ROW
        EXECUTE FUNCTION generate_staff_number();
    `);

    _synced = true;
  } catch (error) {
    console.warn("Staff schema synchronization notice:", error);
  }
}
