#!/bin/bash
set -e

echo "== APQP 로컬 실행 시작 =="

# 1) 위치 확인
echo "[1] 현재 폴더: $(pwd)"

# 2) .env 존재 확인
if [ ! -f ".env" ]; then
  echo "❌ .env 파일이 없습니다. APQP 루트에 .env를 만들어 주세요."
  exit 1
fi

# 3) 필수 환경변수 존재 여부만 체크(값은 출력하지 않음)
echo "[2] .env 필수 키 체크"
grep -q '^VITE_SUPABASE_URL=' .env || { echo "❌ VITE_SUPABASE_URL 없음"; exit 1; }
grep -q '^VITE_SUPABASE_ANON_KEY=' .env || { echo "❌ VITE_SUPABASE_ANON_KEY 없음"; exit 1; }
echo "✅ .env 키 존재 OK"

# 4) 의존성 설치
echo "[3] npm install"
npm install

# 5) 개발 서버 실행
echo "[4] npm run dev"
echo "✅ 브라우저에서 문서 업로드 테스트 후, 콘솔 [Upload] 로그 확인"
npm run dev
