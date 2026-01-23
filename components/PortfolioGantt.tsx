import React, { useMemo } from 'react';
import { ProjectInfo } from '../types';
import { getGridPosition, addDays } from '../utils';
import { Flag, ChevronRight, Briefcase, Edit2 } from 'lucide-react';

interface Props {
  projects: ProjectInfo[];
  startDate: string;
  totalDays?: number;
  onProjectClick: (project: ProjectInfo) => void;
  onEditClick: (project: ProjectInfo) => void;
}

export const PortfolioGantt: React.FC<Props> = ({ projects, startDate, totalDays = 730, onProjectClick, onEditClick }) => {
  // Generate timeline headers (Years & Months)
  const timelineData = useMemo(() => {
    const months = [];
    const years: { year: number, colspan: number }[] = [];
    
    const start = new Date(startDate);
    const end = addDays(start, totalDays);
    
    let current = new Date(start);
    current.setDate(1); // Normalize to 1st of month

    while (current < end) {
      const year = current.getFullYear();
      const month = current.getMonth(); // 0-11
      
      months.push({
        label: `${month + 1}`,
        year: year,
        dateObj: new Date(current),
        left: 0,
        width: 0
      });

      const lastYear = years[years.length - 1];
      if (!lastYear || lastYear.year !== year) {
        years.push({ year, colspan: 1 });
      } else {
        lastYear.colspan += 1;
      }

      current.setMonth(current.getMonth() + 1);
    }

    const totalMonths = months.length;
    months.forEach((m, idx) => {
      m.left = (idx / totalMonths) * 100;
      m.width = (1 / totalMonths) * 100;
    });

    return { months, years, totalMonths };
  }, [startDate, totalDays]);

  // Group projects by Client
  const groupedProjects = useMemo(() => {
    const groups: { [key: string]: ProjectInfo[] } = {};
    projects.forEach(p => {
      if (!groups[p.client]) groups[p.client] = [];
      groups[p.client].push(p);
    });
    return groups;
  }, [projects]);

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header Row */}
      <div className="flex flex-col border-b border-gray-200 bg-gray-50 sticky top-0 z-20">
        
        {/* Top: Year Row */}
        <div className="flex border-b border-gray-200 h-8">
           <div className="w-80 flex-shrink-0 p-2 border-r border-gray-200 font-bold text-xs text-gray-600 bg-gray-100 flex items-center">
             고객사 / 프로젝트 개요
           </div>
           <div className="flex-grow relative min-w-[800px]">
             <div className="flex h-full">
               {timelineData.years.map((y, idx) => (
                 <div 
                   key={idx} 
                   className="flex items-center justify-center font-bold text-xs text-gray-700 border-r border-gray-200 bg-gray-100/50"
                   style={{ width: `${(y.colspan / timelineData.totalMonths) * 100}%` }}
                 >
                   {y.year}년
                 </div>
               ))}
             </div>
           </div>
        </div>

        {/* Bottom: Month Row */}
        <div className="flex h-8">
          <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex items-center px-3 text-xs text-gray-500 font-semibold uppercase">
             프로젝트명 & 담당자
          </div>
          <div className="flex-grow relative min-w-[800px]">
             {timelineData.months.map((m, idx) => (
                <div 
                  key={idx} 
                  className="absolute h-full border-r border-gray-200 text-[10px] text-gray-500 flex items-center justify-center font-medium bg-white"
                  style={{ left: `${m.left}%`, width: `${m.width}%` }}
                >
                  {m.label}월
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto overflow-x-auto gantt-scroll flex-grow relative">
        <div className="min-w-[800px + 20rem] relative">
          
          {(Object.entries(groupedProjects) as [string, ProjectInfo[]][]).map(([clientName, clientProjects]) => (
            <div key={clientName} className="border-b border-gray-100 last:border-0">
              {/* Client Group Header */}
              <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 sticky left-0 z-10 w-full border-y border-gray-200 flex items-center">
                <Briefcase size={12} className="mr-2 text-slate-500" />
                {clientName} ({clientProjects.length})
              </div>

              {/* Projects */}
              {clientProjects.map(project => {
                const planPos = getGridPosition(project.startDate, project.endDate, startDate);
                
                const left = (planPos.offsetDays / totalDays) * 100;
                const width = (planPos.durationDays / totalDays) * 100;
                
                // Determine bar color based on status
                const barColor = project.status === 'Delayed' ? 'bg-red-500' :
                                 project.status === 'Critical' ? 'bg-orange-500' :
                                 project.status === 'Completed' ? 'bg-blue-500' : 'bg-emerald-500';

                return (
                  <div 
                    key={project.id} 
                    className="flex hover:bg-blue-50/30 group border-b border-gray-100 last:border-0 h-16 cursor-pointer transition-colors"
                    onClick={() => onProjectClick(project)}
                  >
                    {/* Project Info Column */}
                    <div className="w-80 flex-shrink-0 p-3 border-r border-gray-200 flex flex-col justify-center sticky left-0 bg-white group-hover:bg-blue-50/30 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2 flex-shrink-0"></span>
                            <span className="text-sm font-bold text-gray-800 truncate" title={project.name}>{project.name}</span>
                         </div>
                         {/* Edit Button - Visible on hover */}
                         <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditClick(project);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-all opacity-0 group-hover:opacity-100"
                            title="수정 및 삭제"
                         >
                            <Edit2 size={14} />
                         </button>
                      </div>
                      <div className="flex justify-between items-center mt-1 pl-3.5">
                        <span className="text-xs text-gray-500">{project.partNo}</span>
                        <div className="flex items-center space-x-2">
                           <span className="text-[10px] text-gray-400">{project.manager}</span>
                           <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                             project.status === 'Delayed' ? 'bg-red-100 text-red-600' : 
                             project.status === 'Critical' ? 'bg-orange-100 text-orange-600' :
                             'bg-emerald-100 text-emerald-600'
                           }`}>
                             {project.status}
                           </span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Column */}
                    <div className="flex-grow relative py-4">
                       {/* Grid Lines */}
                       {timelineData.months.map((m, idx) => (
                        <div 
                          key={idx} 
                          className="absolute top-0 bottom-0 border-r border-dashed border-gray-100 -z-10"
                          style={{ left: `${m.left}%` }}
                        />
                      ))}

                      {/* Project Timeline Bar */}
                      <div 
                        className={`absolute h-6 rounded-md shadow-sm ${barColor} top-1/2 -translate-y-1/2 flex items-center px-2 text-white text-xs font-medium overflow-hidden whitespace-nowrap transition-all hover:brightness-110 hover:shadow-md hover:h-7`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                      >
                         <span className="truncate drop-shadow-md">{project.name}</span>
                      </div>
                      
                      {/* Milestones on Timeline */}
                      {project.milestones.map((ms, msIdx) => {
                         const msPos = getGridPosition(startDate, ms.date, startDate); // Calculate offset from start
                         // Re-calculate strictly for point position
                         const start = new Date(startDate);
                         const current = new Date(ms.date);
                         const diff = current.getTime() - start.getTime();
                         const dayDiff = diff / (1000 * 3600 * 24);
                         const msLeft = (dayDiff / totalDays) * 100;

                         if(msLeft < 0 || msLeft > 100) return null;

                         return (
                            <div 
                              key={msIdx}
                              className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center group/ms z-10"
                              style={{ left: `${msLeft}%` }}
                              title={`${ms.name} (${ms.date})`}
                            >
                               <div className={`w-3 h-3 rotate-45 transform border-2 border-white shadow-sm ${ms.color || 'bg-gray-500'}`}></div>
                               <span className="absolute -top-6 text-[9px] font-bold text-gray-600 bg-white/80 px-1 rounded opacity-0 group-hover/ms:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                 {ms.name}
                               </span>
                            </div>
                         )
                      })}

                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};