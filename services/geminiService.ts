import { GoogleGenAI, Type } from "@google/genai";
import { MissionBriefing } from "../types";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMissionBriefing = async (): Promise<MissionBriefing> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate a cool, arcade-style mission briefing for a sci-fi plane shooter game.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "The name of the mission, e.g., 'Operation Red Sky'" },
            objective: { type: Type.STRING, description: "One sentence objective, e.g., 'Destroy the incoming asteroid fleet.'" },
            pilotCallsign: { type: Type.STRING, description: "A cool callsign for the player, e.g., 'Viper One'" },
            theme: { type: Type.STRING, enum: ['scifi', 'modern', 'retro'], description: "The visual theme vibe of the mission text" }
          },
          required: ["name", "objective", "pilotCallsign", "theme"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as MissionBriefing;
  } catch (error) {
    console.error("Failed to generate mission:", error);
    // Fallback if API fails
    return {
      name: "Operation: Fallback",
      objective: "Defend the sector from unknown hostiles.",
      pilotCallsign: "Rookie",
      theme: "modern"
    };
  }
};
