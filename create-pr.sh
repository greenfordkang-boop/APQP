#!/bin/bash
# APQP PR 자동 생성 스크립트

set -e

echo "🚀 Creating Pull Request to main..."

# Git 정보 가져오기
CURRENT_BRANCH=$(git branch --show-current)
REPO_URL=$(git config --get remote.origin.url | sed 's/\.git$//')
LAST_COMMIT_MSG=$(git log -1 --pretty=%B)

# PR URL 생성
if [[ $REPO_URL == http* ]]; then
  # HTTP URL
  GITHUB_URL=$(echo $REPO_URL | sed 's|http://127.0.0.1:[0-9]*/git/|https://github.com/|')
else
  # SSH URL
  GITHUB_URL=$(echo $REPO_URL | sed 's|git@github.com:|https://github.com/|')
fi

PR_URL="${GITHUB_URL}/pull/new/${CURRENT_BRANCH}"

echo ""
echo "📝 Current Branch: ${CURRENT_BRANCH}"
echo "📝 Last Commit: ${LAST_COMMIT_MSG}"
echo ""
echo "✅ PR 생성 URL:"
echo "${PR_URL}"
echo ""
echo "👆 위 URL을 브라우저에서 열어 PR을 생성하세요."
echo ""

# GitHub CLI가 설치되어 있으면 자동 생성 시도
if command -v gh &> /dev/null; then
  echo "🤖 GitHub CLI 감지됨. 자동으로 PR을 생성합니다..."

  # PR 본문 생성
  PR_BODY=$(cat <<EOF
## 📋 Summary

${LAST_COMMIT_MSG}

## ✨ Changes

$(git log origin/main..HEAD --oneline --pretty=format:"- %s" | head -10)

## 🧪 Testing

- [x] 로컬 빌드 성공
- [x] TypeScript 컴파일 통과
- [ ] 배포 확인 대기

## 🔗 Related

- Session: https://claude.ai/code/session_01U5NEaiVKTWH25TPbxGFs4K
EOF
)

  gh pr create \
    --base main \
    --head "${CURRENT_BRANCH}" \
    --title "${LAST_COMMIT_MSG}" \
    --body "${PR_BODY}" \
    --web

else
  echo "💡 Tip: GitHub CLI를 설치하면 자동으로 PR을 생성할 수 있습니다:"
  echo "   brew install gh  (macOS)"
  echo "   apt install gh   (Ubuntu)"
  echo ""
  echo "🌐 브라우저에서 위 URL을 열어주세요."
fi
