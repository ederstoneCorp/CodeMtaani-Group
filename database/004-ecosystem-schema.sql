-- CodeMtaani Group – Ecosystem Schema Migration 004
-- Adds:
-- 1. admin_notifications
-- 2. direct_messages, chat_groups, chat_group_members, group_messages
-- 3. internal_announcements, announcement_reads
-- 4. project_tasks, task_comments, project_members
-- 5. public_submissions (with reference sequence & trigger)
-- 6. event_registrations attendance tracking
-- 7. admin_audit_log immutability trigger & security intelligence
-- ----------------------------------------------------------

-- ----------------------------------------------------------
-- 1. admin_notifications – In-system notifications center
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  UUID REFERENCES admin_users(id) ON DELETE CASCADE, -- NULL means broadcast to all admins
  title         VARCHAR(200) NOT NULL,
  message       TEXT NOT NULL,
  category      VARCHAR(50) NOT NULL DEFAULT 'system'
                CHECK (category IN ('application', 'project', 'task', 'enquiry', 'announcement', 'deadline', 'security', 'system')),
  link          VARCHAR(500),
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON admin_notifications(recipient_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_category  ON admin_notifications(category, created_at DESC);

-- ----------------------------------------------------------
-- 2. Internal Communication: Direct Messages
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS direct_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  recipient_id    UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  attachment_url  VARCHAR(500),
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dm_pair ON direct_messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_recipient_unread ON direct_messages(recipient_id, is_read);

-- ----------------------------------------------------------
-- 3. Internal Communication: Department & Group Channels
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_groups (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(120) NOT NULL,
  description         TEXT,
  department          VARCHAR(80),
  is_department_only  BOOLEAN NOT NULL DEFAULT FALSE,
  created_by          UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_group_members (
  group_id    UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID NOT NULL REFERENCES chat_groups(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  attachment_url  VARCHAR(500),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_messages_created ON group_messages(group_id, created_at DESC);

-- ----------------------------------------------------------
-- 4. Internal Communication: Organisational Announcements
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS internal_announcements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(255) NOT NULL,
  content           TEXT NOT NULL,
  priority          VARCHAR(20) NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_department VARCHAR(80), -- NULL means all staff
  attachment_url    VARCHAR(500),
  created_by        UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  published_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcement_reads (
  announcement_id UUID NOT NULL REFERENCES internal_announcements(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_announcements_published ON internal_announcements(published_at DESC);

-- ----------------------------------------------------------
-- 5. Project & Task Management: Members, Tasks, Comments
-- ----------------------------------------------------------
-- Project team membership
CREATE TABLE IF NOT EXISTS project_members (
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  role        VARCHAR(40) NOT NULL DEFAULT 'contributor'
              CHECK (role IN ('manager', 'lead', 'contributor', 'reviewer')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- Expand projects with priority and dates if not present
ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium'
  CHECK (priority IN ('low', 'medium', 'high', 'critical'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completion_percentage INT DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;

-- Tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title                 VARCHAR(255) NOT NULL,
  description           TEXT,
  assignee_id           UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  stage                 VARCHAR(40) NOT NULL DEFAULT 'todo'
                        CHECK (stage IN ('backlog', 'todo', 'in_progress', 'review', 'completed')),
  priority              VARCHAR(20) NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  deadline              TIMESTAMPTZ,
  attachment_url        VARCHAR(500),
  completion_percentage INT NOT NULL DEFAULT 0,
  completed_at          TIMESTAMPTZ,
  created_by            UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_stage ON project_tasks(project_id, stage);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee      ON project_tasks(assignee_id, stage);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline      ON project_tasks(deadline);

-- Task comments
CREATE TABLE IF NOT EXISTS task_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  comment     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments ON task_comments(task_id, created_at ASC);

-- ----------------------------------------------------------
-- 6. Public Innovation & Community Portal: Submissions & Tracking
-- ----------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public_sub_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public_submissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number      VARCHAR(40) UNIQUE NOT NULL,
  submission_type       VARCHAR(60) NOT NULL DEFAULT 'idea'
                        CHECK (submission_type IN ('idea', 'proposal', 'partnership', 'community', 'suggestion')),
  title                 VARCHAR(255) NOT NULL,
  submitter_name        VARCHAR(120) NOT NULL,
  submitter_email       VARCHAR(180) NOT NULL,
  organisation          VARCHAR(160),
  description           TEXT NOT NULL,
  attachment_url        VARCHAR(500),
  status                VARCHAR(50) NOT NULL DEFAULT 'submitted'
                        CHECK (status IN ('submitted', 'under_review', 'info_required', 'approved', 'rejected', 'in_development', 'completed')),
  applicant_feedback    TEXT,      -- Public-facing communication to applicant
  internal_notes        TEXT,      -- Strict confidential internal administrator notes
  assigned_to           UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_public_sub_ref    ON public_submissions(reference_number);
CREATE INDEX IF NOT EXISTS idx_public_sub_status ON public_submissions(status);
CREATE INDEX IF NOT EXISTS idx_public_sub_email  ON public_submissions(submitter_email);
CREATE INDEX IF NOT EXISTS idx_public_sub_date   ON public_submissions(created_at DESC);

-- Trigger to auto-generate unique reference number: CMG-SUB-YYYY-XXXX
CREATE OR REPLACE FUNCTION generate_submission_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_number IS NULL OR NEW.reference_number = '' THEN
    NEW.reference_number := 'CMG-SUB-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('public_sub_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_public_sub_ref ON public_submissions;
CREATE TRIGGER trg_public_sub_ref
  BEFORE INSERT ON public_submissions
  FOR EACH ROW
  EXECUTE FUNCTION generate_submission_reference();

-- ----------------------------------------------------------
-- 7. Events: Attendance and Registration Status
-- ----------------------------------------------------------
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'registered'
  CHECK (status IN ('registered', 'confirmed', 'attended', 'cancelled'));
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS reference_code VARCHAR(40);
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- ----------------------------------------------------------
-- 8. Advanced Audit Trail: Immutability and Security
-- ----------------------------------------------------------
-- Add staff_number and IP tracking to admin_audit_log if not already there
ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS staff_number VARCHAR(30);
ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50);
ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS previous_state JSONB;
ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS new_state JSONB;

-- Immutability trigger: prevent direct UPDATE or DELETE on audit logs
CREATE OR REPLACE FUNCTION protect_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit records are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_audit_log ON admin_audit_log;
CREATE TRIGGER trg_protect_audit_log
  BEFORE UPDATE OR DELETE ON admin_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION protect_audit_log();
