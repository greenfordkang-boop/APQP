import { GoogleGenAI, Type } from "@google/genai";
import { Task, ProjectInfo, AIAnalysisResult } from '../types';

export const analyzeProjectRisks = async (project: ProjectInfo, tasks: Task[]): Promise<AIAnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Filter only relevant delayed tasks to reduce token count and focus context
    const delayedTasks = tasks.filter(t => t.status === 'Delayed' || (t.actual?.end && t.plan.end && new Date(t.actual.end) > new Date(t.plan.end)));
    
    const context = `
      Project: ${project.name} (${project.partNo})
      Client: ${project.client}
      Milestones:
        ${project.milestones.map(m => `${m.name}: ${m.date}`).join('\n        ')}
      
      Delayed Tasks:
      ${JSON.stringify(delayedTasks.map(t => ({
        name: t.name,
        phase: t.phase,
        planEnd: t.plan.end,
        actualEnd: t.actual?.end
      })))}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are an expert IATF 16949 Lead Auditor and Automotive Project Manager.
        Analyze the provided project status, focusing on the delayed tasks.
        
        Project Context:
        ${context}
        
        Provide a risk assessment strictly following IATF 16949 Clause 8.3 (Design and Development).
        IMPORTANT: Your entire response must be in Korean language.
        
        Return the response in JSON format.
        Schema:
        - riskLevel: "Low", "Medium", "High", or "Critical"
        - summary: A short executive summary of the risk (max 2 sentences) in Korean.
        - recommendations: Array of 3 specific actionable recovery plans (e.g., overtime, parallel processing, escalation) in Korean.
        - iatfClauseReference: Specific sub-clause of 8.3 that is at risk (e.g., "8.3.2.1 Design and development planning").
      `,
      config: {
        systemInstruction: "You are a concise, professional automotive quality expert. You must answer in Korean.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
            summary: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            iatfClauseReference: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      riskLevel: 'Medium',
      summary: "AI 서비스를 사용할 수 없습니다. 지연된 항목에 대해 수동 검토가 필요합니다.",
      recommendations: ["Critical Path 수동 점검 필요", "리소스 할당 재확인 요망"],
      iatfClauseReference: "N/A"
    };
  }
};