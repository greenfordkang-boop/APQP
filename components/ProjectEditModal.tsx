import React, { useState, useEffect } from 'react';
import { ProjectInfo, Milestone } from '../types';
import { X, Save, Plus, Trash2, Calendar, Flag } from 'lucide-react';

interface Props {
  project?: ProjectInfo | null; // Optional: null means "Create New"
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProject: ProjectInfo) => void;
  onDelete?: (projectId: string) => void;
}

const DEFAULT_PROJECT: ProjectInfo = {
  id: '',
  name: '',
  partNo: '',
  client: '',
  manager: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  status: 'On Track',
  progress: 0,
  milestones: []
};

const COLORS = [
  { label: 'Blue', value: 'bg-blue-500' },
  { label: 'Indigo', value: 'bg-indigo-500' },
  { label: 'Purple', value: 'bg-purple-500' },
  { label: 'Red', value: 'bg-red-600' },
  { label: 'Slate', value: 'bg-slate-700' },
  { label: 'Orange', value: 'bg-orange-500' },
];

export const ProjectEditModal: React.FC<Props> = ({ project, isOpen, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<ProjectInfo>(DEFAULT_PROJECT);
  const isEditMode = !!project;

  useEffect(() => {
    if (isOpen) {
      if (project) {
        setFormData({ ...project });
      } else {
        setFormData({
          ...DEFAULT_PROJECT,
          id: `P-${Date.now()}`, // Temporary ID generation
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
        });
      }
    }
  }, [isOpen, project]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'progress' ? parseInt(value) || 0 : value 
    }));
  };

  // Milestone Handlers
  const handleMilestoneChange = (index: number, field: keyof Milestone, value: string) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    setFormData(prev => ({ ...prev, milestones: newMilestones }));
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { name: '', date: '', color: 'bg-blue-500' }]
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleDelete = () => {
    if (project && onDelete) {
      if (confirm(`'${project.name}' 프로젝트를 정말 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`)) {
        onDelete(project.id);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-800">
            {isEditMode ? '프로젝트 정보 수정' : '신규 프로젝트 등록'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6">
          <form id="projectForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Basic Info Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-4 bg-blue-600 mr-2 rounded-full"></span>
                기본 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">고객사</label>
                  <input
                    type="text"
                    name="client"
                    value={formData.client}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="예: 현대자동차"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">담당자 (PM)</label>
                  <input
                    type="text"
                    name="manager"
                    value={formData.manager}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="예: 홍길동 책임"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">프로젝트명 (품명)</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="예: JG 팝업모니터"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">PART NO</label>
                  <input
                    type="text"
                    name="partNo"
                    value={formData.partNo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="예: ACQ30063301"
                    required
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* 2. Schedule & Status Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                <span className="w-1 h-4 bg-green-600 mr-2 rounded-full"></span>
                일정 및 상태
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">시작일 (SOP - N개월)</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">종료일 (SOP + 3개월)</label>
                  <div className="relative">
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">프로젝트 상태</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="On Track">On Track (정상)</option>
                    <option value="Delayed">Delayed (지연)</option>
                    <option value="Critical">Critical (위험)</option>
                    <option value="Completed">Completed (완료)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">진척률 ({formData.progress}%)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      name="progress"
                      min="0"
                      max="100"
                      value={formData.progress}
                      onChange={handleChange}
                      className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* 3. Milestones Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center">
                  <span className="w-1 h-4 bg-purple-600 mr-2 rounded-full"></span>
                  주요 마일스톤 (Key Events)
                </h3>
                <button
                  type="button"
                  onClick={addMilestone}
                  className="text-xs flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Plus size={14} className="mr-1" />
                  추가
                </button>
              </div>
              
              <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                {formData.milestones.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">등록된 마일스톤이 없습니다.</p>
                )}
                {formData.milestones.map((ms, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-grow grid grid-cols-12 gap-2">
                      <div className="col-span-3">
                        <input
                          type="text"
                          placeholder="이벤트명"
                          value={ms.name}
                          onChange={(e) => handleMilestoneChange(idx, 'name', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="date"
                          value={ms.date}
                          onChange={(e) => handleMilestoneChange(idx, 'date', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="col-span-5">
                         <select
                           value={ms.color}
                           onChange={(e) => handleMilestoneChange(idx, 'color', e.target.value)}
                           className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                         >
                            {COLORS.map(c => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                         </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMilestone(idx)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-between items-center flex-shrink-0">
          <div>
            {isEditMode && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-transparent rounded-lg transition-colors"
              >
                <Trash2 size={16} className="mr-1.5" />
                삭제
              </button>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              form="projectForm"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Save size={16} className="mr-2" />
              {isEditMode ? '변경사항 저장' : '프로젝트 등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};