import { query } from "./db";

let _masterSynced = false;

/**
 * Master Schema Synchronizer for CodeMtaani Group.
 * Self-healing and idempotent: automatically ensures that all tables, columns,
 * sequences, triggers, and constraints across the entire organizational ecosystem exist.
 */
export async function ensureMasterSchema(force = false): Promise<void> {
  if (_masterSynced && !force) return;

  try {
    // 1. EXTENSIONS
    await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    // 2. ADMIN USERS & PROFILE COLUMNS
    await query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(180) NOT NULL UNIQUE,
        full_name VARCHAR(120) NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'developer',
        scope TEXT NOT NULL DEFAULT 'all',
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMPTZ
      );

      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS staff_number VARCHAR(30);
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS department VARCHAR(80);
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS position VARCHAR(100);
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS provisioning_status TEXT NOT NULL DEFAULT 'active';
    `);

    // 3. DROP LEGACY RESTRICTIVE CONSTRAINTS ON admin_users
    await query(`
      ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_check;
      ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_check1;
      ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_check2;
      ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
      ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_scope_check;
      ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS chk_admin_role;

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
            AND (conname LIKE '%role%' OR conname LIKE '%check%' OR conname LIKE '%scope%')
        ) LOOP
          EXECUTE 'ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        END LOOP;
      END $$;
    `);

    // 4. MODERN ROLE & SCOPE CHECK CONSTRAINTS
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

    // 5. STAFF NUMBER SEQUENCE & TRIGGER
    await query(`
      CREATE SEQUENCE IF NOT EXISTS staff_number_seq START WITH 1 INCREMENT BY 1;

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
    `);

    // 6. PROJECTS & PROJECT MEMBERS
    await query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        slug VARCHAR(200) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        problem_statement TEXT,
        solution_overview TEXT,
        category VARCHAR(80),
        technologies TEXT[] DEFAULT '{}',
        status VARCHAR(40) DEFAULT 'in_development',
        github_url VARCHAR(500),
        demo_url VARCHAR(500),
        image_url VARCHAR(500),
        featured BOOLEAN DEFAULT FALSE,
        contributors TEXT[] DEFAULT '{}',
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE projects ADD COLUMN IF NOT EXISTS completion_percentage INT DEFAULT 0;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS due_date DATE;
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;

      CREATE TABLE IF NOT EXISTS project_members (
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        role VARCHAR(60) DEFAULT 'contributor',
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (project_id, user_id)
      );
    `);

    // 7. PROJECT TASKS & TASK COMMENTS
    await query(`
      CREATE TABLE IF NOT EXISTS project_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title VARCHAR(250) NOT NULL,
        description TEXT,
        assignee_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        stage VARCHAR(30) NOT NULL DEFAULT 'todo'
          CHECK (stage IN ('backlog', 'todo', 'in_progress', 'review', 'completed')),
        priority VARCHAR(20) NOT NULL DEFAULT 'medium'
          CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        deadline DATE,
        attachment_url VARCHAR(500),
        completion_percentage INT NOT NULL DEFAULT 0,
        completed_at TIMESTAMPTZ,
        created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_project_tasks_proj ON project_tasks (project_id);
      CREATE INDEX IF NOT EXISTS idx_project_tasks_stage ON project_tasks (stage);
      CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee ON project_tasks (assignee_id);

      CREATE TABLE IF NOT EXISTS task_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        comment TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments (task_id, created_at ASC);
    `);

    // 8. INTERNAL DIRECT MESSAGING & GROUP CHANNELS
    await query(`
      CREATE TABLE IF NOT EXISTS direct_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        recipient_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        attachment_url VARCHAR(500),
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

      CREATE INDEX IF NOT EXISTS idx_direct_messages_participants ON direct_messages (sender_id, recipient_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient_unread ON direct_messages (recipient_id, is_read) WHERE is_read = FALSE;

      CREATE TABLE IF NOT EXISTS chat_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(120) NOT NULL,
        description TEXT,
        department VARCHAR(80),
        created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS chat_group_members (
        group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (group_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS group_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        attachment_url VARCHAR(500),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages (group_id, created_at DESC);
    `);

    // 9. INTERNAL BULLETINS & ANNOUNCEMENTS
    await query(`
      CREATE TABLE IF NOT EXISTS internal_announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(250) NOT NULL,
        content TEXT NOT NULL,
        priority VARCHAR(20) NOT NULL DEFAULT 'normal'
          CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        target_department VARCHAR(80),
        target_role VARCHAR(60),
        author_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        attachment_url VARCHAR(500),
        image_url VARCHAR(500),
        published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE internal_announcements ADD COLUMN IF NOT EXISTS target_role VARCHAR(60);
      ALTER TABLE internal_announcements ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

      CREATE INDEX IF NOT EXISTS idx_announcements_published ON internal_announcements (published_at DESC);

      CREATE TABLE IF NOT EXISTS announcement_reads (
        announcement_id UUID NOT NULL REFERENCES internal_announcements(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
        read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (announcement_id, user_id)
      );
    `);

    // 10. NOTIFICATIONS
    await query(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        category VARCHAR(40) NOT NULL DEFAULT 'system',
        link VARCHAR(300),
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

      CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON admin_notifications (recipient_id, is_read, created_at DESC);
    `);

    // 11. PUBLIC SUBMISSIONS & SEQUENCE
    await query(`
      CREATE SEQUENCE IF NOT EXISTS public_sub_seq START WITH 1 INCREMENT BY 1;

      CREATE TABLE IF NOT EXISTS public_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reference_number VARCHAR(40) UNIQUE,
        type VARCHAR(40) NOT NULL
          CHECK (type IN ('idea', 'proposal', 'partnership', 'community', 'suggestion')),
        full_name VARCHAR(120) NOT NULL,
        email VARCHAR(180) NOT NULL,
        organisation VARCHAR(160),
        title VARCHAR(250) NOT NULL,
        summary TEXT NOT NULL,
        detailed_proposal TEXT,
        supporting_link VARCHAR(500),
        status VARCHAR(40) NOT NULL DEFAULT 'submitted'
          CHECK (status IN ('submitted', 'under_review', 'info_required', 'approved', 'rejected', 'in_development', 'completed')),
        applicant_feedback TEXT,
        internal_notes TEXT,
        assigned_to UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_public_sub_ref ON public_submissions (reference_number);
      CREATE INDEX IF NOT EXISTS idx_public_sub_status ON public_submissions (status);
      CREATE INDEX IF NOT EXISTS idx_public_sub_created ON public_submissions (created_at DESC);

      CREATE OR REPLACE FUNCTION generate_submission_reference()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
          NEW.reference_number := 'CMG-SUB-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('public_sub_seq')::TEXT, 4, '0');
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_submission_reference ON public_submissions;
      CREATE TRIGGER trg_submission_reference
        BEFORE INSERT ON public_submissions
        FOR EACH ROW
        EXECUTE FUNCTION generate_submission_reference();
    `);

    // 12. MEDIA ASSETS
    await query(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size_bytes INT NOT NULL,
        data BYTEA NOT NULL,
        alt_text VARCHAR(300),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets (created_at DESC);
    `);

    // 13. EVENTS & EVENT REGISTRATIONS
    await query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        slug VARCHAR(200) NOT NULL UNIQUE,
        event_type VARCHAR(60) DEFAULT 'meetup',
        description TEXT NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ,
        location VARCHAR(200),
        is_virtual BOOLEAN DEFAULT FALSE,
        meeting_link VARCHAR(500),
        capacity INT,
        status VARCHAR(40) DEFAULT 'upcoming',
        image_url VARCHAR(500),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS event_registrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        full_name VARCHAR(120) NOT NULL,
        email VARCHAR(180) NOT NULL,
        phone VARCHAR(50),
        reference_code VARCHAR(40),
        status VARCHAR(30) DEFAULT 'registered',
        checked_in_at TIMESTAMPTZ,
        registered_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(event_id, email)
      );

      ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS reference_code VARCHAR(40);
      ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'registered';
      ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
    `);

    // 14. ARTICLES
    await query(`
      CREATE TABLE IF NOT EXISTS articles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(300) NOT NULL,
        slug VARCHAR(300) NOT NULL UNIQUE,
        excerpt TEXT,
        content TEXT NOT NULL,
        category VARCHAR(80) DEFAULT 'general',
        tags TEXT[] DEFAULT '{}',
        status VARCHAR(40) DEFAULT 'draft',
        cover_image VARCHAR(500),
        author_name VARCHAR(120),
        author_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        published_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 15. AUDIT LOG & IMMUTABILITY TRIGGER
    await query(`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id BIGSERIAL PRIMARY KEY,
        actor_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
        actor_email VARCHAR(180) NOT NULL,
        action VARCHAR(80) NOT NULL,
        target_type VARCHAR(40),
        target_id TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        staff_number VARCHAR(30),
        previous_state JSONB,
        new_state JSONB,
        ip_address VARCHAR(64),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log (created_at DESC);

      CREATE OR REPLACE FUNCTION protect_audit_log()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'admin_audit_log records are immutable and cannot be modified or deleted.';
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trg_protect_audit_log ON admin_audit_log;
      CREATE TRIGGER trg_protect_audit_log
        BEFORE UPDATE OR DELETE ON admin_audit_log
        FOR EACH ROW
        EXECUTE FUNCTION protect_audit_log();
    `);

    _masterSynced = true;
  } catch (error) {
    console.warn("Master schema synchronization notice:", error);
  }
}
