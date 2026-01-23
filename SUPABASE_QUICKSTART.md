# 🗄️ Supabase 설정 - 웹 페이지 단계별 가이드

## 📋 Step 1: Supabase 프로젝트 생성

### 🔗 링크
**👉 https://supabase.com/dashboard/new/new-project**

### ✅ 설정값
```
Name: APQP-Development-Plan
Database Password: [강력한 비밀번호 생성 - 꼭 메모!]
Region: Northeast Asia (Seoul)
Pricing Plan: Free
```

⏱️ 약 2-3분 대기

---

## 📋 Step 2: 데이터베이스 스키마 실행

### 🔗 링크
**👉 프로젝트 생성 후 자동으로 SQL Editor로 이동됨**

또는 직접 접속:
**https://supabase.com/dashboard/project/[your-project-id]/sql/new**

### ✅ 해야할 일
1. SQL Editor에서 **'New query'** 버튼 클릭
2. 아래 파일 내용을 **복사해서 붙여넣기**:
   ```
   📁 supabase/schema.sql
   ```
3. **'Run'** 버튼 클릭 (또는 Cmd/Ctrl + Enter)

---

## 📋 Step 3: Storage 버킷 생성

### 🔗 링크
**👉 https://supabase.com/dashboard/project/[your-project-id]/storage/buckets**

### ✅ 설정값
1. **'New bucket'** 버튼 클릭
2. 입력:
   ```
   Name: project-files
   Public bucket: ✅ 체크
   ```
3. **'Create bucket'** 클릭

---

## 📋 Step 4: API 키 복사

### 🔗 링크
**👉 https://supabase.com/dashboard/project/[your-project-id]/settings/api**

### ✅ 복사할 정보

#### 1. Project URL
```
Configuration → URL
예: https://abcdefghijk.supabase.co
```

#### 2. anon public key
```
Project API keys → anon public
예: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 Step 5: .env 파일 생성

### ✅ 프로젝트 루트에 `.env` 파일 생성

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini API (선택사항)
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# Environment
VITE_APP_ENV=development
```

**⚠️ 주의**: 위 값들을 Step 4에서 복사한 실제 값으로 변경하세요!

---

## 📋 Step 6: Google Gemini API 키 (선택사항)

FMEA AI 자동 생성 기능을 사용하려면:

### 🔗 링크
**👉 https://aistudio.google.com/app/apikey**

### ✅ 해야할 일
1. **'Create API key'** 클릭
2. API 키 복사
3. `.env` 파일의 `VITE_GEMINI_API_KEY` 값 변경

---

## 🎉 완료!

### ✅ 모든 설정이 완료되었습니다

이제 개발 서버를 실행하세요:

```bash
npm run dev
```

브라우저에서 **http://localhost:5173** 접속

---

## 🔍 정상 작동 확인

### ✅ 성공 시
- "데모 모드" 경고가 **표시되지 않음**
- 프로젝트 생성/수정/삭제 가능
- 문서 업로드/다운로드 가능

### ❌ 실패 시
- "데모 모드 실행 중" 경고 표시
- `.env` 파일의 API 키 재확인
- 개발 서버 재시작 (`npm run dev`)

---

## 🆘 문제 해결

### Mock 모드 경고가 계속 나타남

**해결책**:
1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. 환경변수 이름이 `VITE_` prefix로 시작하는지 확인
3. 터미널을 완전히 종료 후 `npm run dev` 재실행

### "Failed to fetch" 오류

**해결책**:
1. Supabase 프로젝트가 활성화되어 있는지 확인
2. API 키가 올바르게 복사되었는지 확인 (공백 없이)
3. RLS 정책 확인:
   **👉 https://supabase.com/dashboard/project/[your-project-id]/auth/policies**

---

## 📚 참고 링크

- **Supabase 대시보드**: https://supabase.com/dashboard
- **Supabase 문서**: https://supabase.com/docs
- **Google AI Studio**: https://aistudio.google.com

---

## ⚡ 빠른 링크 모음

설정 완료 후 자주 사용하는 링크:

1. **프로젝트 대시보드**: `https://supabase.com/dashboard/project/[your-project-id]`
2. **SQL Editor**: `https://supabase.com/dashboard/project/[your-project-id]/sql`
3. **Table Editor**: `https://supabase.com/dashboard/project/[your-project-id]/editor`
4. **Storage**: `https://supabase.com/dashboard/project/[your-project-id]/storage/buckets`
5. **API Settings**: `https://supabase.com/dashboard/project/[your-project-id]/settings/api`

---

**💡 Tip**: `[your-project-id]` 부분은 프로젝트 생성 후 URL에서 확인할 수 있습니다!
