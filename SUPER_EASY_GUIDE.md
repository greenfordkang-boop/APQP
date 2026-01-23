# 🚀 초간단 2단계 완료 가이드

## ⚡ 5분이면 끝납니다!

---

## 📍 Step 1: Vercel 환경변수 설정 (3분)

### 1-1. Vercel 로그인

**이 링크 클릭:**
👉 **https://vercel.com/login**

GitHub 계정으로 로그인

---

### 1-2. 프로젝트 설정 열기

**이 링크 클릭:**
👉 **https://vercel.com/dashboard**

→ **APQP** 프로젝트 찾아서 클릭
→ 상단의 **Settings** 탭 클릭
→ 왼쪽 메뉴에서 **Environment Variables** 클릭

---

### 1-3. 환경변수 3개 복사-붙여넣기

#### ✅ 변수 1번

**Name** 입력:
```
VITE_SUPABASE_URL
```

**Value** 입력:
```
https://msbovhsyjpyhxqeljegx.supabase.co
```

**Environment** 선택:
- ✅ Production
- ✅ Preview
- ✅ Development

**"Save" 버튼 클릭**

---

#### ✅ 변수 2번

**Name** 입력:
```
VITE_SUPABASE_ANON_KEY
```

**Value** 입력:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYm92aHN5aXB5aHhxZWxqZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNDQzNTYsImV4cCI6MjA4NDcyMDM1Nn0.PjdDfVOF1bo1aliZOO6tdFN-houVeUlAOyP8CjIhf24
```

**Environment** 선택:
- ✅ Production
- ✅ Preview
- ✅ Development

**"Save" 버튼 클릭**

---

#### ✅ 변수 3번

**Name** 입력:
```
VITE_GEMINI_API_KEY
```

**Value** 입력:
```
AIzaSyDk8aI6qG0AC_OnFj0pZFr6LaSVuJ51qrI
```

**Environment** 선택:
- ✅ Production
- ✅ Preview
- ✅ Development

**"Save" 버튼 클릭**

---

### 1-4. 재배포

상단 메뉴에서:
→ **Deployments** 탭 클릭
→ 가장 최근 배포 찾기
→ 오른쪽 **...** (점 3개) 클릭
→ **Redeploy** 클릭
→ **Redeploy** 버튼 다시 클릭 (확인)

**⏳ 2-3분 대기**

---

## 📍 Step 2: PR Merge (1분)

### 2-1. PR 페이지 열기

**이 링크 클릭:**
👉 **https://github.com/greenfordkang-boop/APQP/pull/1**

---

### 2-2. Vercel 체크 확인

페이지 아래쪽에서:
- ✅ **"Vercel"** 옆에 **녹색 체크** 나타나는지 확인
- (빨간 X면 1-2분 더 기다리고 새로고침)

---

### 2-3. Merge 클릭

녹색 체크 확인 후:
1. **"Merge pull request"** 버튼 클릭 (초록색 큰 버튼)
2. **"Confirm merge"** 버튼 클릭

---

## 🎉 완료!

### ✅ 자동으로 진행됩니다:

- ✅ main 브랜치에 자동 병합
- ✅ Vercel 프로덕션 배포 시작
- ✅ 약 2분 후 프로덕션 URL 생성

### 🌐 프로덕션 URL 확인:

**Vercel Dashboard 접속:**
👉 **https://vercel.com/dashboard**

→ APQP 프로젝트 클릭
→ **Deployments** 탭
→ 가장 위의 배포에서 **"Visit"** 버튼 클릭

---

## 🎊 축하합니다!

프로젝트가 성공적으로 배포되었습니다!

**이제 누구나 인터넷에서 접속할 수 있습니다!** 🚀

---

## 📋 요약

**해야 할 일:**
1. ✅ Vercel 환경변수 3개 추가 (복사-붙여넣기)
2. ✅ Redeploy 클릭
3. ✅ PR Merge 클릭

**소요 시간:** 총 5분

**지금 시작하세요!** 👆
