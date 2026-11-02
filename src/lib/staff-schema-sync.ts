import { query } from "./db";

let _synced = false;

/**
 * Ensures all staff management columns, constraints, and sequences exist in PostgreSQL.
 * Self-healing and idempotent: runs automatically on staff operations.
 */
export async function ensureStaffSchema(): Promise<void> {
  if (_synced) return;

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

    // 2. Ensure sequence exists
    await query(`CREATE SEQUENCE IF NOT EXISTS staff_number_seq START WITH 1 INCREMENT BY 1;`);

    // 3. Ensure trigger function exists
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

    // 4. Ensure trigger is attached
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
    // Don't throw so queries can still attempt execution
  }
}
