import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskDocument } from '../types';
import { uploadDocument, getDocuments, deleteDocument } from '../services/documentService';
import { X, FileText, Upload, Trash2, Download, HardDrive } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface Props {
  task: Task | null;
  onClose: () => void;
  onUpdate?: () => void; // Callback to refresh counts in parent
}

export const TaskDetailModal: React.FC<Props> = ({ task, onClose, onUpdate }) => {
  const [documents, setDocuments] = useState<TaskDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      loadDocuments(task.id);
    }
  }, [task]);

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

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 p-5 flex justify-between items-start">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded-full mb-2 inline-block">
              {task.phase}
            </span>
            <h2 className="text-xl font-bold text-gray-800">{task.name}</h2>
            <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
              <span>담당자: {task.assignee}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium 
                ${task.status === 'Delayed' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {task.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-grow">
          
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
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="다운로드/열기"
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
  );
};