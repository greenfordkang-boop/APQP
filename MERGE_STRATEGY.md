# PR Merge 전략

## 현재 상황

- **Feature Branch**: `claude/automotive-dev-plan-app-Vxo2c`
- **Base Branch**: `main`
- **상태**: Can't automatically merge (충돌 발생)

## 충돌 파일 목록

1. `App.tsx`
2. `components/FilePreviewModal.tsx`
3. `components/FmeaGeneratorModal.tsx`
4. `components/GanttChart.tsx`
5. `components/PortfolioGantt.tsx`
6. `components/ProjectEditModal.tsx`
7. `components/TaskDetailModal.tsx`
8. `services/documentService.ts`
9. `types.ts`

## 해결 방법

### 옵션 1: GitHub Web UI에서 해결 (권장)

1. PR 페이지로 이동
2. "Resolve conflicts" 버튼 클릭
3. 각 파일에서 충돌 마커(`<<<<<<<`, `=======`, `>>>>>>>`) 확인
4. 유지할 코드 선택
5. "Mark as resolved" 클릭
6. 모든 충돌 해결 후 "Commit merge" 클릭

### 옵션 2: 로컬에서 해결

```bash
git checkout claude/automotive-dev-plan-app-Vxo2c
git merge origin/main

# 충돌 파일 수동 편집

git add .
git commit -m "Merge main into feature branch"
git push
```

### 옵션 3: Feature Branch 우선 (Ours Strategy)

```bash
git checkout claude/automotive-dev-plan-app-Vxo2c
git merge origin/main -X ours
git push
```

### 옵션 4: Main Branch 우선 (Theirs Strategy)

```bash
git checkout claude/automotive-dev-plan-app-Vxo2c
git merge origin/main -X theirs
git push
```

## 권장 전략

**Feature Branch(`claude/automotive-dev-plan-app-Vxo2c`)의 코드를 우선 사용**하는 것을 권장합니다.

이유:
- Feature Branch에 최신 개선 사항 포함
- Vercel 배포 수정 완료
- PR 자동화 도구 추가
- 보안 강화 완료

## 자동 해결 스크립트

```bash
./resolve-conflicts.sh
```
