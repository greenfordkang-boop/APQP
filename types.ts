
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
  startDate: string; // Added for portfolio Gantt
  endDate: string;   // Added for portfolio Gantt
  status: 'On Track' | 'Delayed' | 'Critical' | 'Completed'; // Overall status
  progress: number; // 0-100
  milestones: Milestone[];
  startDate?: string;
  endDate?: string;
  status?: 'Planning' | 'In Progress' | 'On Hold' | 'Completed';
  progress?: number;
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