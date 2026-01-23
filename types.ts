
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
  id: string; // Added for routing
  name: string;
  partNo: string;
  client: string;
  manager: string;
  startDate: string; // Added for portfolio Gantt
  endDate: string;   // Added for portfolio Gantt
  status: 'On Track' | 'Delayed' | 'Critical' | 'Completed'; // Overall status
  progress: number; // 0-100
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
  processStep: string;      // 공정 단계/기능
  failureMode: string;      // 잠재적 고장 모드
  failureEffect: string;    // 고장 영향
  severity: number;         // 심각도 (S)
  failureCause: string;     // 잠재적 원인
  occurrence: number;       // 발생도 (O)
  controls: string;         // 현행 공정 관리 (예방/검출)
  detection: number;        // 검출도 (D)
  rpn: number;              // 위험우선순위수 (Auto calc)
  action: string;           // 권고 조치 사항
}

export interface FmeaRevision {
  id: string;
  date: string;
  version: number;
  changeLog: string;
  editor?: string;
}

export interface FmeaData {
  rows: FmeaRow[];
  history: FmeaRevision[];
}
