
import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskDocument, FmeaData, TaskStatus } from '../types';
import { uploadDocument, getDocuments, deleteDocument, saveFmeaDocument, loadFmeaData } from '../services/documentService';
import { X, FileText, Upload, Trash2, Download, HardDrive, Sparkles, Edit, Eye, Save, User, Activity } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { FmeaGeneratorModal } from './FmeaGeneratorModal';
import { FilePreviewModal } from './FilePreviewModal';

interface Props {
  task: Task | null;
  onClose: () => void;
  onUpdate?: () => void; // Callback to refresh counts in parent
  onTaskUpdate?: (taskId: number, updates: { status: TaskStatus, assignee: string }) => void; // New callback for updating task info
}

export const TaskDetailModal: React.FC<Props> = ({ task, onClose, onUpdate, onTaskUpdate }) => {
  const [documents, setDocuments] = useState<TaskDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Edit State
  const [editStatus, setEditStatus] = useState<TaskStatus>('Pending');
  const [editAssignee, setEditAssignee] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Modals
  const [isFmeaModalOpen, setIsFmeaModalOpen] = useState(false);
  const [fmeaInitialData, setFmeaInitialData] = useState<FmeaData | undefined>(undefined);
  const [previewDoc, setPreviewDoc] = useState<TaskDocument | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      loadDocuments(task.id);
      setEditStatus(task.status);
      setEditAssignee(task.assignee);
      setHasChanges(false);
    }
  }, [task]);

  const handleEditChange = (field: 'status' | 'assignee', value: string) => {
    if (field === 'status') setEditStatus(value as TaskStatus);
    if (field === 'assignee') setEditAssignee(value);
    setHasChanges(true);
  };

  const handleSaveChanges = () => {
    if (task && onTaskUpdate) {
      onTaskUpdate(task.id, { status: editStatus, assignee: editAssignee });
      setHasChanges(false);
      // Optional: Show a brief success toast or indicator here
    }
  };

  const loadDocuments = async (taskId: number) => {
    setLoading(true);
    const docs = await getDocuments(taskId);
    setDocuments(docs);
    setLoading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && task) {
      const file = e.target.files[0];
      setUploading(true);
      const newDoc = await uploadDocument(task.id, file);
      if (newDoc) {
        setDocuments(prev => [newDoc, ...prev]);
        onUpdate?.(); // Refresh global counts
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
        onUpdate?.(); // Refresh global counts
      }
    }
  };
  
  const handleFmeaSaveToSystem = async (data: FmeaData, fileName: string) => {
    if (!task) return;
    
    setUploading(true);
    const newDoc = await saveFmeaDocument(task.id, fileName, data);
    if (newDoc) {
      setDocuments(prev => [newDoc, ...prev]);
      onUpdate?.();
    }
    setUploading(false);
  };

  const handleOpenFmea = async (doc: TaskDocument) => {
    // If it's a JSON file (our saved FMEA format), try to load it for Editing
    if (doc.name.endsWith('.json')) {
      setUploading(true); // Re-use uploading state for loading indicator
      const data = await loadFmeaData(doc);
      if (data) {
        setFmeaInitialData(data);
        setIsFmeaModalOpen(true);
      } else {
        alert('데이터를 불러오는데 실패했습니다.');
      }
      setUploading(false);
    }
  };

  const openNewFmea = () => {
    setFmeaInitialData(undefined);
    setIsFmeaModalOpen(true);
  };

  if (!task) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-100 p-5">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded-full mb-2 inline-block">
                    {task.phase}
                  </span>
                  <h2 className="text-xl font-bold text-gray-800">{task.name}</h2>
               </div>
               <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                  <X size={24} className="text-gray-500" />
               </button>
            </div>
            
            {/* Editable Fields */}
            <div className="flex items-center space-x-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
               {/* Assignee Input */}
               <div className="flex-1 flex items-center space-x-2">
                  <User size={16} className="text-gray-400" />
                  <div className="flex-col flex w-full">
                     <label className="text-[10px] text-gray-400 font-semibold">담당자</label>
                     <input 
                        type="text" 
                        value={editAssignee}
                        onChange={(e) => handleEditChange('assignee', e.target.value)}
                        className="text-sm font-medium text-gray-700 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full pb-0.5"
                     />
                  </div>
               </div>
               
               <div className="w-px h-8 bg-gray-200"></div>

               {/* Status Select */}
               <div className="flex-1 flex items-center space-x-2">
                  <Activity size={16} className="text-gray-400" />
                  <div className="flex-col flex w-full">
                     <label className="text-[10px] text-gray-400 font-semibold">진행 상태</label>
                     <select
                        value={editStatus}
                        onChange={(e) => handleEditChange('status', e.target.value)}
                        className={`text-sm font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full pb-0.5 cursor-pointer
                           ${editStatus === 'Delayed' ? 'text-red-600' : 
                             editStatus === 'Completed' ? 'text-blue-600' : 
                             editStatus === 'In Progress' ? 'text-amber-600' : 'text-gray-600'}`}
                     >
                        <option value="Pending">Pending (대기)</option>
                        <option value="In Progress">In Progress (진행중)</option>
                        <option value="Completed">Completed (완료)</option>
                        <option value="Delayed">Delayed (지연)</option>
                     </select>
                  </div>
               </div>

               {/* Save Button */}
               {hasChanges && (
                  <button 
                     onClick={handleSaveChanges}
                     className="ml-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-sm transition-all animate-fade-in"
                     title="변경사항 저장"
                  >
                     <Save size={18} />
                  </button>
               )}
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-grow">
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <HardDrive className="mr-2 text-indigo-500" size={20} />
                관련 문서 (Evidence)
              </h3>
              
              <div className="flex space-x-2">
                 {/* AI FMEA Generator Button - Only visible for '공정 FMEA' tasks */}
                 {task.name.includes('공정 FMEA') && (
                   <button 
                    onClick={openNewFmea}
                    className="flex items-center space-x-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
                    title="IATF 표준 PFMEA 생성"
                   >
                     <Sparkles size={16} className="text-yellow-300" />
                     <span>AI FMEA 생성</span>
                   </button>
                 )}

                 <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Upload size={16} />
                  )}
                  <span>업로드</span>
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
                documents.map((doc) => {
                  const isFmeaJson = doc.name.endsWith('.json');
                  const isCsv = doc.name.includes('.csv');
                  
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow group">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 
                           ${isFmeaJson ? 'bg-violet-50 text-violet-600' : isCsv ? 'bg-green-50 text-green-600' : 'bg-indigo-50 text-indigo-600'}`}>
                           {isFmeaJson ? <Sparkles size={20} /> : <FileText size={20} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate pr-4">{doc.name}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <span>{doc.size ? (doc.size / 1024).toFixed(1) + ' KB' : 'Auto Generated'}</span>
                            <span>•</span>
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                            {isFmeaJson && (
                              <span className="text-violet-600 font-bold bg-violet-50 px-1 rounded">편집 가능</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isFmeaJson ? (
                           <button 
                            onClick={() => handleOpenFmea(doc)}
                            className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                            title="FMEA 수정하기"
                          >
                            <Edit size={18} />
                          </button>
                        ) : (
                          // PREVIEW BUTTON
                          <button 
                            onClick={() => setPreviewDoc(doc)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="미리보기"
                          >
                             <Eye size={18} />
                          </button>
                        )}
                        
                        {/* Download Link */}
                        <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            download={doc.name} // Force download
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="다운로드"
                            onClick={(e) => e.stopPropagation()}
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
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* FMEA Generator Modal */}
      <FmeaGeneratorModal 
        isOpen={isFmeaModalOpen}
        onClose={() => setIsFmeaModalOpen(false)}
        task={task}
        projectName="Demo Project" 
        onSaveToSystem={handleFmeaSaveToSystem}
        initialData={fmeaInitialData}
      />

      {/* File Preview Modal */}
      {previewDoc && (
        <FilePreviewModal 
          file={previewDoc}
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </>
  );
};
