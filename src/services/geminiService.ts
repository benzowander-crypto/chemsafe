import { GoogleGenAI, Type } from "@google/genai";

export interface ChemicalAnalysis {
  chemicalName: string;
  molecularFormula: string;
  molarMass: string;
  physicalState: string;
  solubility: string;
  meltingPoint: string;
  boilingPoint: string;
  density: string;
  chemicalProperties: string;
  reactivityStability: string;
  commonUses: string;
  healthHazards: string;
  toxicityLevel: "Low" | "Moderate" | "High" | "Very High";
  toxicityData: string;
  environmentalHazards: string;
  safetyPrecautions: string;
  ghsClassification: string;
  toxicityExplanation: string;
  mainHumanRisk: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getChemicalSuggestions(partialName: string): Promise<string[]> {
  if (!partialName || partialName.length < 2) return [];
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a list of up to 5 real chemical names that start with or are similar to: "${partialName}". Return ONLY a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
    });
    return JSON.parse(response.text || "[]");
  } catch (err) {
    console.error("Suggestions error:", err);
    return [];
  }
}

export async function analyzeChemical(name: string): Promise<ChemicalAnalysis | null> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze the chemical: ${name}. If this is not a real chemical name or cannot be identified, return an object with chemicalName set to "NOT_FOUND". Otherwise, provide detailed safety and material science data.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chemicalName: { type: Type.STRING },
          molecularFormula: { type: Type.STRING },
          molarMass: { type: Type.STRING },
          physicalState: { type: Type.STRING },
          solubility: { type: Type.STRING },
          meltingPoint: { type: Type.STRING },
          boilingPoint: { type: Type.STRING },
          density: { type: Type.STRING },
          chemicalProperties: { type: Type.STRING },
          reactivityStability: { type: Type.STRING },
          commonUses: { type: Type.STRING },
          healthHazards: { type: Type.STRING },
          toxicityLevel: { type: Type.STRING, enum: ["Low", "Moderate", "High", "Very High"] },
          toxicityData: { type: Type.STRING },
          environmentalHazards: { type: Type.STRING },
          safetyPrecautions: { type: Type.STRING },
          ghsClassification: { type: Type.STRING },
          toxicityExplanation: { type: Type.STRING },
          mainHumanRisk: { type: Type.STRING },
        },
        required: [
          "chemicalName", "molecularFormula", "molarMass", "physicalState", 
          "solubility", "meltingPoint", "boilingPoint", "density", 
          "chemicalProperties", "reactivityStability", "commonUses", 
          "healthHazards", "toxicityLevel", "toxicityData", 
          "environmentalHazards", "safetyPrecautions", "ghsClassification",
          "toxicityExplanation", "mainHumanRisk"
        ],
      },
    },
  });

  const data = JSON.parse(response.text || "{}");
  if (data.chemicalName === "NOT_FOUND") return null;
  return data;
}
