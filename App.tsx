import React, { useState, useEffect } from 'react';
import { MOCK_PROJECT, MOCK_TASKS } from './constants';
import { Task } from './types';
import { GanttChart } from './components/GanttChart';
import { MilestoneBoard } from './components/MilestoneBoard';
import { InsightPanel } from './components/InsightPanel';
import { TaskDetailModal } from './components/TaskDetailModal';
import { getTaskDocumentCounts } from './services/documentService';
import { BarChart3, Layout, Settings, Share2, Sparkles, UserCircle } from 'lucide-react';

const App: React.FC = () => {
  const [isInsightOpen, setIsInsightOpen] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [docCounts, setDocCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    refreshDocCounts();
  }, []);

  const refreshDocCounts = async () => {
    const counts = await getTaskDocumentCounts();
    setDocCounts(counts);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Layout className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">e-Dev 개발계획 대시보드</h1>
            <p className="text-xs text-gray-500">프로젝트: {MOCK_PROJECT.name} ({MOCK_PROJECT.partNo})</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsInsightOpen(!isInsightOpen)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all border
              ${isInsightOpen 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Sparkles size={16} className={isInsightOpen ? "text-indigo-600" : "text-gray-400"} />
            <span>AI 리스크 보고서</span>
          </button>
          
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          
          <button className="text-gray-400 hover:text-gray-600">
            <Share2 size={20} />
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <Settings size={20} />
          </button>
          <div className="flex items-center space-x-2 pl-2">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-700">김민수</p>
              <p className="text-xs text-gray-400">프로젝트 매니저</p>
            </div>
            <UserCircle size={32} className="text-gray-300" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-6 flex flex-col relative overflow-hidden">
        
        {/* Milestone Scoreboard */}
        <MilestoneBoard project={MOCK_PROJECT} />

        {/* Content Grid */}
        <div className="flex-grow flex gap-6 overflow-hidden h-full">
          {/* Left: Gantt Chart */}
          <div className="flex-grow flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <BarChart3 className="mr-2 text-gray-500" size={20} />
                종합 일정표 (APQP)
              </h2>
              <div className="flex space-x-4 text-xs">
                <div className="flex items-center"><div className="w-8 h-3 border border-gray-400 bg-white mr-2 relative"><div className="absolute -right-1 top-1/2 -translate-y-1/2 border-l-[4px] border-l-gray-400 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent"></div></div>계획</div>
                <div className="flex items-center"><div className="w-8 h-3 bg-black mr-2 relative"><div className="absolute -right-1 top-1/2 -translate-y-1/2 border-l-[4px] border-l-black border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent"></div></div>실적 (정상)</div>
                <div className="flex items-center"><div className="w-8 h-3 bg-red-600 mr-2 relative"><div className="absolute -right-1 top-1/2 -translate-y-1/2 border-l-[4px] border-l-red-600 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent"></div></div>실적 (지연)</div>
              </div>
            </div>
            
            <div className="flex-grow relative min-h-[400px]">
              <GanttChart 
                tasks={MOCK_TASKS} 
                startDate="2025-03-01" 
                totalDays={670} 
                onTaskClick={handleTaskClick}
                documentCounts={docCounts}
              />
            </div>
          </div>

          {/* Right: AI Panel Placeholder (Visual spacer for the fixed panel) */}
          <div className={`transition-all duration-300 ease-in-out ${isInsightOpen ? 'w-96' : 'w-0'}`}></div>
        </div>
      </main>

      {/* Fixed Sidebar */}
      <InsightPanel 
        project={MOCK_PROJECT} 
        tasks={MOCK_TASKS} 
        isOpen={isInsightOpen} 
        onClose={() => setIsInsightOpen(false)} 
      />

      {/* Document Modal */}
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={refreshDocCounts}
        />
      )}
    </div>
  );
};

export default App;