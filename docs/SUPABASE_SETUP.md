# Supabase 데이터베이스 설정 가이드

APQP e-Development Plan 애플리케이션을 위한 Supabase 데이터베이스 설정 가이드입니다.

## 🚀 빠른 시작

```bash
./setup-supabase.sh
```

대화형 스크립트가 단계별로 안내합니다.

---

## 📋 수동 설정 가이드

### 1. Supabase 프로젝트 생성

1. **Supabase 접속**: https://supabase.com
2. **회원가입/로그인**: GitHub 또는 Google 계정 사용
3. **새 프로젝트 생성**:
   - 'New Project' 버튼 클릭
   - Organization 선택 (없으면 자동 생성)

4. **프로젝트 정보 입력**:
   ```
   Name: APQP-Development-Plan
   Database Password: [강력한 비밀번호 - 저장 필수!]
   Region: Northeast Asia (Seoul)
   Pricing Plan: Free
   ```

5. **프로젝트 생성 대기** (약 2-3분)

---

### 2. 데이터베이스 스키마 실행

#### 방법 1: SQL Editor (권장)

1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **'+ New query'** 클릭
3. `supabase/schema.sql` 파일 내용 복사
4. SQL Editor에 붙여넣기
5. **'Run'** 버튼 클릭 (또는 `Cmd/Ctrl + Enter`)

#### 방법 2: Supabase CLI

```bash
# Supabase CLI 설치 (한 번만)
npm install -g supabase

# 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref your-project-ref

# 스키마 적용
supabase db push
```

#### 생성되는 테이블

- `projects` - 프로젝트 정보
- `tasks` - 태스크 정보
- `documents` - 문서 메타데이터
- `fmea_data` - FMEA 데이터 및 이력

---

### 3. Storage 버킷 생성

1. 왼쪽 메뉴에서 **Storage** 클릭
2. **'New bucket'** 클릭
3. **버킷 설정**:

   ```
   Name: project-files
   Public bucket: ✅ (체크)
   ```

4. **파일 업로드 제한** (선택사항):
   - Settings 탭에서 설정
   - File size limit: `10485760` (10MB)
   - Allowed MIME types:
     ```
     application/pdf
     image/jpeg
     image/png
     image/gif
     image/webp
     text/csv
     text/plain
     application/json
     application/vnd.ms-excel
     application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
     ```

---

### 4. API 키 및 URL 확인

1. 왼쪽 메뉴에서 **Settings** → **API** 클릭
2. 다음 정보 복사:

   **Project URL**:
   ```
   https://your-project-id.supabase.co
   ```

   **anon public (API Key)**:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

### 5. 환경변수 설정

#### 로컬 개발 환경 (.env)

프로젝트 루트에 `.env` 파일 생성:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini API (FMEA 생성 기능용)
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# Environment
VITE_APP_ENV=development
```

#### Vercel 프로덕션 환경

1. Vercel Dashboard → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 변수 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY` (선택)

4. **Redeploy** 클릭

---

## 🔐 Row Level Security (RLS) 설정

현재 스키마는 개발 편의를 위해 모든 작업을 허용하는 정책을 사용합니다.

### 프로덕션 환경 권장 설정

프로덕션 환경에서는 사용자 인증 기반 RLS 정책을 설정하세요:

```sql
-- 기존 정책 삭제
DROP POLICY "Allow all operations on projects" ON projects;
DROP POLICY "Allow all operations on tasks" ON tasks;
DROP POLICY "Allow all operations on documents" ON documents;
DROP POLICY "Allow all operations on fmea_data" ON fmea_data;

-- 인증된 사용자만 접근 가능
CREATE POLICY "Authenticated users can view projects"
  ON projects FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert projects"
  ON projects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update own projects"
  ON projects FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Tasks, Documents, FMEA 테이블도 동일하게 설정
```

---

## 🧪 데이터베이스 연결 테스트

### 방법 1: 애플리케이션에서 확인

1. 개발 서버 시작:
   ```bash
   npm run dev
   ```

2. 브라우저에서 `http://localhost:5173` 접속

3. 프로젝트 생성 또는 문서 업로드 테스트

4. **데모 모드 경고**가 표시되지 않으면 성공 ✅

### 방법 2: Supabase 대시보드에서 확인

1. **Table Editor** 클릭
2. 생성된 테이블 목록 확인:
   - projects
   - tasks
   - documents
   - fmea_data

3. **Storage** 클릭
4. `project-files` 버킷 확인

---

## 🐛 문제 해결

### "Mock 모드 실행 중" 경고 표시

**원인**: Supabase API 키가 올바르게 설정되지 않음

**해결**:
1. `.env` 파일 확인
2. `VITE_` prefix 확인 (Vite 필수)
3. 개발 서버 재시작: `npm run dev`

### "Failed to fetch" 오류

**원인**: CORS 또는 API 키 오류

**해결**:
1. Supabase Dashboard → Settings → API
2. API URL 및 anon key 재확인
3. RLS 정책 확인

### Storage 업로드 실패

**원인**: 버킷이 Public이 아니거나 RLS 정책 문제

**해결**:
1. Storage → project-files → Settings
2. "Public bucket" 체크 확인
3. RLS 정책 확인

---

## 📊 데이터베이스 모니터링

### Supabase Dashboard

1. **Database** → **Usage**
   - 활성 연결 수
   - 데이터베이스 크기
   - API 요청 수

2. **Storage** → **Usage**
   - 저장 공간 사용량
   - 전송량

### Free Plan 제한사항

- Database: 500 MB
- Storage: 1 GB
- Bandwidth: 5 GB
- API Requests: 500,000 / month

---

## 🔄 마이그레이션 (향후)

데이터베이스 스키마 변경 시:

```sql
-- supabase/migrations/YYYYMMDD_description.sql 생성

-- 예: 새 컬럼 추가
ALTER TABLE projects ADD COLUMN budget INTEGER;

-- 예: 인덱스 추가
CREATE INDEX idx_tasks_project_id_status ON tasks(project_id, status);
```

---

## 📚 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Storage 가이드](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

---

## ✅ 설정 완료 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] 데이터베이스 스키마 실행 (`schema.sql`)
- [ ] Storage 버킷 생성 (`project-files`)
- [ ] `.env` 파일 생성 및 API 키 설정
- [ ] 애플리케이션 테스트 (Mock 모드 경고 없음)
- [ ] 프로젝트 생성 테스트
- [ ] 문서 업로드 테스트
- [ ] FMEA 생성 테스트 (Gemini API 설정 시)

---

**설정 완료 후**: `npm run dev`로 개발 서버를 시작하고 http://localhost:5173에서 테스트하세요! 🚀
