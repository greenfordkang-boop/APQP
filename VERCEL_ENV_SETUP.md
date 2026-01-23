# ⚠️ Vercel 환경변수 설정 필수

## 🚨 현재 문제

Vercel 배포가 환경변수 누락으로 실패했습니다:
```
Environment Variable "VITE_SUPABASE_URL" references Secret "vite_supab..."
```

## ✅ 해결 방법

### 1. Vercel Dashboard 접속

**👉 https://vercel.com/dashboard**

### 2. 프로젝트 선택

APQP 프로젝트 클릭

### 3. 환경변수 설정

**Settings** → **Environment Variables** 클릭

### 4. 다음 3개의 변수 추가

#### Variable 1:
```
Name: VITE_SUPABASE_URL
Value: https://msbovhsyjpyhxqeljegx.supabase.co
Environment: Production, Preview, Development (모두 체크)
```

#### Variable 2:
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYm92aHN5aXB5aHhxZWxqZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNDQzNTYsImV4cCI6MjA4NDcyMDM1Nn0.PjdDfVOF1bo1aliZOO6tdFN-houVeUlAOyP8CjIhf24
Environment: Production, Preview, Development (모두 체크)
```

#### Variable 3:
```
Name: VITE_GEMINI_API_KEY
Value: AIzaSyDk8aI6qG0AC_OnFj0pZFr6LaSVuJ51qrI
Environment: Production, Preview, Development (모두 체크)
```

### 5. 저장 후 재배포

1. **Save** 클릭
2. **Deployments** 탭으로 이동
3. **Redeploy** 버튼 클릭

---

## 🎯 설정 완료 후

약 2-3분 후 배포가 성공하면:
- ✅ Vercel 체크 통과
- ✅ 프로덕션 URL 생성
- ✅ PR Merge 가능

---

## 📋 빠른 링크

**Vercel 프로젝트 설정:**
https://vercel.com/dashboard → 프로젝트 선택 → Settings → Environment Variables

---

**환경변수 설정 후 이 문서를 삭제하거나 보관하세요!**
