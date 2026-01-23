
import React, { useState, useEffect } from 'react';
import { TaskDocument } from '../types';
import { X, Download, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface Props {
  file: TaskDocument;
  isOpen: boolean;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<Props> = ({ file, isOpen, onClose }) => {
  const [content, setContent] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'text' | 'other'>('other');

  useEffect(() => {
    if (isOpen && file) {
      determineTypeAndContent();
    }
  }, [isOpen, file]);

  const determineTypeAndContent = async () => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const mime = file.type || '';

    // 1. Images
    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      setFileType('image');
      setContent(file.url);
      return;
    }

    // 2. PDF
    if (mime === 'application/pdf' || ext === 'pdf') {
      setFileType('pdf');
      setContent(file.url);
      return;
    }

    // 3. Text / CSV / JSON
    if (mime.startsWith('text/') || mime.includes('json') || ['txt', 'csv', 'json', 'md'].includes(ext)) {
      setFileType('text');
      // If it's a Data URL, decode it
      if (file.url.startsWith('data:')) {
        try {
          const base64 = file.url.split(',')[1];
          // Handle UTF-8 decoding properly
          const decoded = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          setContent(decoded);
        } catch (e) {
          setContent("텍스트 미리보기를 불러올 수 없습니다.");
        }
      } else {
        // If it's a real URL (Supabase), try to fetch it
        try {
            const res = await fetch(file.url);
            const text = await res.text();
            setContent(text);
        } catch (e) {
            setContent("파일 내용을 불러오는데 실패했습니다 (CORS 또는 접근 권한 문제일 수 있습니다).");
        }
      }
      return;
    }

    setFileType('other');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 text-white p-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-gray-700 rounded-lg">
                {fileType === 'image' ? <ImageIcon size={20} /> : <FileText size={20} />}
            </div>
            <div>
               <h3 className="font-bold truncate max-w-md">{file.name}</h3>
               <p className="text-xs text-gray-400">
                 {file.size ? (file.size / 1024).toFixed(1) + ' KB' : 'Size unknown'}
               </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
             <a 
               href={file.url} 
               download={file.name}
               className="flex items-center space-x-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors"
             >
               <Download size={16} />
               <span>다운로드</span>
             </a>
             <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
               <X size={24} />
             </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-grow bg-gray-100 flex items-center justify-center overflow-auto relative p-4">
           {fileType === 'image' && content && (
             <img src={content} alt="Preview" className="max-w-full max-h-full object-contain shadow-lg" />
           )}

           {fileType === 'pdf' && content && (
             <iframe 
               src={content} 
               className="w-full h-full rounded-lg shadow-sm bg-white" 
               title="PDF Preview"
             />
           )}

           {fileType === 'text' && content && (
             <div className="w-full h-full bg-white p-8 rounded-lg shadow-sm overflow-auto">
                <pre className="text-xs sm:text-sm font-mono whitespace-pre-wrap text-gray-700">{content}</pre>
             </div>
           )}

           {fileType === 'other' && (
             <div className="text-center p-10 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <AlertCircle size={32} className="text-gray-400" />
                </div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">미리보기를 지원하지 않는 형식입니다.</h4>
                <p className="text-gray-500 mb-6">파일을 다운로드하여 내용을 확인해주세요.</p>
                <a 
                   href={file.url} 
                   download={file.name}
                   className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                >
                   <Download size={18} />
                   <span>파일 다운로드</span>
                </a>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
