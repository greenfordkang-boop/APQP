# 배포 가이드

APQP e-Development Plan 애플리케이션을 Vercel에 배포하는 가이드입니다.

## 🚀 Vercel 배포

### 1. GitHub 연동

1. **Vercel 접속**: https://vercel.com
2. **GitHub 계정으로 로그인**
3. **Import Project** 클릭
4. **GitHub 저장소 선택**: `greenfordkang-boop/APQP`

### 2. 프로젝트 설정

Vercel이 자동으로 감지합니다:

```
Framework: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

설정이 정확한지 확인 후 **Deploy** 클릭

### 3. 환경변수 설정

배포 완료 후:

1. **Dashboard** → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 변수 추가:

```bash
# Production 환경
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=your-gemini-api-key-here
VITE_APP_ENV=production
```

4. **Redeploy** 클릭 (환경변수 적용)

---

## 🔄 자동 배포

GitHub에 push하면 자동으로 배포됩니다:

```bash
git add .
git commit -m "feat: Add new feature"
git push
```

**Vercel이 자동으로**:
- 변경사항 감지
- 빌드 실행
- 배포 완료
- Preview URL 생성

---

## 🌐 커스텀 도메인 설정

### 1. Vercel에서 도메인 추가

1. **Settings** → **Domains**
2. **Add** 클릭
3. 도메인 입력: `apqp.yourdomain.com`

### 2. DNS 설정

도메인 제공업체(GoDaddy, Namecheap 등)에서:

**CNAME 레코드 추가**:
```
Name: apqp
Value: cname.vercel-dns.com
```

또는

**A 레코드 추가**:
```
Name: apqp
Value: 76.76.21.21
```

### 3. SSL 인증서

Vercel이 자동으로 Let's Encrypt SSL 인증서 발급

---

## 📊 배포 상태 확인

### Vercel Dashboard

1. **Deployments** 탭
   - 최근 배포 목록
   - 빌드 로그
   - Preview URL

2. **상태**:
   - ✅ Ready - 성공
   - ⏳ Building - 빌드 중
   - ❌ Error - 실패

### GitHub Actions

프로젝트에 CI/CD 파이프라인 설정됨:

- `.github/workflows/ci.yml`
- TypeScript 타입 체크
- 테스트 실행
- 빌드 확인

---

## 🐛 배포 문제 해결

### "Build Failed" 오류

**확인사항**:
1. 로컬에서 빌드 성공 확인:
   ```bash
   npm run build
   ```
2. TypeScript 오류 확인:
   ```bash
   npm run type-check
   ```
3. 의존성 확인:
   ```bash
   npm install
   ```

### 환경변수 오류

**증상**: "Mock 모드" 경고 또는 API 호출 실패

**해결**:
1. Vercel Dashboard → Settings → Environment Variables
2. 모든 `VITE_` prefix 확인
3. 값에 공백 또는 줄바꿈 없는지 확인
4. Redeploy

### 빌드 시간 초과

**원인**: 번들 크기가 큼

**해결**:
1. `vite.config.ts`에서 코드 스플리팅 설정
2. 불필요한 의존성 제거
3. Dynamic import 사용

---

## 🔐 보안 설정

### 1. Vercel Headers

`vercel.json`에 보안 헤더 설정됨:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 2. 환경변수 보호

- API 키는 절대 코드에 하드코딩하지 말 것
- `.env` 파일은 Git에 커밋하지 말 것
- Vercel 환경변수만 사용

### 3. Supabase RLS

프로덕션 환경에서는 Row Level Security 활성화:

- 인증된 사용자만 접근
- 사용자별 데이터 격리

---

## 📈 성능 최적화

### 1. 빌드 최적화

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react'],
        }
      }
    }
  }
})
```

### 2. 이미지 최적화

- WebP 형식 사용
- Lazy loading
- Responsive images

### 3. CDN 캐싱

Vercel Edge Network 자동 활용:
- Static assets 캐싱
- Global CDN
- Automatic compression

---

## 🔄 롤백

배포 실패 시 이전 버전으로 롤백:

1. **Deployments** 탭
2. 정상 동작하던 배포 선택
3. **Promote to Production** 클릭

---

## 📊 Analytics

### Vercel Analytics (권장)

1. **Dashboard** → **Analytics** 탭
2. **Enable Analytics** 클릭
3. 무료 플랜: 2,500 events/month

**모니터링 항목**:
- Page views
- Unique visitors
- Top pages
- Web Vitals (LCP, FID, CLS)

### Google Analytics (선택)

`index.html`에 추가:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 🚨 알림 설정

### Vercel Notifications

1. **Settings** → **Notifications**
2. 알림 채널 선택:
   - Email
   - Slack
   - Discord

**알림 유형**:
- Deployment succeeded
- Deployment failed
- Comment on deployment

---

## 📝 배포 체크리스트

배포 전 확인사항:

- [ ] 로컬 빌드 성공 (`npm run build`)
- [ ] TypeScript 오류 없음 (`npm run type-check`)
- [ ] 테스트 통과 (`npm run test`)
- [ ] 환경변수 설정 완료
- [ ] Supabase 데이터베이스 설정 완료
- [ ] `.env` 파일이 `.gitignore`에 포함됨
- [ ] README.md 업데이트
- [ ] CHANGELOG.md 작성 (선택)

배포 후 확인사항:

- [ ] 프로덕션 URL 접속 확인
- [ ] 로그인/회원가입 테스트
- [ ] 프로젝트 CRUD 테스트
- [ ] 문서 업로드/다운로드 테스트
- [ ] FMEA 생성 테스트
- [ ] 모바일 반응형 확인
- [ ] 브라우저 호환성 확인

---

## 🌍 다국어 지원 (향후)

현재 한국어만 지원. 영어 지원 추가 시:

1. i18n 라이브러리 추가: `react-i18next`
2. 번역 파일 생성: `locales/ko.json`, `locales/en.json`
3. 언어 선택 UI 추가

---

## 📚 참고 자료

- [Vercel 공식 문서](https://vercel.com/docs)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html)
- [Vercel CLI](https://vercel.com/docs/cli)

---

**배포 완료!** 🎉

프로덕션 URL: https://apqp.vercel.app (예시)
