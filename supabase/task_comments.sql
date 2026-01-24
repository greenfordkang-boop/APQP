-- 담당자 의견(코멘트) 테이블 및 관리자 뷰
-- schema.sql에 이미 포함되어 있으면 실행 불필요. 기존 DB에만 추가할 때 SQL Editor에서 실행.

-- 테이블
CREATE TABLE IF NOT EXISTS task_comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on task_comments" ON task_comments
  FOR ALL USING (true) WITH CHECK (true);

-- 관리자 목록 뷰: 상위프로젝트 > 하위메뉴 > 코멘트 > 등록일자 > 등록자
CREATE OR REPLACE VIEW comment_list_admin AS
SELECT
  tc.id, tc.task_id, tc.content, tc.author, tc.created_at,
  t.name AS task_name, t.phase,
  p.name AS project_name
FROM task_comments tc
JOIN tasks t ON t.id = tc.task_id
JOIN projects p ON p.id = t.project_id;
