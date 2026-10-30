-- CodeMtaani Group website submission storage.
-- Apply this file to the PostgreSQL database configured as DATABASE_URL.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('enquiry', 'career', 'partnership')),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(180) NOT NULL,
  organisation VARCHAR(160),
  category VARCHAR(120),
  subject VARCHAR(160),
  area VARCHAR(120),
  link VARCHAR(500),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'responded', 'closed', 'rejected')),
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS submissions_created_at_idx ON submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS submissions_type_status_idx ON submissions (type, status);
CREATE INDEX IF NOT EXISTS submissions_email_idx ON submissions (email);
