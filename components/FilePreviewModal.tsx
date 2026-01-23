import React, { useState, useEffect } from 'react';
import { TaskDocument } from '../types';
import { X, Download, FileText, Image as ImageIcon, File } from 'lucide-react';

interface FilePreviewModalProps {
  document: TaskDocument;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ document, onClose }) => {
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadPreview();
  }, [document]);

  const loadPreview = async () => {
    setIsLoading(true);
    setError('');

    try {
      // If URL is a data URI (base64), use it directly
      if (document.url.startsWith('data:')) {
        setPreviewContent(document.url);
        setIsLoading(false);
        return;
      }

      // Otherwise try to fetch (for Supabase URLs)
      if (document.url !== '#') {
        const response = await fetch(document.url);
        if (!response.ok) throw new Error('파일 로드 실패');

        const blob = await response.blob();
        const reader = new FileReader();

        reader.onload = () => {
          setPreviewContent(reader.result as string);
          setIsLoading(false);
        };

        reader.onerror = () => {
          setError('파일 읽기 실패');
          setIsLoading(false);
        };

        // Read based on file type
        if (document.type?.startsWith('text/') || document.type === 'application/json') {
          reader.readAsText(blob);
        } else {
          reader.readAsDataURL(blob);
        }
      } else {
        setError('미리보기를 지원하지 않습니다. (Mock 모드)');
        setIsLoading(false);
      }
    } catch (err) {
      setError('파일 로드 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (document.url === '#' || !document.url) {
      alert('Mock 모드에서는 다운로드할 수 없습니다.');
      return;
    }

    const link = document.createElement('a');
    link.href = previewContent || document.url;
    link.download = document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
          <File size={64} className="text-gray-300" />
          <p className="text-sm">{error}</p>
          {document.url !== '#' && (
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download size={16} />
              <span>다운로드</span>
            </button>
          )}
        </div>
      );
    }

    const fileType = document.type || '';

    // Image files
    if (fileType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img
            src={previewContent}
            alt={document.name}
            className="max-w-full max-h-full object-contain rounded shadow-lg"
          />
        </div>
      );
    }

    // PDF files
    if (fileType === 'application/pdf') {
      return (
        <iframe
          src={previewContent}
          className="w-full h-full border-0"
          title={document.name}
        />
      );
    }

    // Text files (CSV, TXT, JSON)
    if (
      fileType.startsWith('text/') ||
      fileType === 'application/json' ||
      fileType === 'text/csv'
    ) {
      return (
        <div className="h-full overflow-auto p-4 bg-gray-50">
          <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-white p-4 rounded border border-gray-200">
            {previewContent}
          </pre>
        </div>
      );
    }

    // Excel files - show info (can't preview directly in browser)
    if (
      fileType === 'application/vnd.ms-excel' ||
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
          <FileText size={64} className="text-green-500" />
          <p className="text-sm">Excel 파일은 미리보기를 지원하지 않습니다.</p>
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download size={16} />
            <span>다운로드하여 열기</span>
          </button>
        </div>
      );
    }

    // Unsupported file type
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
        <File size={64} className="text-gray-300" />
        <p className="text-sm">이 파일 형식은 미리보기를 지원하지 않습니다.</p>
        <p className="text-xs text-gray-400">{fileType || '알 수 없는 형식'}</p>
        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Download size={16} />
          <span>다운로드</span>
        </button>
      </div>
    );
  };

  const getFileIcon = () => {
    const type = document.type || '';
    if (type.startsWith('image/')) return <ImageIcon size={20} className="text-blue-600" />;
    if (type === 'application/pdf') return <FileText size={20} className="text-red-600" />;
    if (type.startsWith('text/')) return <FileText size={20} className="text-gray-600" />;
    return <File size={20} className="text-gray-600" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3 flex-grow min-w-0">
            {getFileIcon()}
            <div className="flex-grow min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">{document.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatFileSize(document.size)} • {new Date(document.created_at).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
            {!error && document.url !== '#' && (
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Download size={16} />
                <span>다운로드</span>
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-grow overflow-hidden bg-gray-100">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
};
