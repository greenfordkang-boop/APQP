#!/bin/bash
# Supabase 프로젝트 설정 가이드

echo "🗄️  APQP Supabase 데이터베이스 설정"
echo "=================================="
echo ""

echo "📋 Step 1: Supabase 프로젝트 생성"
echo ""
echo "1. https://supabase.com 접속"
echo "2. 'Start your project' 클릭"
echo "3. GitHub 또는 Google 계정으로 로그인"
echo "4. 'New Project' 클릭"
echo "5. 프로젝트 정보 입력:"
echo "   - Name: APQP-Development-Plan"
echo "   - Database Password: (강력한 비밀번호 생성 - 메모해두세요!)"
echo "   - Region: Northeast Asia (Seoul)"
echo "   - Pricing Plan: Free"
echo ""
echo "⏱️  프로젝트 생성 완료까지 약 2-3분 소요됩니다."
echo ""

read -p "프로젝트 생성이 완료되었나요? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "프로젝트 생성 후 다시 실행하세요."
  exit 1
fi

echo ""
echo "📋 Step 2: 데이터베이스 스키마 실행"
echo ""
echo "1. Supabase 프로젝트 대시보드에서 'SQL Editor' 클릭"
echo "2. 'New query' 클릭"
echo "3. 다음 파일의 내용을 복사하여 붙여넣기:"
echo "   📄 supabase/schema.sql"
echo ""
echo "4. 'Run' 버튼 클릭 (또는 Cmd/Ctrl + Enter)"
echo ""

read -p "스키마 실행이 완료되었나요? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "스키마 실행 후 다시 실행하세요."
  exit 1
fi

echo ""
echo "📋 Step 3: Storage 버킷 생성"
echo ""
echo "1. 왼쪽 메뉴에서 'Storage' 클릭"
echo "2. 'New bucket' 클릭"
echo "3. 버킷 설정:"
echo "   - Name: project-files"
echo "   - Public bucket: ✅ (체크)"
echo "   - Allowed MIME types: (비워두기 또는 아래 추가)"
echo "     * application/pdf"
echo "     * image/jpeg, image/png, image/gif, image/webp"
echo "     * text/csv, text/plain"
echo "     * application/json"
echo "     * application/vnd.ms-excel"
echo "     * application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
echo "   - File size limit: 10MB"
echo ""
echo "4. 'Create bucket' 클릭"
echo ""

read -p "Storage 버킷 생성이 완료되었나요? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "버킷 생성 후 다시 실행하세요."
  exit 1
fi

echo ""
echo "📋 Step 4: API 키 복사"
echo ""
echo "1. 왼쪽 메뉴에서 'Settings' → 'API' 클릭"
echo "2. 다음 정보를 복사하세요:"
echo ""
echo "   📌 Project URL:"
echo "   (예: https://abcdefghijk.supabase.co)"
echo ""
echo "   📌 anon public key:"
echo "   (예: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
echo ""

echo ""
read -p "Project URL을 입력하세요: " SUPABASE_URL
read -p "Anon public key를 입력하세요: " SUPABASE_KEY

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo ""
  echo "⚠️  URL 또는 Key가 비어있습니다. 다시 실행하세요."
  exit 1
fi

echo ""
echo "📋 Step 5: .env 파일 생성"
echo ""

cat > .env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_KEY}

# Google Gemini API (FMEA 생성 기능용)
VITE_GEMINI_API_KEY=your-gemini-api-key-here

# Environment
VITE_APP_ENV=development
EOF

echo "✅ .env 파일이 생성되었습니다!"
echo ""
echo "📄 생성된 파일: .env"
echo ""

cat .env

echo ""
echo "📋 Step 6: Google Gemini API 키 설정 (선택사항)"
echo ""
echo "FMEA AI 자동 생성 기능을 사용하려면:"
echo ""
echo "1. https://aistudio.google.com/app/apikey 접속"
echo "2. 'Create API key' 클릭"
echo "3. API 키 복사"
echo "4. .env 파일을 열어 VITE_GEMINI_API_KEY 값 변경"
echo ""

read -p "지금 Gemini API 키를 설정하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  read -p "Gemini API Key를 입력하세요: " GEMINI_KEY
  if [ ! -z "$GEMINI_KEY" ]; then
    sed -i.bak "s/VITE_GEMINI_API_KEY=.*/VITE_GEMINI_API_KEY=${GEMINI_KEY}/" .env
    rm -f .env.bak
    echo "✅ Gemini API 키가 설정되었습니다!"
  fi
fi

echo ""
echo "🎉 Supabase 설정 완료!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ 완료된 작업:"
echo "  1. ✅ Supabase 프로젝트 생성"
echo "  2. ✅ 데이터베이스 스키마 실행"
echo "  3. ✅ Storage 버킷 생성 (project-files)"
echo "  4. ✅ .env 파일 생성"
echo ""
echo "📝 다음 단계:"
echo "  1. 개발 서버 시작: npm run dev"
echo "  2. 브라우저에서 테스트: http://localhost:5173"
echo "  3. Vercel 환경변수 설정 (프로덕션 배포용)"
echo ""
echo "🔐 보안 주의사항:"
echo "  - .env 파일은 Git에 커밋하지 마세요 (이미 .gitignore에 추가됨)"
echo "  - API 키는 절대 공개하지 마세요"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
