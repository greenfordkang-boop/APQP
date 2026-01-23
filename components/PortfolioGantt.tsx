import React from 'react';
import { ProjectInfo } from '../types';
import { formatDate } from '../utils';
import { Calendar, TrendingUp, AlertTriangle, CheckCircle2, Clock, Edit2 } from 'lucide-react';

interface PortfolioGanttProps {
  projects: ProjectInfo[];
  onProjectClick: (project: ProjectInfo) => void;
  onProjectEdit: (project: ProjectInfo) => void;
  startDate: string;
  totalDays: number;
}

export const PortfolioGantt: React.FC<PortfolioGanttProps> = ({
  projects,
  onProjectClick,
  onProjectEdit,
  startDate,
  totalDays
}) => {
  const chartStart = new Date(startDate);

  // Group projects by client
  const projectsByClient = projects.reduce((acc, project) => {
    if (!acc[project.client]) {
      acc[project.client] = [];
    }
    acc[project.client].push(project);
    return acc;
  }, {} as Record<string, ProjectInfo[]>);

  const calculatePosition = (dateStr: string) => {
    const date = new Date(dateStr);
    const daysDiff = Math.floor((date.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24));
    return (daysDiff / totalDays) * 100;
  };

  const calculateWidth = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return (duration / totalDays) * 100;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500';
      case 'In Progress': return 'bg-blue-500';
      case 'On Hold': return 'bg-yellow-500';
      case 'Planning': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 size={14} />;
      case 'In Progress': return <TrendingUp size={14} />;
      case 'On Hold': return <AlertTriangle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  // Generate month headers
  const months: { year: number; month: number; startDay: number; days: number }[] = [];
  let currentDate = new Date(chartStart);
  const endDate = new Date(chartStart.getTime() + totalDays * 24 * 60 * 60 * 1000);

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const startDay = monthStart < chartStart ? 0 : Math.floor((monthStart.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24));
    const endDay = monthEnd > endDate ? totalDays : Math.floor((monthEnd.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24));
    const days = endDay - startDay;

    months.push({ year, month, startDay, days });
    currentDate = new Date(year, month + 1, 1);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex border-b border-gray-300 bg-white sticky top-0 z-10">
        <div className="w-80 flex-shrink-0 px-4 py-3 border-r border-gray-300">
          <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
            <Calendar size={16} />
            <span>고객사 / 프로젝트</span>
          </div>
        </div>
        <div className="flex-grow relative">
          {/* Year Headers */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {(() => {
              const yearGroups: { year: number; startIdx: number; totalDays: number }[] = [];
              let currentYear = months[0]?.year;
              let startIdx = 0;
              let totalDaysInYear = 0;

              months.forEach((m, idx) => {
                if (m.year !== currentYear) {
                  yearGroups.push({ year: currentYear, startIdx, totalDays: totalDaysInYear });
                  currentYear = m.year;
                  startIdx = idx;
                  totalDaysInYear = m.days;
                } else {
                  totalDaysInYear += m.days;
                }
              });
              yearGroups.push({ year: currentYear, startIdx, totalDays: totalDaysInYear });

              return yearGroups.map((yg, idx) => (
                <div
                  key={idx}
                  className="border-r border-gray-300 py-1 text-center font-bold text-gray-700"
                  style={{ width: `${(yg.totalDays / totalDays) * 100}%` }}
                >
                  {yg.year}년
                </div>
              ));
            })()}
          </div>
          {/* Month Headers */}
          <div className="flex text-xs border-b border-gray-200">
            {months.map((m, idx) => (
              <div
                key={idx}
                className="border-r border-gray-200 py-2 text-center font-medium text-gray-600"
                style={{ width: `${(m.days / totalDays) * 100}%` }}
              >
                {m.month + 1}월
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Rows */}
      <div className="flex-grow overflow-y-auto">
        {Object.entries(projectsByClient).map(([client, clientProjects]: [string, ProjectInfo[]]) => (
          <div key={client} className="border-b border-gray-200">
            {/* Client Header */}
            <div className="flex bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="w-80 flex-shrink-0 px-4 py-3 border-r border-gray-300">
                <div className="font-semibold text-gray-900">{client}</div>
                <div className="text-xs text-gray-500 mt-1">{clientProjects.length}개 프로젝트</div>
              </div>
              <div className="flex-grow relative bg-gray-50"></div>
            </div>

            {/* Projects */}
            {clientProjects.map((project) => (
              <div
                key={project.id || project.name}
                className="flex hover:bg-blue-50 transition-colors cursor-pointer group"
              >
                <div className="w-80 flex-shrink-0 px-4 py-3 border-r border-gray-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-grow" onClick={() => onProjectClick(project)}>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`}></span>
                        <span className="text-sm font-medium text-gray-900">{project.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                        <div>품번: {project.partNo}</div>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(project.status)}
                          <span>{project.status || 'Planning'}</span>
                          {project.progress !== undefined && (
                            <span className="ml-2">({project.progress}%)</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onProjectEdit(project);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 rounded"
                    >
                      <Edit2 size={14} className="text-blue-600" />
                    </button>
                  </div>
                </div>

                <div className="flex-grow relative h-20 bg-white" onClick={() => onProjectClick(project)}>
                  {/* Grid lines */}
                  {months.map((m, idx) => (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 border-r border-gray-100"
                      style={{ left: `${(m.startDay / totalDays) * 100}%` }}
                    ></div>
                  ))}

                  {/* Project timeline bar */}
                  {project.startDate && project.endDate && (
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 h-8 rounded ${getStatusColor(
                        project.status
                      )} opacity-80 flex items-center justify-center text-white text-xs font-medium shadow-sm`}
                      style={{
                        left: `${calculatePosition(project.startDate)}%`,
                        width: `${calculateWidth(project.startDate, project.endDate)}%`
                      }}
                    >
                      {project.progress !== undefined && `${project.progress}%`}
                    </div>
                  )}

                  {/* Milestone markers */}
                  {project.milestones?.map((milestone, idx) => {
                    const position = calculatePosition(milestone.date);
                    if (position >= 0 && position <= 100) {
                      return (
                        <div
                          key={idx}
                          className="absolute top-0 bottom-0 border-l-2 border-dashed border-purple-400"
                          style={{ left: `${position}%` }}
                          title={`${milestone.name}: ${formatDate(milestone.date)}`}
                        >
                          <div className="absolute -top-1 -left-1 w-2 h-2 bg-purple-500 rounded-full"></div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
