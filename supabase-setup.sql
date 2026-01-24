-- APQP Application - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor to set up the database

-- 1. Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_task_id ON documents(task_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 4. Create policy to allow all operations (adjust based on your auth requirements)
-- For development/demo: Allow all operations without authentication
CREATE POLICY "Allow all operations on documents" ON documents
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- If you have authentication enabled, use this policy instead:
-- CREATE POLICY "Allow authenticated users" ON documents
--   FOR ALL
--   USING (auth.role() = 'authenticated')
--   WITH CHECK (auth.role() = 'authenticated');

-- Note: After running this SQL, you also need to:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket named "project-files"
-- 3. Set the bucket to "Public" (or configure appropriate policies)
-- 4. This allows file uploads and public URL access
