import React, { useState, useEffect } from 'react';
import { getAllCommentsForAdmin } from '../services/commentService';
import { TaskCommentRow } from '../types';
import type { ProjectInfo, Task } from '../types';
import { MessageSquare, List, Loader2 } from 'lucide-react';

interface Props {
  projects: ProjectInfo[];
  tasks: Task[];
  onBack: () => void;
}

export const AdminCommentList: React.FC<Props> = ({ projects, tasks, onBack }) => {
  const [rows, setRows] = useState<TaskCommentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await getAllCommentsForAdmin(projects, tasks);
      if (!cancelled) {
        setRows(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projects, tasks]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
          >
            <List className="text-gray-700" size={20} />
          </button>
          <div className="flex items-center gap-2">
            <MessageSquare className="text-amber-500" size={22} />
            <h1 className="text-lg font-bold text-gray-900">담당자 의견 목록 (관리자)</h1>
          </div>
        </div>
      </header>

      <main className="flex-grow p-6 overflow-auto">
        <p className="text-sm text-gray-500 mb-4">
          상위프로젝트 → 하위메뉴(단계) → 코멘트 → 등록일자 → 등록자
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={32} className="animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
            등록된 의견이 없습니다.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">상위프로젝트</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">하위메뉴 (단계)</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">코멘트</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">등록일자</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">등록자</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-amber-50/30">
                      <td className="px-4 py-3 text-sm text-gray-800">{r.project_name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-gray-800">{r.task_name}</span>
                        {r.phase && <span className="text-gray-500 text-xs block">{r.phase}</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 max-w-xs">
                        <span className="line-clamp-2">{r.content}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.author}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
