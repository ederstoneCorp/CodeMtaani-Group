-- CodeMtaani Group staff access foundation.
-- Apply after database/schema.sql. Existing environment-based super-admin login remains valid.
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(180) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin','operations','business_development','careers','partnerships','viewer')),
  scope TEXT NOT NULL DEFAULT 'all' CHECK (scope IN ('all','enquiry','career','partnership')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  CHECK (
    (role IN ('super_admin','operations') AND scope='all') OR
    (role='business_development' AND scope='enquiry') OR
    (role='careers' AND scope='career') OR
    (role='partnerships' AND scope='partnership') OR role='viewer'
  )
);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'all';
CREATE INDEX IF NOT EXISTS admin_users_role_active_idx ON admin_users (role, active);
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  actor_email VARCHAR(180) NOT NULL,
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(40),
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx ON admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_actor_idx ON admin_audit_log (actor_id, created_at DESC);
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id BIGSERIAL PRIMARY KEY,
  email_key CHAR(64) NOT NULL,
  ip_key CHAR(64) NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  succeeded BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS admin_login_attempts_lookup_idx ON admin_login_attempts (email_key, ip_key, attempted_at DESC);
CREATE INDEX IF NOT EXISTS admin_login_attempts_cleanup_idx ON admin_login_attempts (attempted_at);
