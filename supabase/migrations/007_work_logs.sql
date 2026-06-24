CREATE TABLE work_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'maintenance', 'consulting')),
  billable BOOLEAN NOT NULL DEFAULT true,
  hourly_rate NUMERIC,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own work logs"
  ON work_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own work logs"
  ON work_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work logs"
  ON work_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work logs"
  ON work_logs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_work_logs_project ON work_logs(project_id);
CREATE INDEX idx_work_logs_user ON work_logs(user_id);
CREATE INDEX idx_work_logs_date ON work_logs(entry_date);

CREATE OR REPLACE FUNCTION update_work_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_work_log_updated_at
  BEFORE UPDATE ON work_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_work_log_updated_at();
