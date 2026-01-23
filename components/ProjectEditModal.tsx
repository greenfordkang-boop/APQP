import React, { useState, useEffect } from 'react';
import { ProjectInfo, Milestone } from '../types';
import { X, Save, Plus, Trash2, Calendar, Flag } from 'lucide-react';

interface ProjectEditModalProps {
  project?: ProjectInfo;
  onClose: () => void;
  onSave: (project: ProjectInfo) => void;
  onDelete?: (projectId: number) => void;
}

export const ProjectEditModal: React.FC<ProjectEditModalProps> = ({
  project,
  onClose,
  onSave,
  onDelete
}) => {
  const isEditMode = !!project;

  const [formData, setFormData] = useState<ProjectInfo>({
    id: project?.id,
    name: project?.name || '',
    partNo: project?.partNo || '',
    client: project?.client || '',
    manager: project?.manager || '',
    startDate: project?.startDate || new Date().toISOString().split('T')[0],
    endDate: project?.endDate || '',
    status: project?.status || 'Planning',
    progress: project?.progress || 0,
    milestones: project?.milestones || []
  });

  const handleChange = (field: keyof ProjectInfo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddMilestone = () => {
    const newMilestone: Milestone = {
      name: '',
      date: new Date().toISOString().split('T')[0],
      color: 'bg-blue-500'
    };
    setFormData(prev => ({
      ...prev,
      milestones: [...(prev.milestones || []), newMilestone]
    }));
  };

  const handleUpdateMilestone = (index: number, field: keyof Milestone, value: string) => {
    const updatedMilestones = [...(formData.milestones || [])];
    updatedMilestones[index] = { ...updatedMilestones[index], [field]: value };
    setFormData(prev => ({ ...prev, milestones: updatedMilestones }));
  };

  const handleRemoveMilestone = (index: number) => {
    const updatedMilestones = (formData.milestones || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, milestones: updatedMilestones }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.client) {
      alert('프로젝트명과 고객사는 필수 입력 항목입니다.');
      return;
    }

    onSave(formData);
  };

  const handleDelete = () => {
    if (!project?.id) return;

    if (confirm(`"${project.name}" 프로젝트를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      onDelete?.(project.id);
      onClose();
    }
  };

  const colorOptions = [
    { value: 'bg-blue-500', label: '파랑' },
    { value: 'bg-indigo-500', label: '인디고' },
    { value: 'bg-purple-500', label: '보라' },
    { value: 'bg-pink-500', label: '핑크' },
    { value: 'bg-red-500', label: '빨강' },
    { value: 'bg-orange-500', label: '주황' },
    { value: 'bg-yellow-500', label: '노랑' },
    { value: 'bg-green-500', label: '초록' },
    { value: 'bg-teal-500', label: '청록' },
    { value: 'bg-cyan-500', label: '시안' },
    { value: 'bg-slate-700', label: '슬레이트' },
    { value: 'bg-gray-500', label: '회색' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditMode ? '프로젝트 수정' : '새 프로젝트 등록'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">기본 정보</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">품번 (Part No.)</label>
                <input
                  type="text"
                  value={formData.partNo}
                  onChange={(e) => handleChange('partNo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  고객사 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => handleChange('client', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                <input
                  type="text"
                  value={formData.manager}
                  onChange={(e) => handleChange('manager', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Schedule Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center">
              <Calendar size={16} className="mr-2" />
              일정 정보
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">진척률 (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => handleChange('progress', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center">
                <Flag size={16} className="mr-2" />
                마일스톤
              </h3>
              <button
                type="button"
                onClick={handleAddMilestone}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <Plus size={16} />
                <span>추가</span>
              </button>
            </div>

            {formData.milestones && formData.milestones.length > 0 ? (
              <div className="space-y-2">
                {formData.milestones.map((milestone, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                    <input
                      type="text"
                      placeholder="마일스톤명"
                      value={milestone.name}
                      onChange={(e) => handleUpdateMilestone(index, 'name', e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="date"
                      value={milestone.date}
                      onChange={(e) => handleUpdateMilestone(index, 'date', e.target.value)}
                      className="w-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={milestone.color}
                      onChange={(e) => handleUpdateMilestone(index, 'color', e.target.value)}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {colorOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">마일스톤이 없습니다. 추가 버튼을 클릭하세요.</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            {isEditMode && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} />
                <span>프로젝트 삭제</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save size={16} />
                <span>{isEditMode ? '수정' : '등록'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
