import { ProjectInfo, Task } from './types';

export const MOCK_PROJECT: ProjectInfo = {
  name: "JG 팝업모니터 & REAR COVER ASSY",
  partNo: "ACQ30063301",
  client: "신성오토텍(주)",
  manager: "김민수 PM",
  milestones: [
    { name: "T/OF (Tool Off)", date: "2025-07-15", color: "bg-blue-500" },
    { name: "P1 (Pilot 1)", date: "2025-11-15", color: "bg-indigo-500" },
    { name: "P2 (Pilot 2)", date: "2026-03-15", color: "bg-purple-500" },
    { name: "선행양산", date: "2026-06-15", color: "bg-cyan-500" },
    { name: "M (SOP)", date: "2026-07-15", color: "bg-slate-700" },
    { name: "북미수출", date: "2026-12-01", color: "bg-orange-500" },
  ]
};

export const MOCK_TASKS: Task[] = [
  // 1. 설계 및 시작검증 단계
  {
    id: 1,
    name: "조직도(CFT)",
    phase: "설계 및 시작검증 단계",
    plan: { start: "2025-03-01", end: "2025-03-15" },
    actual: { start: "2025-03-01", end: "2025-03-15" },
    status: "Completed",
    assignee: "PM"
  },
  {
    id: 2,
    name: "품질목표 및 Q,C,D목표설정",
    phase: "설계 및 시작검증 단계",
    plan: { start: "2025-03-01", end: "2025-03-20" },
    actual: { start: "2025-03-01", end: "2025-03-20" },
    status: "Completed",
    assignee: "품질팀"
  },
  {
    id: 3,
    name: "설계계획 (마스터시트)",
    phase: "설계 및 시작검증 단계",
    plan: { start: "2025-03-01", end: "2025-03-20" },
    actual: { start: "2025-03-01", end: "2025-03-20" },
    status: "Completed",
    assignee: "설계팀"
  },
  {
    id: 4,
    name: "문제점 반영 (과거차 CLAIM)",
    phase: "설계 및 시작검증 단계",
    plan: { start: "2025-03-01", end: "2025-03-31" },
    actual: { start: "2025-03-01", end: "2025-03-31" },
    status: "Completed",
    assignee: "품질팀"
  },
  {
    id: 5,
    name: "시작부품 공급 (제작 및 검증)",
    phase: "설계 및 시작검증 단계",
    plan: { start: "2025-03-01", end: "2026-03-31" },
    actual: { start: "2025-03-01", end: "2025-11-30" }, // 진행중
    status: "In Progress",
    assignee: "개발팀"
  },

  // 2. 시작 및 부품제조공정 준비단계 (DV)
  {
    id: 6,
    name: "공정 FMEA",
    phase: "시작 및 부품제조공정 준비단계 (DV)",
    plan: { start: "2025-09-01", end: "2025-11-30" },
    actual: { start: "2025-09-01", end: "2025-11-15" },
    status: "Completed",
    assignee: "생산기술"
  },
  {
    id: 7,
    name: "공정관리계획서",
    phase: "시작 및 부품제조공정 준비단계 (DV)",
    plan: { start: "2025-09-01", end: "2025-11-30" },
    actual: { start: "2025-09-01", end: "2025-11-15" },
    status: "Completed",
    assignee: "생산기술"
  },
  {
    id: 8,
    name: "신뢰성시험 능력검토",
    phase: "시작 및 부품제조공정 준비단계 (DV)",
    plan: { start: "2025-10-01", end: "2025-11-30" },
    actual: { start: "2025-10-01", end: "2025-11-15" },
    status: "Completed",
    assignee: "시험팀"
  },
  {
    id: 9,
    name: "신뢰성시험 계획",
    phase: "시작 및 부품제조공정 준비단계 (DV)",
    plan: { start: "2025-07-01", end: "2025-09-30" },
    actual: { start: "2025-07-15", end: "2025-10-15" }, // 약간 지연
    status: "Delayed",
    assignee: "시험팀"
  },
  {
    id: 10,
    name: "외주품 개발",
    phase: "시작 및 부품제조공정 준비단계 (DV)",
    plan: { start: "2025-07-01", end: "2025-09-30" },
    actual: { start: "2025-06-15", end: "2025-09-30" },
    status: "Completed",
    assignee: "구매팀"
  },
  {
    id: 11,
    name: "설비/금형/지그/검사구 개발",
    phase: "시작 및 부품제조공정 준비단계 (DV)",
    plan: { start: "2025-08-01", end: "2025-10-31" },
    actual: { start: "2025-08-15", end: "2025-10-15" },
    status: "Completed",
    assignee: "개발팀"
  },
  {
    id: 12,
    name: "PALLET 개발 (공정/납품)",
    phase: "시작 및 부품제조공정 준비단계 (DV)",
    plan: { start: "2025-09-01", end: "2026-02-28" },
    actual: { start: "2025-10-01", end: "2026-02-28" },
    status: "In Progress",
    assignee: "생산기술"
  },
  {
    id: 13,
    name: "공정 편성, 교육",
    phase: "시작 및 부품제조공정 준비단계 (DV)",
    plan: { start: "2025-09-01", end: "2025-12-15" },
    actual: { start: "2025-09-01", end: "2025-12-01" },
    status: "In Progress",
    assignee: "생산팀"
  },
  {
    id: 14,
    name: "검사 기준서",
    phase: "시작 및 부품제조공정 준비단계 (DV)",
    plan: { start: "2025-09-01", end: "2025-12-15" },
    actual: { start: "2025-09-01", end: "2025-12-15" },
    status: "In Progress",
    assignee: "품질팀"
  },
  {
    id: 15,
    name: "작업 표준서",
    phase: "시작 및 부품제조공정 준비단계 (DV)",
    plan: { start: "2025-09-01", end: "2025-12-15" },
    actual: { start: "2025-09-01", end: "2025-12-15" },
    status: "In Progress",
    assignee: "생산기술"
  },

  // 3. PV 및 MP단계
  {
    id: 16,
    name: "R&RATE 부품 검사",
    phase: "P V 및 M P단계",
    plan: { start: "2025-10-01", end: "2025-11-30" },
    actual: { start: "2025-11-01", end: "2025-11-15" },
    status: "Completed",
    assignee: "품질팀"
  },
  {
    id: 17,
    name: "공정 능력 평가",
    phase: "P V 및 M P단계",
    plan: { start: "2025-10-01", end: "2025-11-30" },
    actual: { start: "2025-10-15", end: "2025-11-30" },
    status: "Completed",
    assignee: "생산기술"
  },
  {
    id: 18,
    name: "공정 감사",
    phase: "P V 및 M P단계",
    plan: { start: "2025-11-01", end: "2025-12-15" },
    actual: null,
    status: "Pending",
    assignee: "품질보증"
  },
  {
    id: 19,
    name: "신뢰성 시험의뢰",
    phase: "P V 및 M P단계",
    plan: { start: "2025-10-15", end: "2025-11-15" },
    actual: { start: "2025-11-01", end: "2025-11-15" },
    status: "Completed",
    assignee: "시험팀"
  },
  {
    id: 20,
    name: "ISIR 승인",
    phase: "P V 및 M P단계",
    plan: { start: "2025-11-01", end: "2025-11-30" },
    actual: { start: "2025-11-10", end: "2025-12-10" }, // 지연
    status: "Delayed",
    assignee: "품질보증"
  },
  {
    id: 21,
    name: "F.P.S.C (양산단가)",
    phase: "P V 및 M P단계",
    plan: { start: "2025-11-01", end: "2025-11-30" },
    actual: { start: "2025-11-15", end: "2025-11-20" },
    status: "Completed",
    assignee: "영업팀"
  },

  // 4. 양산
  {
    id: 22,
    name: "초도양산품 전수검사 (1개월)",
    phase: "양산",
    plan: { start: "2026-09-01", end: "2026-10-31" },
    actual: null,
    status: "Pending",
    assignee: "품질팀"
  },
  {
    id: 23,
    name: "양산이관",
    phase: "양산",
    plan: { start: "2026-10-01", end: "2026-12-31" },
    actual: null,
    status: "Pending",
    assignee: "PM"
  }
];