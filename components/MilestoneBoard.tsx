import React from 'react';
import { ProjectInfo } from '../types';
import { Flag } from 'lucide-react';

interface Props {
  project: ProjectInfo;
}

interface MilestoneCardProps {
  title: string;
  date: string;
  color?: string;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({ title, date, color }) => {
  const bgColor = color || 'bg-blue-500';
  const textColor = bgColor.replace('bg-', 'text-');
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex items-center space-x-4 min-w-[160px]`}>
      <div className={`p-2 rounded-full ${bgColor} bg-opacity-10 ${textColor}`}>
        <Flag size={20} className={textColor} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-semibold uppercase truncate max-w-[120px]" title={title}>{title}</p>
        <p className="text-sm font-bold text-gray-800">{date}</p>
      </div>
    </div>
  );
};

export const MilestoneBoard: React.FC<Props> = ({ project }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {project.milestones.map((ms, idx) => (
        <MilestoneCard 
          key={idx}
          title={ms.name} 
          date={ms.date} 
          color={ms.color} 
        />
      ))}
    </div>
  );
};