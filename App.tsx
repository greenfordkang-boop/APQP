
import React, { useState, useEffect } from 'react';
import { MOCK_PROJECT, MOCK_TASKS } from './constants';
import { Task, ProjectInfo } from './types';
import { GanttChart } from './components/GanttChart';
import { PortfolioGantt } from './components/PortfolioGantt';
import { MilestoneBoard } from './components/MilestoneBoard';
import { InsightPanel } from './components/InsightPanel';
import { TaskDetailModal } from './components/TaskDetailModal';
import { ProjectEditModal } from './components/ProjectEditModal';
import { getTaskDocumentCounts } from './services/documentService';
import { BarChart3, Layout, Settings, Share2, Sparkles, UserCircle, Plus, List, Edit2 } from 'lucide-react';

type ViewMode = 'dashboard' | 'detail';

const App: React.FC = () => {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [currentProject, setCurrentProject] = useState<ProjectInfo | null>(null);

  // Data state
  const [projects, setProjects] = useState<ProjectInfo[]>([
    {
      ...MOCK_PROJECT,
      id: 1,
      startDate: '2025-03-01',
      endDate: '2026-12-31',
      status: 'In Progress',
      progress: 35
    }
  ]);

  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [docCounts, setDocCounts] = useState<Record<number, number>>({});

  // UI state
  const [isInsightOpen, setIsInsightOpen] = useState(true);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectInfo | undefined>(undefined);

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

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    refreshDocCounts();
    setSelectedTask(null);
  };

  const handleProjectClick = (project: ProjectInfo) => {
    setCurrentProject(project);
    setViewMode('detail');
  };

  const handleBackToDashboard = () => {
    setViewMode('dashboard');
    setCurrentProject(null);
  };

  const handleProjectSave = (project: ProjectInfo) => {
    if (project.id) {
      // Update existing project
      setProjects(prev => prev.map(p => p.id === project.id ? project : p));
      if (currentProject?.id === project.id) {
        setCurrentProject(project);
      }
    } else {
      // Add new project
      const newProject = { ...project, id: Date.now() };
      setProjects(prev => [...prev, newProject]);
    }
    setIsProjectModalOpen(false);
    setEditingProject(undefined);
  };

  const handleProjectDelete = (projectId: number) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (currentProject?.id === projectId) {
      handleBackToDashboard();
    }
    setIsProjectModalOpen(false);
    setEditingProject(undefined);
  };

  const handleNewProject = () => {
    setEditingProject(undefined);
    setIsProjectModalOpen(true);
  };

  const handleEditProject = (project: ProjectInfo) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleEditCurrentProject = () => {
    if (currentProject) {
      setEditingProject(currentProject);
      setIsProjectModalOpen(true);
    }
  };

  // Dashboard View (Portfolio)
  if (viewMode === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Layout className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">APQP 포트폴리오 대시보드</h1>
              <p className="text-xs text-gray-500">전체 프로젝트 현황</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleNewProject}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              <span>새 프로젝트</span>
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

        {/* Main Content */}
        <main className="flex-grow p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-hidden">
            <PortfolioGantt
              projects={projects}
              onProjectClick={handleProjectClick}
              onProjectEdit={handleEditProject}
              startDate="2025-01-01"
              totalDays={730}
            />
          </div>
        </main>

        {/* Project Edit Modal */}
        {isProjectModalOpen && (
          <ProjectEditModal
            project={editingProject}
            onClose={() => {
              setIsProjectModalOpen(false);
              setEditingProject(undefined);
            }}
            onSave={handleProjectSave}
            onDelete={handleProjectDelete}
          />
        )}
      </div>
    );
  }

  // Detail View (Single Project)
  const displayProject = currentProject || projects[0];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToDashboard}
            className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
          >
            <List className="text-gray-700" size={20} />
          </button>
          <div className="bg-blue-600 p-2 rounded-lg">
            <Layout className="text-white" size={20} />
          </div>
          <div className="flex-grow">
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">e-Dev 개발계획</h1>
              <button
                onClick={handleEditCurrentProject}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="프로젝트 정보 수정"
              >
                <Edit2 size={16} className="text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              프로젝트: {displayProject.name} ({displayProject.partNo}) | 고객사: {displayProject.client}
            </p>
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
              <p className="text-sm font-medium text-gray-700">{displayProject.manager || '김민수'}</p>
              <p className="text-xs text-gray-400">프로젝트 매니저</p>
            </div>
            <UserCircle size={32} className="text-gray-300" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-6 flex flex-col relative overflow-hidden">
        {/* Milestone Scoreboard */}
        <MilestoneBoard project={displayProject} />

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
                tasks={tasks}
                milestones={displayProject.milestones}
                startDate="2025-03-01"
                totalDays={670}
                onTaskClick={handleTaskClick}
                documentCounts={docCounts}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Sidebar */}
      <InsightPanel
        project={displayProject}
        tasks={tasks}
        isOpen={isInsightOpen}
        onClose={() => setIsInsightOpen(false)}
      />

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          project={displayProject}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}

      {/* Project Edit Modal */}
      {isProjectModalOpen && (
        <ProjectEditModal
          project={editingProject}
          onClose={() => {
            setIsProjectModalOpen(false);
            setEditingProject(undefined);
          }}
          onSave={handleProjectSave}
          onDelete={handleProjectDelete}
        />
      )}
    </div>
  );
};

export default App;
