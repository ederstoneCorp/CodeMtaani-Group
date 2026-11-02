-- ============================================================
-- CodeMtaani Group – Platform Schema Extension
-- Migration: 002-platform-schema.sql
-- Extends the base schema (schema.sql + staff-access.sql)
-- DO NOT recreate: submissions, admin_users, admin_audit_log, admin_login_attempts
-- ============================================================

BEGIN;

-- ----------------------------------------------------------
-- 1. team_members – Internal team / staff profiles shown on the public site
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     VARCHAR(120)  NOT NULL,
  role_title    VARCHAR(120)  NOT NULL,
  department    VARCHAR(80),
  bio           TEXT,
  avatar_url    VARCHAR(500),
  skills        TEXT[]        DEFAULT '{}',
  social_links  JSONB         DEFAULT '{}',
  display_order INT           DEFAULT 0,
  is_active     BOOLEAN       DEFAULT TRUE,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

COMMENT ON TABLE team_members IS 'Internal team / staff profiles displayed on the public About page.';

-- ----------------------------------------------------------
-- 2. projects – Showcased projects / products built by CodeMtaani
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(200)  NOT NULL,
  slug              VARCHAR(200)  NOT NULL UNIQUE,
  description       TEXT          NOT NULL,
  problem_statement TEXT,
  solution_overview TEXT,
  category          VARCHAR(80),
  technologies      TEXT[]        DEFAULT '{}',
  status            VARCHAR(40)   DEFAULT 'concept'
                      CHECK (status IN ('concept','in_development','beta','released','archived')),
  github_url        VARCHAR(500),
  demo_url          VARCHAR(500),
  image_url         VARCHAR(500),
  featured          BOOLEAN       DEFAULT FALSE,
  contributors      TEXT[]        DEFAULT '{}',
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   DEFAULT NOW()
);

COMMENT ON TABLE projects IS 'Showcased projects and products built or incubated by CodeMtaani Group.';

-- ----------------------------------------------------------
-- 3. members – Community membership registry
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               VARCHAR(180)  NOT NULL UNIQUE,
  full_name           VARCHAR(120)  NOT NULL,
  category            VARCHAR(60)   DEFAULT 'community'
                        CHECK (category IN ('student','developer','creative','researcher','community','collaborator')),
  institution_or_org  VARCHAR(160),
  skills              TEXT[]        DEFAULT '{}',
  interests           TEXT[]        DEFAULT '{}',
  bio                 TEXT,
  github_handle       VARCHAR(80),
  linkedin_url        VARCHAR(300),
  status              VARCHAR(40)   DEFAULT 'pending'
                        CHECK (status IN ('pending','active','inactive','suspended')),
  registered_at       TIMESTAMPTZ   DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   DEFAULT NOW()
);

COMMENT ON TABLE members IS 'Community membership registry – people who join the CodeMtaani network.';

-- ----------------------------------------------------------
-- 4. articles – Blog / news articles
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS articles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(300)  NOT NULL,
  slug          VARCHAR(300)  NOT NULL UNIQUE,
  excerpt       TEXT,
  content       TEXT          NOT NULL,
  category      VARCHAR(80)   DEFAULT 'general',
  tags          TEXT[]        DEFAULT '{}',
  status        VARCHAR(40)   DEFAULT 'draft'
                  CHECK (status IN ('draft','review','published','archived')),
  cover_image   VARCHAR(500),
  author_name   VARCHAR(120),
  author_id     UUID          REFERENCES admin_users(id) ON DELETE SET NULL,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

COMMENT ON TABLE articles IS 'Blog and news articles published on the CodeMtaani platform.';

-- ----------------------------------------------------------
-- 5. events – Workshops, hackathons, meetups, etc.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(200)  NOT NULL,
  slug          VARCHAR(200)  NOT NULL UNIQUE,
  event_type    VARCHAR(60)   DEFAULT 'meetup'
                  CHECK (event_type IN ('workshop','hackathon','training','meetup','conference','webinar')),
  description   TEXT          NOT NULL,
  start_time    TIMESTAMPTZ   NOT NULL,
  end_time      TIMESTAMPTZ,
  location      VARCHAR(200),
  is_virtual    BOOLEAN       DEFAULT FALSE,
  meeting_link  VARCHAR(500),
  capacity      INT,
  status        VARCHAR(40)   DEFAULT 'upcoming'
                  CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

COMMENT ON TABLE events IS 'Community events – workshops, hackathons, meetups, webinars, etc.';

-- ----------------------------------------------------------
-- 6. event_registrations – RSVPs for events
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_registrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID          NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name     VARCHAR(120)  NOT NULL,
  email         VARCHAR(180)  NOT NULL,
  registered_at TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE(event_id, email)
);

