import React, { useState, useEffect } from 'react';
import { FmeaData, FmeaRow, Task, ProjectInfo } from '../types';
import { X, Save, Download, Sparkles, Plus, Trash2, History, RefreshCw } from 'lucide-react';

interface FmeaGeneratorModalProps {
  task: Task;
  project: ProjectInfo;
  existingData?: FmeaData;
  onClose: () => void;
  onSave: (data: FmeaData) => void;
}

export const FmeaGeneratorModal: React.FC<FmeaGeneratorModalProps> = ({
  task,
  project,
  existingData,
  onClose,
  onSave
}) => {
  const [fmeaData, setFmeaData] = useState<FmeaData>(
    existingData || {
      rows: [],
      revisions: [],
      version: 1
    }
  );

  const [processStep, setProcessStep] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const calculateRPN = (severity: number, occurrence: number, detection: number): number => {
    return severity * occurrence * detection;
  };

  const handleCellChange = (rowIndex: number, field: keyof FmeaRow, value: any) => {
    const updatedRows = [...fmeaData.rows];
    updatedRows[rowIndex] = { ...updatedRows[rowIndex], [field]: value };

    // Auto-calculate RPN
    if (field === 'severity' || field === 'occurrence' || field === 'detection') {
      const row = updatedRows[rowIndex];
      updatedRows[rowIndex].rpn = calculateRPN(row.severity, row.occurrence, row.detection);
    }

    setFmeaData(prev => ({ ...prev, rows: updatedRows }));
  };

  const handleAddRow = () => {
    const newRow: FmeaRow = {
      id: Date.now().toString(),
      processStep: '',
      function: '',
      failureMode: '',
      effects: '',
      severity: 1,
      causes: '',
      occurrence: 1,
      controls: '',
      detection: 1,
      rpn: 1,
      actions: '',
      responsibility: '',
      targetDate: ''
    };
    setFmeaData(prev => ({ ...prev, rows: [...prev.rows, newRow] }));
  };

  const handleRemoveRow = (index: number) => {
    setFmeaData(prev => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== index)
    }));
  };

  const handleAIGenerate = async () => {
    if (!processStep.trim()) {
      alert('공정 단계를 입력하세요.');
      return;
    }

    setIsGenerating(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey || apiKey === 'your-gemini-api-key-here') {
        alert('Gemini API 키가 설정되지 않았습니다. .env 파일을 확인하세요.');
        setIsGenerating(false);
        return;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?key=${apiKey}&alt=sse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `당신은 IATF 16949 전문가입니다. 다음 공정 단계에 대한 공정 FMEA를 작성하세요.

프로젝트: ${project.name}
고객사: ${project.client}
공정 단계: ${processStep}

정확히 3개의 잠재적 고장 모드를 JSON 배열로 반환하세요.

각 항목의 형식:
{
  "processStep": "공정 단계명",
  "function": "공정 기능",
  "failureMode": "고장 모드",
  "effects": "고장 영향",
  "severity": 1-10 점수,
  "causes": "고장 원인",
  "occurrence": 1-10 점수,
  "controls": "현재 관리 방법",
  "detection": 1-10 점수,
  "rpn": RPN 계산값,
  "actions": "권장 조치사항",
  "responsibility": "담당자",
  "targetDate": "YYYY-MM-DD 형식"
}

심각도(Severity), 발생도(Occurrence), 검출도(Detection)는 1(낮음)~10(높음) 범위로 설정하세요.
응답은 순수 JSON 배열만 반환하세요.`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error('AI 생성 실패');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let partialData: FmeaRow[] = [];

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6);
              const chunk = JSON.parse(jsonStr);
              const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';

              if (text) {
                // Clean markdown and parse JSON
                let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

                // Try to parse partial JSON
                try {
                  // Find the last complete object in the array
                  const arrayStart = cleanText.indexOf('[');
                  if (arrayStart !== -1) {
                    let workingText = cleanText.substring(arrayStart);

                    // Try to parse as-is first
                    try {
                      partialData = JSON.parse(workingText);
                    } catch {
                      // If it fails, try to fix incomplete JSON
                      const lastCloseBrace = workingText.lastIndexOf('}');
                      if (lastCloseBrace !== -1) {
                        workingText = workingText.substring(0, lastCloseBrace + 1) + ']';
                        partialData = JSON.parse(workingText);
                      }
                    }

                    // Update UI with partial data
                    if (partialData.length > 0) {
                      const processedRows = partialData.map(row => ({
                        ...row,
                        id: Date.now().toString() + Math.random(),
                        rpn: calculateRPN(row.severity, row.occurrence, row.detection)
                      }));

                      setFmeaData(prev => ({
                        ...prev,
                        rows: [...prev.rows, ...processedRows.filter(newRow =>
                          !prev.rows.some(existingRow => existingRow.failureMode === newRow.failureMode)
                        )]
                      }));
                    }
                  }
                } catch (e) {
                  // Silent fail for incomplete JSON during streaming
                }
              }
            } catch (e) {
              console.warn('Chunk parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('AI 생성 오류:', error);
      alert('AI 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
      setProcessStep('');
    }
  };

  const handleSave = () => {
    const updatedData: FmeaData = {
      ...fmeaData,
      version: fmeaData.version + 1,
      lastModified: new Date().toISOString(),
      revisions: [
        ...fmeaData.revisions,
        {
          version: fmeaData.version + 1,
          timestamp: new Date().toISOString(),
          user: project.manager || 'User',
          changes: `${fmeaData.rows.length}개 항목 저장`
        }
      ]
    };

    onSave(updatedData);
  };

  const handleExportCSV = () => {
    const headers = [
      '공정단계', '기능', '고장모드', '영향', '심각도(S)', '원인', '발생도(O)',
      '현재관리', '검출도(D)', 'RPN', '조치사항', '담당자', '목표일'
    ];

    const csvRows = [
      headers.join(','),
      ...fmeaData.rows.map(row => [
        row.processStep, row.function, row.failureMode, row.effects, row.severity,
        row.causes, row.occurrence, row.controls, row.detection, row.rpn,
        row.actions, row.responsibility, row.targetDate
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PFMEA_${task.name}_v${fmeaData.version}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">공정 FMEA 생성기</h2>
            <p className="text-sm text-gray-500 mt-1">{task.name} | v{fmeaData.version}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* AI Generation Toolbar */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center space-x-3 flex-shrink-0">
          <Sparkles className="text-blue-600" size={20} />
          <input
            type="text"
            placeholder="공정 단계를 입력하세요 (예: 사출 성형, 조립, 검사...)"
            value={processStep}
            onChange={(e) => setProcessStep(e.target.value)}
            className="flex-grow px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && !isGenerating && handleAIGenerate()}
          />
          <button
            onClick={handleAIGenerate}
            disabled={isGenerating || !processStep.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            <span>{isGenerating ? 'AI 생성 중...' : 'AI 초안 생성'}</span>
          </button>
        </div>

        {/* Table */}
        <div className="flex-grow overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 w-24">공정단계</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 w-32">기능</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 w-32">고장모드</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 w-32">영향</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 w-16">S</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 w-32">원인</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 w-16">O</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 w-32">현재관리</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 w-16">D</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 w-16 bg-red-50">RPN</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 w-32">조치사항</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 w-24">담당자</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 w-28">목표일</th>
                <th className="border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-700 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {fmeaData.rows.map((row, index) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={row.processStep}
                      onChange={(e) => handleCellChange(index, 'processStep', e.target.value)}
                      className="w-full px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <textarea
                      value={row.function}
                      onChange={(e) => handleCellChange(index, 'function', e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <textarea
                      value={row.failureMode}
                      onChange={(e) => handleCellChange(index, 'failureMode', e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <textarea
                      value={row.effects}
                      onChange={(e) => handleCellChange(index, 'effects', e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={row.severity}
                      onChange={(e) => handleCellChange(index, 'severity', parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <textarea
                      value={row.causes}
                      onChange={(e) => handleCellChange(index, 'causes', e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={row.occurrence}
                      onChange={(e) => handleCellChange(index, 'occurrence', parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <textarea
                      value={row.controls}
                      onChange={(e) => handleCellChange(index, 'controls', e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={row.detection}
                      onChange={(e) => handleCellChange(index, 'detection', parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className={`border border-gray-300 p-1 text-center font-bold ${row.rpn > 120 ? 'bg-red-100 text-red-700' : row.rpn > 80 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {row.rpn}
                  </td>
                  <td className="border border-gray-300 p-1">
                    <textarea
                      value={row.actions}
                      onChange={(e) => handleCellChange(index, 'actions', e.target.value)}
                      rows={2}
                      className="w-full px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="text"
                      value={row.responsibility}
                      onChange={(e) => handleCellChange(index, 'responsibility', e.target.value)}
                      className="w-full px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-gray-300 p-1">
                    <input
                      type="date"
                      value={row.targetDate}
                      onChange={(e) => handleCellChange(index, 'targetDate', e.target.value)}
                      className="w-full px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="border border-gray-300 p-1 text-center">
                    <button
                      onClick={() => handleRemoveRow(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {fmeaData.rows.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>데이터가 없습니다. 상단의 AI 초안 생성 또는 수동 추가를 이용하세요.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAddRow}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Plus size={16} />
              <span>수동 추가</span>
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <History size={16} />
              <span>변경 이력 ({fmeaData.revisions.length})</span>
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleExportCSV}
              disabled={fmeaData.rows.length === 0}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              <span>CSV 다운로드</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Save size={16} />
              <span>저장</span>
            </button>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && fmeaData.revisions.length > 0 && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-300 shadow-lg p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">변경 이력</h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {[...fmeaData.revisions].reverse().map((rev, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-md text-sm">
                  <div className="font-medium text-gray-900">v{rev.version}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(rev.timestamp).toLocaleString('ko-KR')}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{rev.user}</div>
                  <div className="text-xs text-gray-700 mt-2">{rev.changes}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
