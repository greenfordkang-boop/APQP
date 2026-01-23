
import React, { useState, useEffect } from 'react';
import { MOCK_ALL_PROJECTS, MOCK_TASKS } from './constants';
import { Task, ProjectInfo, TaskStatus } from './types';
import { GanttChart } from './components/GanttChart';
import { PortfolioGantt } from './components/PortfolioGantt';
import { MilestoneBoard } from './components/MilestoneBoard';
import { InsightPanel } from './components/InsightPanel';
import { TaskDetailModal } from './components/TaskDetailModal';
import { ProjectEditModal } from './components/ProjectEditModal';
import { getTaskDocumentCounts } from './services/documentService';
import { BarChart3, Layout, Settings, Share2, Sparkles, UserCircle, Edit3, ArrowLeft, Grid, Plus } from 'lucide-react';

const App: React.FC = () => {
  // View State: 'dashboard' (List of projects) or 'detail' (Single project Gantt)
  const [viewMode, setViewMode] = useState<'dashboard' | 'detail'>('dashboard');
  
  // Projects State Management (To allow adding/editing)
  const [projects, setProjects] = useState<ProjectInfo[]>(MOCK_ALL_PROJECTS);
  
  // Tasks State Management (To allow status/assignee updates)
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  
  // Selected Project State
  const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<ProjectInfo | null>(null); // For Modal
  
  const [isInsightOpen, setIsInsightOpen] = useState(true);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
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

  const handleTaskUpdate = (taskId: number, updates: { status: TaskStatus, assignee: string }) => {
    // Update the main tasks list
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, ...updates } : t
    );
    setTasks(updatedTasks);

    // Also update the selected task so the modal reflects changes immediately
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, ...updates });
    }
  };

  // Open modal for Creating (null) or Editing (project object)
  const openProjectForm = (project: ProjectInfo | null) => {
    setProjectToEdit(project);
    setIsProjectFormOpen(true);
  };

  const handleProjectSave = (savedProject: ProjectInfo) => {
    setProjects(prevProjects => {
      const exists = prevProjects.some(p => p.id === savedProject.id);
      if (exists) {
        // Update existing
        const updated = prevProjects.map(p => p.id === savedProject.id ? savedProject : p);
        // If currently viewing this project, update selectedProject reference too
        if (selectedProject?.id === savedProject.id) {
          setSelectedProject(savedProject);
        }
        return updated;
      } else {
        // Create new
        return [...prevProjects, savedProject];
      }
    });
    setIsProjectFormOpen(false);
  };

  const handleProjectDelete = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    // If the deleted project was currently selected/viewed, go back to dashboard
    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
      setViewMode('dashboard');
    }
    setIsProjectFormOpen(false);
  };

  const handleProjectSelect = (project: ProjectInfo) => {
    setSelectedProject(project);
    setViewMode('detail');
  };

  const handleBackToDashboard = () => {
    setViewMode('dashboard');
    setSelectedProject(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-600 p-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors" onClick={handleBackToDashboard}>
            <Layout className="text-white" size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">e-Dev 개발계획 대시보드</h1>
              {viewMode === 'detail' && selectedProject && (
                <button 
                  onClick={() => openProjectForm(selectedProject)}
                  className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors"
                  title="프로젝트 정보 수정"
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>
            {viewMode === 'detail' && selectedProject ? (
              <p className="text-xs text-gray-500">
                 {selectedProject.client} | {selectedProject.name} ({selectedProject.partNo})
              </p>
            ) : (
              <p className="text-xs text-gray-500">전체 개발 차종 현황 (Portfolio)</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {viewMode === 'detail' && (
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
          )}
          
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          
          <button className="text-gray-400 hover:text-gray-600">
            <Share2 size={20} />
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <Settings size={20} />
          </button>
          <div className="flex items-center space-x-2 pl-2">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-700">
                {viewMode === 'detail' && selectedProject ? selectedProject.manager : '시스템 관리자'}
              </p>
              <p className="text-xs text-gray-400">프로젝트 매니저</p>
            </div>
            <UserCircle size={32} className="text-gray-300" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow p-6 flex flex-col relative overflow-hidden">
        
        {viewMode === 'dashboard' ? (
           /* --- DASHBOARD VIEW --- */
           <div className="flex flex-col h-full animate-fade-in">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                   <h2 className="text-xl font-bold text-gray-800 flex items-center mr-4">
                      <Grid className="mr-2 text-blue-600" size={24} />
                      전체 프로젝트 포트폴리오
                   </h2>
                   <div className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      총 {projects.length}개 차종
                   </div>
                </div>
                
                <button 
                  onClick={() => openProjectForm(null)} // Open for creation
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                >
                   <Plus size={18} />
                   <span>새 프로젝트 등록</span>
                </button>
             </div>
             <div className="flex-grow min-h-0">
                <PortfolioGantt 
                   projects={projects} 
                   startDate="2025-01-01" 
                   onProjectClick={handleProjectSelect}
                   onEditClick={(project) => openProjectForm(project)}
                />
             </div>
           </div>
        ) : (
           /* --- DETAIL VIEW (Existing Layout) --- */
           selectedProject && (
            <>
              {/* Back Button */}
              <div className="mb-4">
                <button 
                  onClick={handleBackToDashboard}
                  className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  목록으로 돌아가기
                </button>
              </div>

              {/* Milestone Scoreboard */}
              <MilestoneBoard project={selectedProject} />

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
                      startDate={selectedProject.startDate} 
                      totalDays={670} 
                      onTaskClick={handleTaskClick}
                      documentCounts={docCounts}
                      milestones={selectedProject.milestones}
                    />
                  </div>
                </div>

                {/* Right: AI Panel Placeholder (Visual spacer for the fixed panel) */}
                <div className={`transition-all duration-300 ease-in-out ${isInsightOpen ? 'w-96' : 'w-0'}`}></div>
              </div>

              {/* Fixed Sidebar */}
              <InsightPanel 
                project={selectedProject} 
                tasks={tasks} 
                isOpen={isInsightOpen} 
                onClose={() => setIsInsightOpen(false)} 
              />
            </>
           )
        )}
      </main>

      {/* Document Modal */}
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={refreshDocCounts}
          onTaskUpdate={handleTaskUpdate}
        />
      )}

      {/* Project Form Modal (Create / Edit) */}
      <ProjectEditModal 
        project={projectToEdit}
        isOpen={isProjectFormOpen}
        onClose={() => setIsProjectFormOpen(false)}
        onSave={handleProjectSave}
        onDelete={handleProjectDelete}
      />
    </div>
  );
};

export default App;
