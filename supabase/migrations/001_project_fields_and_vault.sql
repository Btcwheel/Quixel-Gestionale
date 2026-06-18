-- Migration 001: Aggiunte colonne progetti + credential_vault

-- Nuove colonne su projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  ADD COLUMN IF NOT EXISTS is_stuck BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS next_action TEXT,
  ADD COLUMN IF NOT EXISTS is_personal BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Credential vault: credenziali cifrate per progetto
CREATE TABLE IF NOT EXISTS credential_vault (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  provider VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  login_email VARCHAR(255),
  username VARCHAR(255),
  encrypted_secret TEXT NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE credential_vault ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Allow all actions for authenticated users" ON credential_vault FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
