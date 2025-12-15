import { GoogleGenAI, Type } from "@google/genai";
import { RiskAnalysisResult } from "../types";

// NOTE: In a production environment, never expose keys on the client.
// However, this demo assumes a secured environment or local usage.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const GeminiService = {
  // 1. Chat (Multi-mode)
  async chat(message: string, history: string[], mode: 'FAST' | 'THINKING') {
    const modelName = mode === 'THINKING' ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
    
    // Config for thinking mode if selected
    const config: any = {};
    if (mode === 'THINKING') {
      config.thinkingConfig = { thinkingBudget: 8192 }; // allocate budget for reasoning
    }

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
            { role: 'user', parts: [{ text: `Context:\n${history.join('\n')}\n\nUser Question: ${message}` }] }
        ],
        config: config
      });
      return response.text || "No response generated.";
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return "Error contacting Rekama Intelligence Node.";
    }
  },

  // 2. Risk Analysis (Updated for ISO 27002:2022)
  async analyzeRisk(content: string): Promise<RiskAnalysisResult> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following text for Information Governance risks. 
        Detect PII, determine ISO classification (Public, Internal, Confidential, Restricted), and assign a risk score (0-100).
        Crucially, map findings to specific ISO/IEC 27002:2022 controls (e.g., '5.12 Classification of information', '8.2 Privileged access rights').
        
        Text: "${content.substring(0, 5000)}..."`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              classification: { type: Type.STRING, enum: ['Public', 'Internal', 'Confidential', 'Restricted'] },
              pii_detected: { type: Type.ARRAY, items: { type: Type.STRING } },
              reasoning: { type: Type.STRING },
              iso_controls: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of relevant ISO 27002 controls involved" }
            },
            required: ['score', 'classification', 'pii_detected', 'reasoning', 'iso_controls']
          }
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("Empty response");
      return JSON.parse(text) as RiskAnalysisResult;
    } catch (error) {
      console.error("Risk Analysis Error:", error);
      return {
        score: 0,
        classification: 'Internal' as any,
        pii_detected: [],
        reasoning: "Analysis failed due to API error.",
        iso_controls: []
      };
    }
  },

  // 3. Policy Drafter
  async draftPolicy(description: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Draft a formal enterprise security policy based on this description: "${description}".
        Return the policy in a structured JSON format suitable for a policy engine.
        Includes fields: policy_name, effective_date, scope, rules (array), enforcement.`,
        config: {
           responseMimeType: "application/json"
        }
      });
      return response.text || "{}";
    } catch (error) {
      console.error("Policy Drafter Error:", error);
      return JSON.stringify({ error: "Failed to draft policy" });
    }
  },
  
  // 4. Policy Comparison
  async comparePolicies(policy1: string, policy2: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Compare the following two policies for an Information Governance expert. 
        Identify conflicts, coverage gaps, and stricter rules.
        
        Policy A:
        ${policy1}

        Policy B:
        ${policy2}
        
        Provide a side-by-side comparison summary in Markdown.`,
      });
      return response.text || "Comparison failed.";
    } catch (error) {
       console.error("Policy Comparison Error", error);
       return "Error comparing policies.";
    }
  },

  // 5. Anomaly Detection (Audit Logs)
  async analyzeLogs(logs: string): Promise<string> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Review these audit logs for security anomalies (e.g., mass exports, failed logins, off-hour access).
        Logs: ${logs}
        
        Provide a concise executive summary of threats found in Markdown format.`,
      });
      return response.text || "No anomalies detected.";
    } catch (error) {
      return "Unable to process logs.";
    }
  },

  // 6. Generate Embedding (for mock vector store)
  async embedText(text: string): Promise<number[]> {
     try {
         const result = await ai.models.embedContent({
             model: 'text-embedding-004',
             content: { parts: [{ text }] }
         });
         return result.embedding?.values || [];
     } catch (e) {
         console.warn("Embedding failed, returning mock vector");
         return new Array(768).fill(0).map(() => Math.random());
     }
  }
};