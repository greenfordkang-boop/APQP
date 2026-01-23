# APQP e-Development Plan Dashboard

IATF 16949 표준 기반 자동차 산업 전자개발계획 관리 시스템

## 🚀 주요 기능

- **간트 차트 기반 일정 관리**: Plan vs Actual 비교 및 지연 자동 감지
- **APQP 단계별 태스크 관리**: 설계, 공정 준비, PV/MP, 양산 단계 구분
- **AI 기반 리스크 분석**: Google Gemini를 활용한 IATF 8.3 준수 분석
- **문서 관리 시스템**: 단계별 문서 업로드/다운로드/미리보기
- **PFMEA 자동 생성**: AI 기반 공정 FMEA 초안 작성 및 편집
- **포트폴리오 대시보드**: 전체 프로젝트 현황 한눈에 보기

## 📦 기술 스택

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 3 Flash
- **Icons**: Lucide React

## 🔧 설치 및 실행

### 1. 환경 설정

```bash
# 저장소 클론
git clone <repository-url>
cd APQP

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일을 열어 실제 API 키 입력
```

### 2. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. Storage에서 `project-files` 버킷 생성 (Public)
4. `.env` 파일에 Supabase URL 및 Anon Key 입력

### 3. Google AI Studio 설정

1. [Google AI Studio](https://aistudio.google.com/app/apikey)에서 API 키 발급
2. `.env` 파일에 `VITE_GEMINI_API_KEY` 입력

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:5173 접속

## 📁 프로젝트 구조

```
APQP/
├── components/
│   ├── GanttChart.tsx           # 간트 차트 메인 뷰
│   ├── MilestoneBoard.tsx       # 마일스톤 스코어보드
│   ├── InsightPanel.tsx         # AI 리스크 분석 패널
│   ├── TaskDetailModal.tsx      # 태스크 상세 및 문서 관리
│   ├── PortfolioGantt.tsx       # 포트폴리오 대시보드
│   ├── ProjectEditModal.tsx     # 프로젝트 등록/수정
│   ├── FmeaGeneratorModal.tsx   # PFMEA 생성기
│   └── FilePreviewModal.tsx     # 파일 미리보기
├── services/
│   ├── supabaseClient.ts        # Supabase 클라이언트
│   ├── documentService.ts       # 문서 CRUD
│   └── geminiService.ts         # AI 분석 서비스
├── supabase/
│   ├── schema.sql               # 데이터베이스 스키마
│   └── migrations/              # 마이그레이션 파일
├── tests/                       # 테스트 코드
├── types.ts                     # TypeScript 타입 정의
├── constants.ts                 # Mock 데이터
├── utils.ts                     # 유틸리티 함수
└── App.tsx                      # 메인 애플리케이션
```

## 🔐 보안 주의사항

- `.env` 파일은 절대 Git에 커밋하지 마세요
- Supabase Row Level Security (RLS) 정책을 반드시 설정하세요
- 프로덕션 환경에서는 API 키를 서버사이드에서 관리하세요

## 🧪 테스트

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e
```

## 📦 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 📄 라이선스

Private - Company Internal Use Only

---

**Original AI Studio App**: https://ai.studio/apps/drive/19a4U7tEMg1ST9PtRRh-IpfDySFxuQ51Y

---
*Last updated: 2026-01-23*
