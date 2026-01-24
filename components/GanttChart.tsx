import React, { useMemo } from 'react';
import { Task, Milestone } from '../types';
import { getGridPosition, getDelayStatus, addDays, formatDate } from '../utils';
import { AlertCircle, Paperclip, Flag } from 'lucide-react';

interface Props {
  tasks: Task[];
  milestones?: Milestone[];
  startDate: string;
  totalDays?: number;
  onTaskClick?: (task: Task) => void;
  documentCounts?: Record<number, number>;
}

export const GanttChart: React.FC<Props> = ({ tasks, milestones = [], startDate, totalDays = 670, onTaskClick, documentCounts = {} }) => {
  const chartStart = new Date(startDate);

  const calculateMilestonePosition = (dateStr: string) => {
    const date = new Date(dateStr);
    const daysDiff = Math.floor((date.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24));
    return (daysDiff / totalDays) * 100;
  };
  // Generate timeline headers (Years & Months)
  const timelineData = useMemo(() => {
    const months = [];
    const years: { year: number, colspan: number }[] = [];
    
    const start = new Date(startDate);
    const end = addDays(start, totalDays);
    
    let current = new Date(start);
    // Align to 1st of the month for cleaner iteration
    current.setDate(1);

    while (current < end) {
      const year = current.getFullYear();
      const month = current.getMonth(); // 0-11
      
      // Add month
      months.push({
        label: `${month + 1}`,
        year: year,
        dateObj: new Date(current),
        left: 0, // Calculated later
        width: 0 // Calculated later
      });

      // Handle Year grouping
      const lastYear = years[years.length - 1];
      if (!lastYear || lastYear.year !== year) {
        years.push({ year, colspan: 1 });
      } else {
        lastYear.colspan += 1;
      }

      // Next month
      current.setMonth(current.getMonth() + 1);
    }

    // Calculate percentages
    const totalMonths = months.length;
    months.forEach((m, idx) => {
      m.left = (idx / totalMonths) * 100;
      m.width = (1 / totalMonths) * 100;
    });

    return { months, years, totalMonths };
  }, [startDate, totalDays]);

  // Group tasks by Phase
  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: Task[] } = {};
    tasks.forEach(t => {
      if (!groups[t.phase]) groups[t.phase] = [];
      groups[t.phase].push(t);
    });
    return groups;
  }, [tasks]);

  // Calculate milestone positions
  const milestoneLines = useMemo(() => {
    if (!milestones) return [];
    const start = new Date(startDate);

    return milestones.map(ms => {
      const msDate = new Date(ms.date);
      const diffTime = msDate.getTime() - start.getTime();
      const days = diffTime / (1000 * 3600 * 24);
      const left = (days / totalDays) * 100;

      // Convert bg-color to border/text color roughly
      const colorClass = ms.color ? ms.color.replace('bg-', 'border-').replace('500', '400') : 'border-blue-400';
      const textClass = ms.color ? ms.color.replace('bg-', 'text-').replace('500', '600') : 'text-blue-600';
      const bgClass = ms.color ? ms.color.replace('bg-', 'bg-').replace('500', '50') : 'bg-blue-50';

      return { ...ms, left, colorClass, textClass, bgClass };
    }).filter(ms => ms.left >= 0 && ms.left <= 100);
  }, [milestones, startDate, totalDays]);

  // Calculate today line position
  const todayLinePosition = useMemo(() => {
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - start.getTime();
    const days = diffTime / (1000 * 3600 * 24);
    const left = (days / totalDays) * 100;

    // Only show if today is within the chart range
    if (left >= 0 && left <= 100) {
      return left;
    }
    return null;
  }, [startDate, totalDays]);

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden flex flex-col h-full">
      {/* Header Row */}
      <div className="flex flex-col border-b border-gray-200 bg-gray-50 sticky top-0 z-20">
        
        {/* Top: Year Row + Task Title Header */}
        <div className="flex border-b border-gray-200 h-8">
           <div className="w-64 flex-shrink-0 p-2 border-r border-gray-200 font-bold text-xs text-gray-600 bg-gray-100 flex items-center">
             프로젝트 일정표
           </div>
           <div className="flex-grow relative min-w-[800px]">
             <div className="flex h-full">
               {timelineData.years.map((y, idx) => (
                 <div 
                   key={idx} 
                   className="flex items-center justify-center font-bold text-xs text-gray-700 border-r border-gray-200 bg-yellow-100/50"
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
          <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex items-center px-3 text-xs text-gray-500 font-semibold uppercase">
             APQP 단계 / 태스크
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
        <div className="min-w-[800px + 16rem] relative"> {/* Ensure horizontal scroll if tight */}
          
          {/* Milestone Vertical Lines Overlay (Pointer events none to allow clicking tasks underneath) */}
          <div className="absolute inset-0 pointer-events-none z-10 pl-64 h-full">
             <div className="relative w-full h-full">
                {milestoneLines.map((ms, idx) => (
                  <div
                    key={idx}
                    className={`absolute top-0 bottom-0 border-l-2 border-dashed opacity-60 flex flex-col items-center ${ms.colorClass}`}
                    style={{ left: `${ms.left}%` }}
                  >
                     {/* Milestone Label Badge */}
                     <div className={`mt-2 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm whitespace-nowrap z-20 flex items-center space-x-1 ${ms.bgClass} ${ms.textClass} border ${ms.colorClass} border-solid`}>
                        <Flag size={8} className="fill-current" />
                        <span>{ms.name}</span>
                     </div>
                  </div>
                ))}

                {/* Today Line */}
                {todayLinePosition !== null && (
                  <div
                    className="absolute top-0 bottom-0 border-l-2 border-red-500 opacity-80 flex flex-col items-center"
                    style={{ left: `${todayLinePosition}%` }}
                  >
                     <div className="mt-2 px-2 py-0.5 rounded text-[10px] font-bold shadow-md whitespace-nowrap z-20 bg-red-500 text-white">
                        오늘
                     </div>
                  </div>
                )}
             </div>
          </div>

          {Object.entries(groupedTasks).map(([phaseName, phaseTasks]: [string, Task[]]) => (
            <div key={phaseName} className="border-b border-gray-100 last:border-0 relative z-0">
              {/* Phase Header */}
              <div className="bg-blue-50/50 px-4 py-1.5 text-xs font-bold text-blue-800 sticky left-0 z-10 w-full border-y border-blue-100">
                {phaseName}
              </div>

              {/* Tasks */}
              {phaseTasks.map(task => {
                const planPos = getGridPosition(task.plan.start, task.plan.end, startDate);
                const actualPos = task.actual 
                  ? getGridPosition(task.actual.start, task.actual.end, startDate) 
                  : null;
                
                const isDelayed = getDelayStatus(task.plan.end, task.actual?.end);

                // Calculate CSS Width percentages relative to TOTAL DAYS
                const planLeft = (planPos.offsetDays / totalDays) * 100;
                const planWidth = (planPos.durationDays / totalDays) * 100;

                const actualLeft = actualPos ? (actualPos.offsetDays / totalDays) * 100 : 0;
                const actualWidth = actualPos ? (actualPos.durationDays / totalDays) * 100 : 0;
                
                const hasDocs = (documentCounts[task.id] || 0) > 0;

                return (
                  <div 
                    key={task.id} 
                    className="flex hover:bg-gray-50 group border-b border-gray-100 last:border-0 h-14 cursor-pointer transition-colors"
                    onClick={() => onTaskClick?.(task)}
                  >
                    {/* Task Info Column */}
                    <div className="w-64 flex-shrink-0 p-3 border-r border-gray-200 flex flex-col justify-center sticky left-0 bg-white group-hover:bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 truncate mr-2 group-hover:text-blue-600 transition-colors" title={task.name}>{task.name}</span>
                        {isDelayed === 'delayed' && (
                           <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <span className="text-[10px] text-gray-400">{task.assignee}</span>
                        <div className="flex items-center space-x-2">
                           {/* Paperclip Icon for Documents */}
                           {hasDocs ? (
                              <div className="flex items-center space-x-0.5 bg-blue-50 px-1 py-0.5 rounded text-blue-600" title="문서 첨부됨">
                                <Paperclip size={10} />
                                <span className="text-[9px] font-bold">{documentCounts[task.id]}</span>
                              </div>
                           ) : (
                              <Paperclip size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                           )}
                           
                           <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                             task.status === 'Delayed' ? 'bg-red-100 text-red-600' : 
                             task.status === 'Completed' ? 'bg-blue-100 text-blue-600' :
                             task.status === 'In Progress' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
                           }`}>
                             {task.status === 'Delayed' ? '지연' : task.status === 'Completed' ? '완료' : task.status === 'In Progress' ? '진행중' : '대기'}
                           </span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Column */}
                    <div className="flex-grow relative py-2 bg-transparent">
                       {/* Grid Lines (Vertical Month Lines) */}
                       {timelineData.months.map((m, idx) => (
                        <div 
                          key={idx} 
                          className="absolute top-0 bottom-0 border-r border-dashed border-gray-100 -z-10"
                          style={{ left: `${m.left}%` }}
                        />
                      ))}

                      {/* Plan Bar (Top) */}
                      <div 
                        className="absolute h-3.5 bg-white border border-gray-400 top-2.5 flex items-center overflow-visible"
                        style={{ left: `${planLeft}%`, width: `${planWidth}%` }}
                        title={`계획: ${task.plan.start} ~ ${task.plan.end}`}
                      >
                         <div className="w-full h-full bg-gray-50 opacity-50"></div>
                         <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-l-[6px] border-l-gray-400 border-b-[5px] border-b-transparent"></div>
                      </div>

                      {/* Actual Bar (Bottom) */}
                      {task.actual ? (
                        <div 
                          className={`absolute h-3.5 top-7 flex items-center transition-all overflow-visible
                            ${isDelayed === 'delayed' ? 'bg-red-600' : 'bg-black'}`
                          }
                          style={{ left: `${actualLeft}%`, width: `${actualWidth}%` }}
                          title={`실적: ${task.actual.start} ~ ${task.actual.end}`}
                        >
                           <div className={`absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-l-[6px] border-b-[5px] border-b-transparent
                              ${isDelayed === 'delayed' ? 'border-l-red-600' : 'border-l-black'}`}>
                           </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Milestone Overlay */}
          {milestones && milestones.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {milestones.map((milestone, idx) => {
                const position = calculateMilestonePosition(milestone.date);
                if (position >= 0 && position <= 100) {
                  return (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 border-l-2 border-dashed border-purple-400"
                      style={{ left: `${position}%` }}
                      title={`${milestone.name}: ${formatDate(milestone.date)}`}
                    >
                      <div className="absolute -top-6 -left-12 flex items-center space-x-1 bg-white px-2 py-1 rounded shadow-sm border border-purple-200 text-xs font-medium text-purple-700">
                        <Flag size={12} />
                        <span>{milestone.name}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};