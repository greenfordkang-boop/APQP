import React, { useState } from 'react';
import { ProjectInfo, Task, AIAnalysisResult } from '../types';
import { analyzeProjectRisks } from '../services/geminiService';
import { Sparkles, X, AlertTriangle, BookOpen, CheckCircle2, ChevronRight } from 'lucide-react';

interface Props {
  project: ProjectInfo;
  tasks: Task[];
  isOpen: boolean;
  onClose: () => void;
}

const RISK_MAP: Record<string, string> = {
  'Low': '낮음',
  'Medium': '중간',
  'High': '높음',
  'Critical': '심각'
};

export const InsightPanel: React.FC<Props> = ({ project, tasks, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await analyzeProjectRisks(project, tasks);
    setAnalysis(result);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Sparkles size={18} className="text-yellow-300 animate-pulse" />
          <h2 className="font-semibold">Gemini 스마트 인사이트</h2>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-5 space-y-6">
        
        {/* Intro */}
        {!analysis && !loading && (
          <div className="text-center py-10">
            <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-indigo-600" size={32} />
            </div>
            <h3 className="text-gray-800 font-medium mb-2">IATF 16949 리스크 분석</h3>
            <p className="text-gray-500 text-sm mb-6">
              APQP 마일스톤 및 8.3항 요구사항을 기준으로 일정 지연에 대한 AI 분석 보고서를 생성합니다.
            </p>
            <button 
              onClick={handleGenerate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-indigo-200"
            >
              리스크 분석 실행
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 animate-pulse">IATF 표준 데이터베이스 조회 중...</p>
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="space-y-6 animate-fade-in">
            {/* Risk Badge */}
            <div className={`p-4 rounded-lg border flex items-start space-x-3
              ${analysis.riskLevel === 'Critical' ? 'bg-red-50 border-red-200' : 
                analysis.riskLevel === 'High' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
              }`}>
              <AlertTriangle className={`flex-shrink-0 mt-1
                 ${analysis.riskLevel === 'Critical' ? 'text-red-600' : 'text-orange-500'}
              `} size={20} />
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider
                   ${analysis.riskLevel === 'Critical' ? 'text-red-700' : 'text-orange-700'}
                `}>
                  리스크 수준: {RISK_MAP[analysis.riskLevel] || analysis.riskLevel}
                </span>
                <p className="text-sm text-gray-800 mt-1 leading-snug">{analysis.summary}</p>
              </div>
            </div>

            {/* Clause Reference */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-700">
                <BookOpen size={16} />
                <h4 className="text-sm font-bold">IATF 관련 조항</h4>
              </div>
              <div className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-600 border border-gray-200">
                조항 8.3: {analysis.iatfClauseReference}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-700">
                <CheckCircle2 size={16} />
                <h4 className="text-sm font-bold">권장 조치 사항</h4>
              </div>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-600 bg-white p-2 rounded border border-gray-100 shadow-sm">
                    <ChevronRight size={14} className="mt-1 text-indigo-500 flex-shrink-0 mr-1" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

             <button 
              onClick={handleGenerate}
              className="w-full mt-4 text-indigo-600 text-xs hover:underline text-center"
            >
              재분석
            </button>
          </div>
        )}
      </div>
    </div>
  );
};