-- Migration 005: Classificazione progetti (tipo, fase, monetizzazione)

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_type VARCHAR(20) DEFAULT 'webapp'
    CHECK (project_type IN ('webapp', 'website', 'mobile', 'saas', 'tool')),
  ADD COLUMN IF NOT EXISTS stage VARCHAR(20) DEFAULT 'idea'
    CHECK (stage IN ('idea', 'building', 'mvp', 'live', 'paused', 'archived')),
  ADD COLUMN IF NOT EXISTS monetization VARCHAR(20) DEFAULT 'experimental'
    CHECK (monetization IN ('free', 'paid', 'freemium', 'experimental'));