COMMENT ON TABLE event_registrations IS 'Registration entries linking attendees to events.';

-- ----------------------------------------------------------
-- 7. research_initiatives – Research projects & papers
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS research_initiatives (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(200)  NOT NULL,
  slug              VARCHAR(200)  NOT NULL UNIQUE,
  area              VARCHAR(80),
  stage             VARCHAR(40)   DEFAULT 'proposed'
                      CHECK (stage IN ('proposed','active','completed','paused')),
  objective         TEXT          NOT NULL,
  findings_summary  TEXT,
  publication_url   VARCHAR(500),
  status            VARCHAR(40)   DEFAULT 'draft'
                      CHECK (status IN ('draft','published','archived')),
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   DEFAULT NOW()
);

COMMENT ON TABLE research_initiatives IS 'Research initiatives and innovation projects tracked by CodeMtaani.';

-- ----------------------------------------------------------
-- 8. docs_articles – Internal / public documentation pages
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS docs_articles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(300)  NOT NULL,
  slug        VARCHAR(300)  NOT NULL UNIQUE,
  section     VARCHAR(80)   DEFAULT 'general',
  content     TEXT          NOT NULL,
  sort_order  INT           DEFAULT 0,
  published   BOOLEAN       DEFAULT FALSE,
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   DEFAULT NOW()
);

COMMENT ON TABLE docs_articles IS 'Documentation and knowledge-base articles for the platform.';

-- ----------------------------------------------------------
-- 9. org_settings – Key-value configuration store
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_settings (
  key         VARCHAR(100)  PRIMARY KEY,
  value       JSONB         NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ   DEFAULT NOW()
);

COMMENT ON TABLE org_settings IS 'Organisation-wide settings stored as key → JSONB pairs.';

-- ----------------------------------------------------------
-- ALTER admin_users: expand role CHECK constraint
-- ----------------------------------------------------------
-- Drop the existing constraint and recreate with expanded roles.
DO $$
BEGIN
  -- Attempt to drop the old constraint (name may vary; try common names)
  ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
  ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS chk_admin_role;

  -- Add the expanded constraint
  ALTER TABLE admin_users
    ADD CONSTRAINT admin_users_role_check
      CHECK (role IN (
        'super_admin',
        'executive_admin',
        'technical_admin',
        'developer',
        'business_development',
        'marketing_communications',
        'research_innovation',
        'content_manager',
        'viewer'
      ));
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not alter admin_users role constraint: %', SQLERRM;
END $$;

-- ----------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------

-- Slug indexes (unique already creates an index, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_projects_slug              ON projects            (slug);
CREATE INDEX IF NOT EXISTS idx_articles_slug              ON articles            (slug);
CREATE INDEX IF NOT EXISTS idx_events_slug                ON events              (slug);
CREATE INDEX IF NOT EXISTS idx_research_initiatives_slug  ON research_initiatives(slug);
CREATE INDEX IF NOT EXISTS idx_docs_articles_slug         ON docs_articles       (slug);

-- Status indexes
CREATE INDEX IF NOT EXISTS idx_projects_status            ON projects            (status);
CREATE INDEX IF NOT EXISTS idx_members_status             ON members             (status);
CREATE INDEX IF NOT EXISTS idx_articles_status            ON articles            (status);
CREATE INDEX IF NOT EXISTS idx_events_status              ON events              (status);
CREATE INDEX IF NOT EXISTS idx_research_initiatives_stage ON research_initiatives(stage);

-- created_at DESC indexes (for listing / pagination)
CREATE INDEX IF NOT EXISTS idx_projects_created           ON projects            (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_members_registered         ON members             (registered_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_created           ON articles            (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_created             ON events              (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_initiatives_created ON research_initiatives(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_docs_articles_created      ON docs_articles       (created_at DESC);

-- Email indexes
CREATE INDEX IF NOT EXISTS idx_members_email              ON members             (email);
CREATE INDEX IF NOT EXISTS idx_event_registrations_email  ON event_registrations (email);

-- Featured flag on projects
CREATE INDEX IF NOT EXISTS idx_projects_featured          ON projects            (featured) WHERE featured = TRUE;

-- ----------------------------------------------------------
-- DEFAULT ORG SETTINGS
-- ----------------------------------------------------------
INSERT INTO org_settings (key, value) VALUES
  ('site_name',    '{"value": "CodeMtaani Group"}'::jsonb),
  ('site_slogan',  '{"value": "Think. Build. Transform."}'::jsonb),
  ('contact_email','{"value": "hello@codemtaani.com"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

COMMIT;
