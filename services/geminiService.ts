import { GoogleGenAI, Type } from "@google/genai";
import { MissionBriefing } from "../types";

export const generateMissionBriefing = async (): Promise<MissionBriefing> => {
  try {
    // process 객체 존재 여부 확인 (Vercel/Browser 환경 대응)
    const key = typeof process !== 'undefined' ? process.env.API_KEY : (window as any).process?.env?.API_KEY;
    
    if (!key) {
        console.warn("API Key not found, using fallback mission.");
        throw new Error("API_KEY_MISSING");
    }

    const ai = new GoogleGenAI({ apiKey: key });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a cool, arcade-style mission briefing for a sci-fi plane shooter game.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            objective: { type: Type.STRING },
            pilotCallsign: { type: Type.STRING },
            theme: { type: Type.STRING, enum: ['scifi', 'modern', 'retro'] }
          },
          required: ["name", "objective", "pilotCallsign", "theme"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    
    return JSON.parse(text) as MissionBriefing;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      name: "Operation: Dark Star",
      objective: "Intercept unknown bogies approaching our airspace.",
      pilotCallsign: "Raven",
      theme: "scifi"
    };
  }
};