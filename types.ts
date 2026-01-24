
export type TaskStatus = 'Completed' | 'In Progress' | 'Pending' | 'Delayed';

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface Task {
  id: number;
  name: string;
  phase: string;
  plan: DateRange;
  actual: DateRange | null; // null if not started
  status: TaskStatus;
  assignee: string;
}

export interface Milestone {
  name: string;
  date: string;
  color?: string;
}

export interface ProjectInfo {
  id?: number;
  name: string;
  partNo: string;
  client: string;
  manager: string;
  startDate?: string;
  endDate?: string;
  status?: 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'On Track' | 'Delayed' | 'Critical';
  progress?: number;
  milestones: Milestone[];
}

export interface TaskDocument {
  id: string | number;
  task_id: number;
  name: string;
  url: string;
  size?: number;
  type?: string;
  created_at: string;
}

export interface AIAnalysisResult {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  summary: string;
  recommendations: string[];
  iatfClauseReference: string;
}

export interface FmeaRow {
  id?: string;
  processStep: string;
  function: string;
  failureMode: string;
  effects: string;
  severity: number;
  causes: string;
  occurrence: number;
  controls: string;
  detection: number;
  rpn: number;
  actions: string;
  responsibility: string;
  targetDate: string;
}

export interface FmeaRevision {
  version: number;
  timestamp: string;
  user: string;
  changes: string;
}

export interface FmeaData {
  rows: FmeaRow[];
  revisions: FmeaRevision[];
  version: number;
  lastModified?: string;
}

/** 담당자 의견 (하위 단계별 코멘트) */
export interface TaskComment {
  id: number | string;
  task_id: number;
  content: string;
  author: string;
  created_at: string;
}

/** 관리자 목록용: 프로젝트·태스크 정보 포함 */
export interface TaskCommentRow extends TaskComment {
  project_name: string;
  task_name: string;
  phase: string | null;
}