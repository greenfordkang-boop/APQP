
import { GoogleGenAI, Type } from "@google/genai";
import { Task, ProjectInfo, AIAnalysisResult, FmeaRow } from '../types';

export const analyzeProjectRisks = async (project: ProjectInfo, tasks: Task[]): Promise<AIAnalysisResult> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      console.warn('Gemini API key not configured. Using fallback response.');
      return {
        riskLevel: 'Medium',
        summary: "AI 서비스를 사용하려면 .env 파일에 VITE_GEMINI_API_KEY를 설정하세요.",
        recommendations: ["API 키 설정 필요", "환경변수 확인 요망"],
        iatfClauseReference: "N/A"
      };
    }

    const ai = new GoogleGenAI({ apiKey });

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

export const generateProcessFMEA = async (taskName: string, projectName: string, processContext?: string): Promise<FmeaRow[]> => {
  // Backward compatibility wrapper using the stream logic but waiting for completion
  return new Promise<FmeaRow[]>((resolve) => {
    let finalRows: FmeaRow[] = [];
    generateProcessFMEAStream(taskName, projectName, (rows) => {
        finalRows = rows;
    }, processContext).then(() => resolve(finalRows));
  });
};

// Streaming Version for faster UX
export const generateProcessFMEAStream = async (
  taskName: string, 
  projectName: string,
  onUpdate: (rows: FmeaRow[]) => void,
  processContext?: string // Optional: specific process step to focus on
): Promise<void> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct Prompt based on whether user provided specific process context
    let specificInstruction = '';
    let targetFields = '';

    if (processContext && processContext.trim().length > 0) {
      specificInstruction = `
        FOCUS ONLY ON THE PROCESS STEP: "${processContext}".
        Generate 3 distinct failure modes specifically for "${processContext}".
        The 'processStep' field in the output must be "${processContext}" (or specific sub-steps of it).
      `;
    } else {
      specificInstruction = `
        Create a generic Process FMEA (PFMEA) for the task: "${taskName}".
        Generate 3 most important failure modes for this task.
      `;
    }

    const prompt = `
      You are an IATF 16949 Quality Engineer.
      Project: "${projectName}".
      
      ${specificInstruction}
      
      CRITICAL INSTRUCTIONS:
      1. Generate EXACTLY 3 rows.
      2. Response must be a raw JSON ARRAY.
      3. Language: KOREAN (Hangul).
      4. Auto-calculate RPN (Severity * Occurrence * Detection).
      
      Fields required: processStep, failureMode, failureEffect, severity(1-10), failureCause, occurrence(1-10), controls, detection(1-10), action.
    `;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              processStep: { type: Type.STRING },
              failureMode: { type: Type.STRING },
              failureEffect: { type: Type.STRING },
              severity: { type: Type.INTEGER },
              failureCause: { type: Type.STRING },
              occurrence: { type: Type.INTEGER },
              controls: { type: Type.STRING },
              detection: { type: Type.INTEGER },
              action: { type: Type.STRING }
            }
          }
        }
      }
    });

    let fullText = '';
    
    for await (const chunk of responseStream) {
      fullText += chunk.text;
      
      try {
        // Robust cleaning: remove markdown blocks if present (```json ... ```)
        // Also remove any text before the first '['
        let cleanText = fullText.replace(/```json/g, '').replace(/```/g, '');
        const openBracketIndex = cleanText.indexOf('[');
        
        if (openBracketIndex !== -1) {
            cleanText = cleanText.substring(openBracketIndex);
            
            // Find the last closing brace '}' that might end an object
            const lastCloseBraceIndex = cleanText.lastIndexOf('}');
            
            if (lastCloseBraceIndex !== -1) {
                 // Try to parse the valid sub-section as a complete array
                 // We construct: [ ...found_objects... ]
                 // By taking the substring up to the last '}' and appending ']'
                 // This handles the case where the stream is in the middle of an object or comma
                 const potentialJson = cleanText.substring(0, lastCloseBraceIndex + 1) + ']';
                 
                 const parsed = JSON.parse(potentialJson);
                 if (Array.isArray(parsed)) {
                     // Calculate RPN on the fly
                     const rows = parsed.map((r: any) => ({
                        ...r,
                        severity: r.severity || 0,
                        occurrence: r.occurrence || 0,
                        detection: r.detection || 0,
                        rpn: (r.severity || 0) * (r.occurrence || 0) * (r.detection || 0)
                     }));
                     onUpdate(rows);
                 }
            }
        }
      } catch (e) {
        // Ignore parsing errors for partial content. 
        // We expect errors while the JSON is incomplete.
      }
    }
  } catch (error) {
    console.error("Gemini FMEA Stream Failed:", error);
  }
};
