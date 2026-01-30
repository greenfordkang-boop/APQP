
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { MOCK_PROJECT, MOCK_TASKS } from './constants';
import { Task, ProjectInfo } from './types';
import { GanttChart } from './components/GanttChart';
import { PortfolioGantt } from './components/PortfolioGantt';
import { MilestoneBoard } from './components/MilestoneBoard';
import { InsightPanel } from './components/InsightPanel';
import { TaskDetailModal } from './components/TaskDetailModal';
import { ProjectEditModal } from './components/ProjectEditModal';
import { AdminCommentList } from './components/AdminCommentList';
import { LoginScreen } from './components/LoginScreen';
import { getTaskDocumentCounts } from './services/documentService';
import {
  checkAuthSession,
  signOut,
  isAdmin,
  getAllUsers,
  approveUser,
  rejectUser,
  ADMIN_EMAIL,
  SECURITY_CONFIG,
  UserProfile
} from './services/supabaseClient';
import { BarChart3, Layout, Settings, Share2, Sparkles, UserCircle, Plus, List, Edit2, MessageSquare, LogOut, Shield } from 'lucide-react';

type ViewMode = 'dashboard' | 'detail' | 'commentList' | 'admin';

const App: React.FC = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Admin state
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Session timer refs
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const [commentListReturnTo, setCommentListReturnTo] = useState<'dashboard' | 'detail'>('detail');

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

  // Session timeout management
  const resetSessionTimer = useCallback(() => {
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    warningTimeoutRef.current = setTimeout(() => {
      alert('세션이 5분 후 만료됩니다. 계속 사용하시려면 화면을 클릭해주세요.');
    }, SECURITY_CONFIG.SESSION_TIMEOUT - SECURITY_CONFIG.WARNING_BEFORE);

    sessionTimeoutRef.current = setTimeout(async () => {
      alert('세션이 만료되었습니다. 다시 로그인해주세요.');
      await handleLogout();
    }, SECURITY_CONFIG.SESSION_TIMEOUT);
  }, []);

  // Activity detection
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => resetSessionTimer();
    SECURITY_CONFIG.ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    resetSessionTimer();

    return () => {
      SECURITY_CONFIG.ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [isAuthenticated, resetSessionTimer]);

  // Check auth session on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsAuthLoading(true);
      try {
        const { user, profile } = await checkAuthSession();
        if (user && profile) {
          if (user.email !== ADMIN_EMAIL && !profile.approved) {
            await signOut();
            setIsAuthenticated(false);
          } else {
            setCurrentUser(user);
            setUserProfile(profile);
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.error('인증 확인 오류:', err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await signOut();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setUserProfile(null);
    }
  };

  // Admin functions
  const handleApproveUser = async (userId: string) => {
    const success = await approveUser(userId);
    if (success) {
      const users = await getAllUsers();
      setAllUsers(users);
      alert('사용자가 승인되었습니다.');
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (window.confirm('이 사용자를 거부하시겠습니까?')) {
      const success = await rejectUser(userId);
      if (success) {
        const users = await getAllUsers();
        setAllUsers(users);
        alert('사용자가 거부되었습니다.');
      }
    }
  };

  // Load users when viewing admin panel
  useEffect(() => {
    if (viewMode === 'admin' && isAdmin(currentUser?.email)) {
      getAllUsers().then(setAllUsers);
    }
  }, [viewMode, currentUser?.email]);

  // Show loading screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Admin Panel View
  if (viewMode === 'admin' && isAdmin(currentUser?.email)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setViewMode('dashboard')}
              className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
            >
              <List className="text-gray-700" size={20} />
            </button>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Shield className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">관리자 패널</h1>
              <p className="text-xs text-gray-500">사용자 승인 관리</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{currentUser?.email}</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="flex-grow p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Pending Users */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-amber-600 mb-4">⏳ 승인 대기 중</h2>
              <div className="space-y-3">
                {allUsers.filter(u => !u.approved && u.is_active).length === 0 ? (
                  <p className="text-gray-500 text-sm">승인 대기 중인 사용자가 없습니다.</p>
                ) : (
                  allUsers.filter(u => !u.approved && u.is_active).map(user => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div>
                        <p className="font-bold text-gray-800">{user.email}</p>
                        <p className="text-sm text-gray-500">가입: {user.created_at ? new Date(user.created_at).toLocaleString('ko-KR') : '-'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveUser(user.id)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleRejectUser(user.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                          거부
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Approved Users */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-emerald-600 mb-4">✓ 승인된 사용자</h2>
              <div className="space-y-3">
                {allUsers.filter(u => u.approved).map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-bold text-gray-800">
                        {user.email}
                        {user.email === ADMIN_EMAIL && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">관리자</span>}
                      </p>
                      <p className="text-sm text-gray-500">
                        마지막 로그인: {user.last_login ? new Date(user.last_login).toLocaleString('ko-KR') : '없음'}
                      </p>
                    </div>
                    {user.email !== ADMIN_EMAIL && (
                      <button
                        onClick={() => handleRejectUser(user.id)}
                        className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-medium hover:bg-red-100 hover:text-red-600 transition-colors"
                      >
                        비활성화
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 담당자 의견 목록 (관리자)
  if (viewMode === 'commentList') {
    return (
      <AdminCommentList
        projects={projects}
        tasks={tasks}
        onBack={() => setViewMode(commentListReturnTo)}
      />
    );
  }

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

            <button
              onClick={() => { setCommentListReturnTo('dashboard'); setViewMode('commentList'); }}
              className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium border bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 hover:border-amber-400 transition-colors"
            >
              <MessageSquare size={16} />
              <span>담당자 의견 목록</span>
            </button>

            <div className="h-8 w-px bg-gray-200 mx-2"></div>

            {isAdmin(currentUser?.email) && (
              <button
                onClick={() => setViewMode('admin')}
                className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium border bg-indigo-50 border-indigo-300 text-indigo-800 hover:bg-indigo-100 transition-colors"
              >
                <Shield size={16} />
                <span>관리자</span>
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
                <p className="text-sm font-medium text-gray-700">{currentUser?.email?.split('@')[0] || '사용자'}</p>
                <p className="text-xs text-gray-400">{currentUser?.email}</p>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors ml-2">
                <LogOut size={20} />
              </button>
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
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">개발계획서</h1>
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

          <button
            onClick={() => { setCommentListReturnTo('detail'); setViewMode('commentList'); }}
            className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium border bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 hover:border-amber-400 transition-colors"
          >
            <MessageSquare size={16} />
            <span>담당자 의견 목록</span>
          </button>

          <div className="h-8 w-px bg-gray-200 mx-2"></div>

          {isAdmin(currentUser?.email) && (
            <button
              onClick={() => setViewMode('admin')}
              className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium border bg-indigo-50 border-indigo-300 text-indigo-800 hover:bg-indigo-100 transition-colors"
            >
              <Shield size={16} />
              <span>관리자</span>
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
              <p className="text-sm font-medium text-gray-700">{currentUser?.email?.split('@')[0] || displayProject.manager || '사용자'}</p>
              <p className="text-xs text-gray-400">{currentUser?.email}</p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors ml-2">
              <LogOut size={20} />
            </button>
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
