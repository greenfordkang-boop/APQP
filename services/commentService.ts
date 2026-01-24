import { supabase, isSupabaseConfigured } from './supabaseClient';
import { TaskComment, TaskCommentRow } from '../types';
import type { ProjectInfo, Task } from '../types';

const MOCK_STORAGE_KEY = 'apqp_task_comments';

/** task_id별 코멘트 조회 */
export async function getCommentsByTask(taskId: number): Promise<TaskComment[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[Comment] getCommentsByTask error:', error);
      return [];
    }
    return (data || []) as TaskComment[];
  }
  const raw = localStorage.getItem(MOCK_STORAGE_KEY);
  const all: (TaskComment & { project_id?: number })[] = raw ? JSON.parse(raw) : [];
  return all.filter((c) => c.task_id === taskId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * 담당자 의견 등록. 날짜(created_at)는 등록 시각으로 자동.
 * @param projectId Mock 모드에서 project_name 해석용 (선택)
 */
export async function addComment(
  taskId: number,
  content: string,
  author: string,
  projectId?: number
): Promise<TaskComment | null> {
  const t = taskId == null ? NaN : Number(taskId);
  if (!Number.isInteger(t) || t < 1 || !content?.trim() || !author?.trim()) return null;

  if (isSupabaseConfigured()) {
    const { data: taskRow, error: taskErr } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', t)
      .maybeSingle();
    if (taskErr || !taskRow) {
      console.error('[Comment] task not found:', t, taskErr);
      alert('해당 Task가 DB에 없습니다. 프로젝트/태스크를 Supabase에 먼저 저장한 뒤 등록해 주세요.');
      return null;
    }

    const { data, error } = await supabase
      .from('task_comments')
      .insert({ task_id: t, content: content.trim(), author: author.trim() })
      .select()
      .single();
    if (error) {
      console.error('[Comment] add error:', error);
      alert(`의견 등록 실패: ${error.message}`);
      return null;
    }
    return data as TaskComment;
  }

  const raw = localStorage.getItem(MOCK_STORAGE_KEY);
  const all: (TaskComment & { project_id?: number })[] = raw ? JSON.parse(raw) : [];
  const now = new Date().toISOString();
  const newComment: TaskComment & { project_id?: number } = {
    id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    task_id: t,
    content: content.trim(),
    author: author.trim(),
    created_at: now,
  };
  if (projectId != null) newComment.project_id = projectId;
  all.unshift(newComment);
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(all));
  return newComment as TaskComment;
}

/**
 * 관리자용 전체 코멘트 목록.
 * 상위프로젝트 > 하위메뉴(태스크) > 코멘트 > 등록일자 > 등록자
 * @param projects Mock 모드에서 project_name 해석용
 * @param tasks Mock 모드에서 task_name, phase 해석용
 */
export async function getAllCommentsForAdmin(
  projects?: ProjectInfo[],
  tasks?: Task[]
): Promise<TaskCommentRow[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('comment_list_admin')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[Comment] getAllCommentsForAdmin error:', error);
      return [];
    }
    return (data || []) as TaskCommentRow[];
  }

  const raw = localStorage.getItem(MOCK_STORAGE_KEY);
  const all: (TaskComment & { project_id?: number })[] = raw ? JSON.parse(raw) : [];
  const projMap = new Map<number, ProjectInfo>();
  (projects || []).forEach((p) => { if (p.id != null) projMap.set(p.id, p); });
  const taskMap = new Map<number, Task>();
  (tasks || []).forEach((t) => taskMap.set(t.id, t));

  return all
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((c) => {
      const task = taskMap.get(c.task_id);
      const project = c.project_id != null ? projMap.get(c.project_id) : undefined;
      return {
        ...c,
        project_name: project?.name ?? '-',
        task_name: task?.name ?? '-',
        phase: task?.phase ?? null,
      } as TaskCommentRow;
    });
}
