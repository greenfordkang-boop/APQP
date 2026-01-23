import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskDocument, ProjectInfo, FmeaData } from '../types';
import { uploadDocument, getDocuments, deleteDocument } from '../services/documentService';
import { X, FileText, Upload, Trash2, Download, HardDrive, Sparkles, Eye, Save, Edit3 } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { FmeaGeneratorModal } from './FmeaGeneratorModal';
import { FilePreviewModal } from './FilePreviewModal';

interface Props {
  task: Task;
  project: ProjectInfo;
  onClose: () => void;
  onUpdate?: (task: Task) => void;
}

export const TaskDetailModal: React.FC<Props> = ({ task, project, onClose, onUpdate }) => {
  const [documents, setDocuments] = useState<TaskDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showFmeaModal, setShowFmeaModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<TaskDocument | null>(null);
  const [existingFmeaData, setExistingFmeaData] = useState<FmeaData | undefined>();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task>(task);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments(task.id);
  }, [task]);

  const loadDocuments = async (taskId: number) => {
    setLoading(true);
    const docs = await getDocuments(taskId);
    setDocuments(docs);

    // Check for existing FMEA data
    const fmeaDoc = docs.find(d => d.name.includes('FMEA') && d.name.endsWith('.json'));
    if (fmeaDoc && fmeaDoc.url) {
      try {
        if (fmeaDoc.url.startsWith('data:')) {
          // Parse base64 data URL
          const base64Data = fmeaDoc.url.split(',')[1];
          const jsonStr = atob(base64Data);
          const data = JSON.parse(jsonStr);
          setExistingFmeaData(Array.isArray(data) ? { rows: data, revisions: [], version: 1 } : data);
        } else {
          // Fetch from URL
          const response = await fetch(fmeaDoc.url);
          const data = await response.json();
          setExistingFmeaData(Array.isArray(data) ? { rows: data, revisions: [], version: 1 } : data);
        }
      } catch (error) {
        console.error('Failed to load FMEA data:', error);
      }
    }

    setLoading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploading(true);
      const newDoc = await uploadDocument(task.id, file);
      if (newDoc) {
        setDocuments(prev => [newDoc, ...prev]);
        onUpdate?.(task);
      }
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string | number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      const success = await deleteDocument(docId);
      if (success) {
        setDocuments(prev => prev.filter(d => String(d.id) !== String(docId)));
        onUpdate?.(task);
      }
    }
  };

  const handleSaveFmea = async (fmeaData: FmeaData) => {
    // Save FMEA data as JSON file
    const jsonString = JSON.stringify(fmeaData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], `FMEA_${task.name}_v${fmeaData.version}.json`, { type: 'application/json' });

    // Delete old FMEA file if exists
    const oldFmeaDoc = documents.find(d => d.name.includes('FMEA') && d.name.endsWith('.json'));
    if (oldFmeaDoc) {
      await deleteDocument(oldFmeaDoc.id);
      setDocuments(prev => prev.filter(d => d.id !== oldFmeaDoc.id));
    }

    // Upload new FMEA file
    const newDoc = await uploadDocument(task.id, file);
    if (newDoc) {
      setDocuments(prev => [newDoc, ...prev]);
      setExistingFmeaData(fmeaData);
      onUpdate?.(task);
    }

    setShowFmeaModal(false);
  };

  const handleSaveTask = () => {
    onUpdate?.(editedTask);
    setIsEditing(false);
  };

  const isFmeaTask = task.name.toLowerCase().includes('fmea') || task.name.toLowerCase().includes('공정');

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-100 p-5 flex justify-between items-start">
            <div className="flex-grow">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded-full mb-2 inline-block">
                {task.phase}
              </span>
              <h2 className="text-xl font-bold text-gray-800 mb-3">{task.name}</h2>

              {/* Editable Fields */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 w-20">담당자:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedTask.assignee}
                      onChange={(e) => setEditedTask(prev => ({ ...prev, assignee: e.target.value }))}
                      className="flex-grow px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-800">{task.assignee}</span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 w-20">상태:</span>
                  {isEditing ? (
                    <select
                      value={editedTask.status}
                      onChange={(e) => setEditedTask(prev => ({ ...prev, status: e.target.value as any }))}
                      className="flex-grow px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                      ${task.status === 'Delayed' ? 'bg-red-100 text-red-700' :
                        task.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'}`}>
                      {task.status}
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <button
                    onClick={handleSaveTask}
                    className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Save size={14} />
                    <span>저장</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 font-medium"
                  >
                    <Edit3 size={14} />
                    <span>수정</span>
                  </button>
                )}
              </div>
            </div>

            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0">
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-grow">
            {/* FMEA Generator Button (only for FMEA tasks) */}
            {isFmeaTask && (
              <div className="mb-4">
                <button
                  onClick={() => setShowFmeaModal(true)}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition-all shadow-md"
                >
                  <Sparkles size={18} />
                  <span>AI PFMEA 생성기 {existingFmeaData ? `(v${existingFmeaData.version})` : ''}</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <HardDrive className="mr-2 text-indigo-500" size={20} />
                관련 문서 (Evidence)
              </h3>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Upload size={16} />
                  )}
                  <span>문서 업로드</span>
                </button>
              </div>
            </div>

            {!isSupabaseConfigured() && (
              <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 flex items-start">
                <span className="mr-2 text-lg">⚠️</span>
                <div>
                  <span className="font-bold">데모 모드 실행 중:</span> Supabase API 키가 설정되지 않았습니다.
                  파일은 브라우저의 임시 저장소(LocalStorage)에 기록되며 실제 서버에는 저장되지 않습니다.
                </div>
              </div>
            )}

            {/* File List */}
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-10 text-gray-400">문서 목록을 불러오는 중...</div>
              ) : documents.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl py-12 flex flex-col items-center justify-center text-gray-400">
                  <FileText size={48} className="mb-3 opacity-20" />
                  <p>등록된 문서가 없습니다.</p>
                  <p className="text-sm">우측 상단 버튼을 눌러 파일을 등록하세요.</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow group">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 text-indigo-600">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate pr-4">{doc.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <span>{doc.size ? (doc.size / 1024).toFixed(1) + ' KB' : 'Unknown Size'}</span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPreviewDocument(doc)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="미리보기"
                      >
                        <Eye size={18} />
                      </button>
                      <a
                        href={doc.url}
                        download={doc.name}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="다운로드"
                      >
                        <Download size={18} />
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FMEA Generator Modal */}
      {showFmeaModal && (
        <FmeaGeneratorModal
          task={task}
          project={project}
          existingData={existingFmeaData}
          onClose={() => setShowFmeaModal(false)}
          onSave={handleSaveFmea}
        />
      )}

      {/* File Preview Modal */}
      {previewDocument && (
        <FilePreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </>
  );
};
