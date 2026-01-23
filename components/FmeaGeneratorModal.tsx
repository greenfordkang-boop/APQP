import React, { useState, useEffect, useRef } from 'react';
import { FmeaRow, Task, FmeaData, FmeaRevision } from '../types';
import { generateProcessFMEAStream } from '../services/geminiService';
import { X, Sparkles, Save, Calculator, AlertTriangle, FileSpreadsheet, Download, HardDrive, Target, History, Clock, User } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  projectName: string;
  initialData?: FmeaData; // Changed from FmeaRow[] to FmeaData
  onSaveToSystem: (data: FmeaData, fileName: string) => void; 
}

export const FmeaGeneratorModal: React.FC<Props> = ({ isOpen, onClose, task, projectName, initialData, onSaveToSystem }) => {
  const [existingRows, setExistingRows] = useState<FmeaRow[]>([]);
  const [streamingRows, setStreamingRows] = useState<FmeaRow[]>([]); // New rows being generated
  
  const [history, setHistory] = useState<FmeaRevision[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false); 
  const [processContext, setProcessContext] = useState(''); 

  const tableBottomRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setExistingRows(initialData.rows || []);
        setHistory(initialData.history || []);
      } else {
        setExistingRows([]);
        setHistory([]);
      }
      setStreamingRows([]);
      setProcessContext('');
      setShowHistory(false);
    }
  }, [isOpen, initialData]);

  // Auto-scroll to bottom when rows increase
  useEffect(() => {
    if (streaming && tableBottomRef.current) {
      tableBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingRows, streaming]);

  const handleGenerate = async () => {
    setLoading(true);
    setStreaming(true);
    setStreamingRows([]); 
    
    // NOTE: We do NOT clear existingRows anymore. We append.
    
    await generateProcessFMEAStream(
        task.name, 
        projectName, 
        (updatedStreamingRows) => {
            setStreamingRows(updatedStreamingRows);
        },
        processContext 
    );
    
    setStreaming(false);
    setLoading(false);
    
    // Merge streaming rows into existing rows upon completion
    setExistingRows(prev => [...prev, ...streamingRows]);
    setStreamingRows([]); // Clear stream buffer
    setProcessContext(''); // Reset context for next input
  };

  const handleCellChange = (isStreamingRow: boolean, index: number, field: keyof FmeaRow, value: string | number) => {
    // We only allow editing of existing rows or completed streaming rows.
    // But since we merge them on completion, user is likely editing 'existingRows'.
    // If user tries to edit while streaming, it might be jumpy, but let's handle 'existingRows'.
    
    if (isStreamingRow) return; // Disable editing of currently streaming rows for safety

    const newRows = [...existingRows];
    
    if (field === 'severity' || field === 'occurrence' || field === 'detection') {
      const numVal = parseInt(value as string) || 0;
      const clamped = Math.min(10, Math.max(1, numVal));
      newRows[index] = { ...newRows[index], [field]: clamped };
      newRows[index].rpn = (newRows[index].severity) * (newRows[index].occurrence) * (newRows[index].detection);
    } else {
      newRows[index] = { ...newRows[index], [field]: value };
    }
    setExistingRows(newRows);
  };

  const generateFileName = (ext: string) => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const safeTaskName = task.name.replace(/\s+/g, '_');
    return `PFMEA_${safeTaskName}_${dateStr}.${ext}`;
  };

  const handleSystemSave = () => {
    if (existingRows.length === 0) return;
    
    // Create new revision
    const newVersion = history.length + 1;
    const newRevision: FmeaRevision = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        version: newVersion,
        changeLog: processContext 
           ? `'${processContext}' 공정 분석 추가` 
           : (existingRows.length > (initialData?.rows?.length || 0)) ? 'AI 자동 분석 항목 추가' : '사용자 수동 편집',
        editor: 'Manager'
    };

    const newData: FmeaData = {
        rows: existingRows,
        history: [newRevision, ...history] // Newest first
    };

    const fileName = generateFileName('json'); 
    onSaveToSystem(newData, fileName);
    onClose();
  };

  const handleCsvDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (existingRows.length === 0) return;

    const headers = ['공정단계', '고장모드', '고장영향', '심각도(S)', '고장원인', '발생도(O)', '관리계획', '검출도(D)', 'RPN', '권고조치'];
    const csvContent = [
      headers.join(','),
      ...existingRows.map(row => [
        `"${String(row.processStep || '').replace(/"/g, '""')}"`,
        `"${String(row.failureMode || '').replace(/"/g, '""')}"`,
        `"${String(row.failureEffect || '').replace(/"/g, '""')}"`,
        row.severity,
        `"${String(row.failureCause || '').replace(/"/g, '""')}"`,
        row.occurrence,
        `"${String(row.controls || '').replace(/"/g, '""')}"`,
        row.detection,
        row.rpn,
        `"${String(row.action || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const csvWithBOM = '\uFEFF' + csvContent;
    const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', generateFileName('csv'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Combined rows for display (Existing + Streaming)
  const displayRows = [...existingRows, ...streamingRows];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[85vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-blue-600 rounded-lg">
               <FileSpreadsheet size={24} />
             </div>
             <div>
               <h2 className="text-lg font-bold">PFMEA 자동 생성 및 편집기</h2>
               <p className="text-xs text-slate-400">IATF 16949 / AIAG-VDA 표준 양식 • {task.name}</p>
             </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-gray-50 border-b border-gray-200 p-3 flex justify-between items-center flex-wrap gap-3">
           {/* Left: Process Input */}
           <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm flex-grow max-w-lg">
              <div className="px-3 py-2 bg-gray-50 border-r border-gray-200 text-gray-500 flex items-center">
                 <Target size={16} className="mr-2" />
                 <span className="text-xs font-bold uppercase whitespace-nowrap">분석 대상 공정</span>
              </div>
              <input 
                type="text" 
                value={processContext}
                onChange={(e) => setProcessContext(e.target.value)}
                placeholder="예: SMT, 조립, 포장 (추가할 공정 입력)"
                className="flex-grow px-3 py-2 text-sm outline-none text-gray-700 placeholder-gray-400"
                onKeyDown={(e) => {
                   if (e.key === 'Enter' && !loading && !streaming) handleGenerate();
                }}
              />
           </div>

           {/* Right: Actions */}
           <div className="flex space-x-3 items-center">
              <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      showHistory ? 'bg-slate-200 text-slate-800' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  title="변경 이력"
              >
                  <History size={16} />
                  {history.length > 0 && <span className="bg-slate-500 text-white text-[10px] px-1.5 rounded-full">{history.length}</span>}
              </button>

              <div className="w-px h-6 bg-gray-300 mx-1"></div>

              {(loading || streaming) ? (
                 <button 
                  disabled
                  className="flex items-center space-x-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap"
                 >
                   <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                   <span>작성 중...</span>
                 </button>
              ) : (
                 <button 
                  onClick={handleGenerate}
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm whitespace-nowrap"
                 >
                   <Sparkles size={16} className="text-yellow-300" />
                   <span>AI 생성 (추가)</span>
                 </button>
              )}

              {displayRows.length > 0 && !loading && !streaming && (
                <>
                  <button 
                    onClick={handleSystemSave}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm whitespace-nowrap"
                  >
                    <Save size={16} />
                    <span>저장 (v{(history.length + 1)})</span>
                  </button>
                  
                  <button 
                    onClick={handleCsvDownload}
                    className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm whitespace-nowrap"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">CSV</span>
                  </button>
                </>
              )}
           </div>
        </div>

        <div className="flex flex-grow overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-grow overflow-auto bg-gray-100 p-4 relative">
            
            {/* Empty State */}
            {!loading && !streaming && displayRows.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-xl bg-white/50">
                    <FileSpreadsheet size={64} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium text-gray-600">데이터가 없습니다.</p>
                    <p className="text-sm mb-4">공정명을 입력하고 'AI 생성'을 눌러 분석을 시작하세요.</p>
                </div>
            )}

            {/* Table */}
            {displayRows.length > 0 && (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden animate-fade-in mb-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse min-w-[1400px]">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 border-r w-48">공정 단계 / 기능</th>
                                <th className="px-4 py-3 border-r w-48 bg-red-50/50">잠재적 고장 모드</th>
                                <th className="px-4 py-3 border-r w-56 bg-red-50/50">고장 영향</th>
                                <th className="px-2 py-3 border-r w-16 text-center bg-red-50/50">S</th>
                                <th className="px-4 py-3 border-r w-56 bg-orange-50/50">잠재적 원인</th>
                                <th className="px-2 py-3 border-r w-16 text-center bg-orange-50/50">O</th>
                                <th className="px-4 py-3 border-r w-56 bg-blue-50/50">현행 관리 (예방/검출)</th>
                                <th className="px-2 py-3 border-r w-16 text-center bg-blue-50/50">D</th>
                                <th className="px-2 py-3 border-r w-20 text-center font-bold bg-slate-100">RPN</th>
                                <th className="px-4 py-3">권고 조치 사항</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayRows.map((row, idx) => {
                                const isStreaming = idx >= existingRows.length;
                                return (
                                <tr key={idx} className={`border-b border-gray-100 hover:bg-gray-50 ${isStreaming ? 'bg-indigo-50/30' : ''}`}>
                                    <td className="p-2 border-r">
                                    <textarea 
                                        value={row.processStep}
                                        onChange={(e) => handleCellChange(isStreaming, idx, 'processStep', e.target.value)}
                                        className="w-full h-full bg-transparent border-none focus:ring-0 resize-none text-sm font-semibold text-indigo-900"
                                        rows={2}
                                        disabled={isStreaming}
                                    />
                                    </td>
                                    <td className="p-2 border-r bg-red-50/10">
                                    <textarea 
                                        value={row.failureMode}
                                        onChange={(e) => handleCellChange(isStreaming, idx, 'failureMode', e.target.value)}
                                        className="w-full h-full bg-transparent border-none focus:ring-0 resize-none text-sm"
                                        rows={2}
                                        disabled={isStreaming}
                                    />
                                    </td>
                                    <td className="p-2 border-r bg-red-50/10">
                                    <textarea 
                                        value={row.failureEffect}
                                        onChange={(e) => handleCellChange(isStreaming, idx, 'failureEffect', e.target.value)}
                                        className="w-full h-full bg-transparent border-none focus:ring-0 resize-none text-sm"
                                        rows={2}
                                        disabled={isStreaming}
                                    />
                                    </td>
                                    <td className="p-2 border-r text-center bg-red-50/10">
                                    <input 
                                        type="number" 
                                        min="1" max="10"
                                        value={row.severity}
                                        onChange={(e) => handleCellChange(isStreaming, idx, 'severity', e.target.value)}
                                        className="w-full text-center bg-transparent border border-gray-200 rounded focus:border-blue-500"
                                        disabled={isStreaming}
                                    />
                                    </td>
                                    <td className="p-2 border-r bg-orange-50/10">
                                    <textarea 
                                        value={row.failureCause}
                                        onChange={(e) => handleCellChange(isStreaming, idx, 'failureCause', e.target.value)}
                                        className="w-full h-full bg-transparent border-none focus:ring-0 resize-none text-sm"
                                        rows={2}
                                        disabled={isStreaming}
                                    />
                                    </td>
                                    <td className="p-2 border-r text-center bg-orange-50/10">
                                    <input 
                                        type="number" 
                                        min="1" max="10"
                                        value={row.occurrence}
                                        onChange={(e) => handleCellChange(isStreaming, idx, 'occurrence', e.target.value)}
                                        className="w-full text-center bg-transparent border border-gray-200 rounded focus:border-blue-500"
                                        disabled={isStreaming}
                                    />
                                    </td>
                                    <td className="p-2 border-r bg-blue-50/10">
                                    <textarea 
                                        value={row.controls}
                                        onChange={(e) => handleCellChange(isStreaming, idx, 'controls', e.target.value)}
                                        className="w-full h-full bg-transparent border-none focus:ring-0 resize-none text-sm"
                                        rows={2}
                                        disabled={isStreaming}
                                    />
                                    </td>
                                    <td className="p-2 border-r text-center bg-blue-50/10">
                                    <input 
                                        type="number" 
                                        min="1" max="10"
                                        value={row.detection}
                                        onChange={(e) => handleCellChange(isStreaming, idx, 'detection', e.target.value)}
                                        className="w-full text-center bg-transparent border border-gray-200 rounded focus:border-blue-500"
                                        disabled={isStreaming}
                                    />
                                    </td>
                                    <td className={`p-2 border-r text-center font-bold ${
                                    row.rpn >= 100 ? 'text-red-600 bg-red-50' : 
                                    row.rpn >= 60 ? 'text-orange-600 bg-orange-50' : 'text-gray-700 bg-slate-50'
                                    }`}>
                                    {row.rpn}
                                    </td>
                                    <td className="p-2">
                                    <textarea 
                                        value={row.action}
                                        onChange={(e) => handleCellChange(isStreaming, idx, 'action', e.target.value)}
                                        className="w-full h-full bg-transparent border-none focus:ring-0 resize-none text-sm"
                                        rows={2}
                                        disabled={isStreaming}
                                    />
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                        </table>
                    </div>
                    {/* Streaming Indicator within Table */}
                    {streaming && (
                        <div className="bg-indigo-50 p-2 text-center text-xs text-indigo-600 font-medium animate-pulse border-t border-indigo-100">
                        AI가 공정 데이터를 작성 중입니다... (새로운 행 추가 중)
                        </div>
                    )}
                </div>
            )}
            <div ref={tableBottomRef} />
            </div>

            {/* Revision History Sidebar */}
            <div className={`border-l border-gray-200 bg-white transition-all duration-300 ease-in-out flex flex-col ${showHistory ? 'w-80' : 'w-0'}`}>
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-700 flex items-center">
                        <History size={16} className="mr-2" />
                        변경 이력 (History)
                    </h3>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {history.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">저장된 이력이 없습니다.</p>
                    ) : (
                        history.map((rev) => (
                            <div key={rev.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">v{rev.version}</span>
                                    <span className="text-[10px] text-gray-400">{new Date(rev.date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-gray-800 font-medium mb-1">{rev.changeLog}</p>
                                <div className="flex items-center text-[10px] text-gray-400">
                                    <User size={10} className="mr-1" />
                                    <span>{rev.editor || 'User'}</span>
                                    <Clock size={10} className="ml-2 mr-1" />
                                    <span>{new Date(rev.date).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
        
        {/* Footer Info */}
        <div className="bg-white border-t border-gray-200 p-2 px-4 text-xs text-gray-500 flex justify-between items-center flex-shrink-0 z-10">
           <div className="flex items-center space-x-2">
             <AlertTriangle size={12} className="text-orange-500" />
             <span>AI 생성 결과는 반드시 엔지니어의 검토가 필요합니다.</span>
           </div>
           <div>
             IATF 16949:2016 Clause 8.3.5.2 Manufacturing process design output
           </div>
        </div>
      </div>
    </div>
  );
};