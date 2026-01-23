#!/bin/bash
# 충돌 자동 해결 스크립트 (Feature Branch 우선)

set -e

echo "🔧 충돌 자동 해결 시작..."
echo ""

# 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "claude/automotive-dev-plan-app-Vxo2c" ]; then
  echo "⚠️  현재 브랜치가 claude/automotive-dev-plan-app-Vxo2c가 아닙니다."
  echo "   현재 브랜치: $CURRENT_BRANCH"
  read -p "   계속하시겠습니까? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "📥 최신 main 브랜치 가져오기..."
git fetch origin main

echo ""
echo "🔀 Feature Branch 우선 전략으로 merge 시도..."
echo "   (충돌 시 현재 브랜치의 코드를 우선 사용합니다)"
echo ""

# Merge with ours strategy
if git merge origin/main -X ours --no-edit -m "chore: Merge main with feature branch priority

Resolved conflicts using 'ours' strategy to keep feature branch improvements.

https://claude.ai/code/session_01U5NEaiVKTWH25TPbxGFs4K"; then
  echo ""
  echo "✅ Merge 성공!"
  echo ""
  echo "📤 변경사항을 원격 저장소에 push 중..."

  if git push; then
    echo ""
    echo "🎉 충돌 해결 완료!"
    echo ""
    echo "✅ 다음 단계:"
    echo "   1. GitHub PR 페이지에서 'Can't automatically merge' 경고가 사라졌는지 확인"
    echo "   2. 변경사항 리뷰"
    echo "   3. Merge pull request 클릭"
    echo ""
  else
    echo ""
    echo "⚠️  Push 실패. 네트워크를 확인하고 다시 시도하세요."
    exit 1
  fi
else
  echo ""
  echo "⚠️  자동 merge 실패."
  echo ""
  echo "🔧 수동 해결이 필요합니다:"
  echo "   1. 충돌 파일 확인: git status"
  echo "   2. 충돌 파일 편집"
  echo "   3. git add <파일명>"
  echo "   4. git commit"
  echo "   5. git push"
  echo ""
  echo "또는 GitHub Web UI에서 'Resolve conflicts' 버튼을 사용하세요."
  exit 1
fi
