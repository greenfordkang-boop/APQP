-- APQP e-Development Plan Database Schema
-- IATF 16949 Compliant Project Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Projects Table
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  part_no TEXT,
  client TEXT NOT NULL,
  manager TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT CHECK (status IN ('Planning', 'In Progress', 'On Hold', 'Completed')) DEFAULT 'Planning',
  progress INTEGER CHECK (progress >= 0 AND progress <= 100) DEFAULT 0,
  milestones JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_projects_client ON projects(client);
CREATE INDEX idx_projects_status ON projects(status);

-- ============================================
-- Tasks Table
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phase TEXT,
  plan_start DATE,
  plan_end DATE,
  actual_start DATE,
  actual_end DATE,
  status TEXT CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Delayed')) DEFAULT 'Pending',
  assignee TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_phase ON tasks(phase);

-- ============================================
-- Documents Table
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_documents_task_id ON documents(task_id);

-- ============================================
-- FMEA Data Table
-- ============================================
CREATE TABLE IF NOT EXISTS fmea_data (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  revisions JSONB DEFAULT '[]',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_fmea_task_id ON fmea_data(task_id);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fmea_updated_at BEFORE UPDATE ON fmea_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Setup
-- ============================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fmea_data ENABLE ROW LEVEL SECURITY;

-- For development: Allow all operations (MODIFY FOR PRODUCTION!)
-- In production, you should implement proper authentication-based policies

CREATE POLICY "Allow all operations on projects" ON projects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on documents" ON documents
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on fmea_data" ON fmea_data
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Insert sample project
INSERT INTO projects (name, part_no, client, manager, start_date, end_date, status, progress, milestones)
VALUES (
  'JG 팝업모니터 & REAR COVER ASSY',
  'ACQ30063301',
  '신성오토텍(주)',
  '김민수 PM',
  '2025-03-01',
  '2026-12-31',
  'In Progress',
  35,
  '[
    {"name": "T/OF (Tool Off)", "date": "2025-07-15", "color": "bg-blue-500"},
    {"name": "P1 (Pilot 1)", "date": "2025-11-15", "color": "bg-indigo-500"},
    {"name": "P2 (Pilot 2)", "date": "2026-03-15", "color": "bg-purple-500"},
    {"name": "선행양산", "date": "2026-06-15", "color": "bg-cyan-500"},
    {"name": "M (SOP)", "date": "2026-07-15", "color": "bg-slate-700"},
    {"name": "북미수출", "date": "2026-12-01", "color": "bg-orange-500"}
  ]'::jsonb
) ON CONFLICT DO NOTHING;

-- ============================================
-- Storage Bucket Setup (Execute in Supabase Dashboard)
-- ============================================

-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket named: project-files
-- 3. Set it to PUBLIC for simplicity (or implement proper access policies)
-- 4. Allowed MIME types:
--    - application/pdf
--    - image/jpeg, image/png, image/gif, image/webp
--    - text/csv, text/plain
--    - application/vnd.ms-excel
--    - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
-- 5. Max file size: 10MB

-- ============================================
-- Views for Analytics (Optional)
-- ============================================

-- Delayed tasks view
CREATE OR REPLACE VIEW delayed_tasks_view AS
SELECT
  t.*,
  p.name as project_name,
  p.client,
  EXTRACT(DAY FROM (t.actual_end::timestamp - t.plan_end::timestamp)) as delay_days
FROM tasks t
JOIN projects p ON t.project_id = p.id
WHERE t.status = 'Delayed'
  OR (t.actual_end IS NOT NULL AND t.actual_end > t.plan_end);

-- Project progress summary
CREATE OR REPLACE VIEW project_progress_view AS
SELECT
  p.id,
  p.name,
  p.client,
  p.status,
  p.progress,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'Completed' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN t.status = 'Delayed' THEN 1 END) as delayed_tasks,
  COUNT(CASE WHEN t.status = 'In Progress' THEN 1 END) as in_progress_tasks
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY p.id, p.name, p.client, p.status, p.progress;

-- ============================================
-- Functions for Business Logic
-- ============================================

-- Function to calculate task status based on dates
CREATE OR REPLACE FUNCTION calculate_task_status(
  p_plan_start DATE,
  p_plan_end DATE,
  p_actual_start DATE,
  p_actual_end DATE
) RETURNS TEXT AS $$
BEGIN
  IF p_actual_end IS NOT NULL THEN
    IF p_actual_end > p_plan_end THEN
      RETURN 'Delayed';
    ELSE
      RETURN 'Completed';
    END IF;
  ELSIF p_actual_start IS NOT NULL THEN
    RETURN 'In Progress';
  ELSE
    RETURN 'Pending';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Cleanup and Maintenance
-- ============================================

-- Function to clean up old revisions in FMEA data (keep last 10)
CREATE OR REPLACE FUNCTION cleanup_old_fmea_revisions() RETURNS void AS $$
DECLARE
  fmea_record RECORD;
  cleaned_revisions JSONB;
BEGIN
  FOR fmea_record IN SELECT id, revisions FROM fmea_data LOOP
    IF jsonb_array_length(fmea_record.revisions) > 10 THEN
      -- Keep only the last 10 revisions
      cleaned_revisions := (
        SELECT jsonb_agg(elem)
        FROM (
          SELECT elem
          FROM jsonb_array_elements(fmea_record.revisions) elem
          ORDER BY (elem->>'timestamp')::timestamptz DESC
          LIMIT 10
        ) sub
      );

      UPDATE fmea_data
      SET revisions = cleaned_revisions
      WHERE id = fmea_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Grant Permissions (For service role)
-- ============================================

-- These are automatically handled by Supabase for the anon/authenticated roles
-- No additional GRANT statements needed for basic setup

-- ============================================
-- Notes for Production Deployment
-- ============================================

-- TODO: Implement proper RLS policies based on user authentication
-- TODO: Add audit logging table for tracking changes
-- TODO: Implement data retention policies
-- TODO: Add indexes for frequently queried columns
-- TODO: Set up regular backups
-- TODO: Configure Storage bucket with proper access policies
-- TODO: Implement rate limiting on API endpoints
