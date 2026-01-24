# Supabase 설정 가이드

파일 업로드 기능을 사용하려면 Supabase를 올바르게 설정해야 합니다.

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 로그인
2. "New Project" 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호 설정
4. 리전 선택 (Asia Pacific - Seoul 권장)

## 2. 환경 변수 설정

Vercel Dashboard에서 환경 변수를 설정하세요:

1. Vercel 프로젝트 > Settings > Environment Variables
2. 다음 변수들을 추가:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**값을 찾는 방법:**
- Supabase Dashboard > Project Settings > API
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` key → `VITE_SUPABASE_ANON_KEY`

## 3. 데이터베이스 테이블 생성

1. Supabase Dashboard > SQL Editor
2. `supabase-setup.sql` 파일의 내용을 복사하여 붙여넣기
3. "Run" 버튼 클릭

또는 아래 SQL을 직접 실행:

```sql
-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_documents_task_id ON documents(task_id);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Allow all operations (development mode)
CREATE POLICY "Allow all operations on documents" ON documents
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## 4. Storage Bucket 생성

1. Supabase Dashboard > Storage
2. "New bucket" 클릭
3. 설정:
   - **Name:** `project-files`
   - **Public bucket:** ✅ 체크 (공개 URL 접근 허용)
4. "Create bucket" 클릭

### Storage 정책 설정 (선택사항)

기본적으로 public bucket은 모든 사용자가 파일을 업로드/다운로드할 수 있습니다.
보안을 강화하려면:

1. Storage > project-files > Policies
2. "New policy" 클릭
3. 다음과 같이 설정:

```sql
-- Allow uploads
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'project-files');

-- Allow downloads
CREATE POLICY "Allow public downloads" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'project-files');

-- Allow deletes
CREATE POLICY "Allow public deletes" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'project-files');
```

## 5. 배포 및 테스트

1. Vercel에서 재배포 (환경 변수 적용)
2. 애플리케이션 접속
3. 태스크 클릭 > 문서 업로드 테스트
4. Supabase Dashboard > Storage에서 업로드된 파일 확인

## 문제 해결

### "Supabase 업로드 실패" 에러

**원인:**
- 환경 변수가 설정되지 않음
- Storage bucket이 생성되지 않음
- documents 테이블이 생성되지 않음
- RLS 정책이 잘못 설정됨

**해결:**
1. Vercel 환경 변수 확인
2. Supabase Dashboard에서 bucket과 table 존재 여부 확인
3. SQL Editor에서 다시 `supabase-setup.sql` 실행
4. Vercel 재배포

### 파일 업로드 후 403 에러

**원인:** Storage bucket이 private으로 설정됨

**해결:**
1. Supabase Dashboard > Storage > project-files
2. Configuration > "Make public" 클릭

### RLS 에러

**원인:** Row Level Security가 활성화되었지만 정책이 없음

**해결:**
```sql
-- 모든 작업 허용 (개발 모드)
CREATE POLICY "Allow all" ON documents FOR ALL USING (true) WITH CHECK (true);
```

## 로컬 개발

로컬 개발 시 `.env` 파일 생성:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 보안 고려사항

현재 설정은 **개발/데모 목적**으로 모든 사용자에게 읽기/쓰기 권한을 부여합니다.

프로덕션 환경에서는:
1. 사용자 인증 구현 (Supabase Auth)
2. RLS 정책을 인증된 사용자로만 제한
3. Storage bucket을 private으로 설정
4. 적절한 CORS 정책 설정
