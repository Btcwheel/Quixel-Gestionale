-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  description TEXT,
  website VARCHAR(500),
  notes TEXT,
  tags JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'planning',
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  budget NUMERIC,
  tags JSONB,
  metadata JSONB,
  last_sync_at TIMESTAMPTZ,
  github_activity_score NUMERIC DEFAULT 0.0,
  vercel_deploy_count INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_stuck BOOLEAN DEFAULT FALSE,
  next_action TEXT,
  is_personal BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2b. Credential Vault
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

-- 3. External Accounts (GitHub, Vercel, etc.)
CREATE TABLE IF NOT EXISTS external_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  external_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL,
  owner VARCHAR(255),
  branch VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  username VARCHAR(255),
  notes TEXT,
  github_full_name VARCHAR(255),
  supabase_region VARCHAR(50),
  vercel_target VARCHAR(50),
  aws_region VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(external_id, provider)
);

-- 4. AI Accounts
CREATE TABLE IF NOT EXISTS ai_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  total_credits NUMERIC DEFAULT 0.0,
  used_credits NUMERIC DEFAULT 0.0,
  remaining_credits NUMERIC DEFAULT 0.0,
  credit_limit_daily NUMERIC,
  credits_reset_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  is_rate_limited BOOLEAN DEFAULT FALSE,
  rate_limit_until TIMESTAMPTZ,
  priority INTEGER DEFAULT 0,
  max_concurrent_requests INTEGER DEFAULT 5,
  current_concurrent_requests INTEGER DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  total_tokens_in INTEGER DEFAULT 0,
  total_tokens_out INTEGER DEFAULT 0,
  avg_response_time_ms NUMERIC,
  last_used_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Project AI Pool Assignments
CREATE TABLE IF NOT EXISTS project_ai_pool_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  ai_account_id UUID REFERENCES ai_accounts(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, ai_account_id)
);

-- 6. Alerts
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_ai_pool_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_vault ENABLE ROW LEVEL SECURITY;

-- Create default permissive policies for development
CREATE POLICY "Allow all actions for authenticated users" ON clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for authenticated users" ON projects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for authenticated users" ON external_accounts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for authenticated users" ON ai_accounts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for authenticated users" ON project_ai_pool_assignments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for authenticated users" ON alerts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all actions for authenticated users" ON credential_vault FOR ALL USING (auth.role() = 'authenticated');
