import { GoogleGenAI, Type } from "@google/genai";

export const parseRoomDescription = async (description: string): Promise<any> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key provided for Gemini");
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this paint project room description and extract dimensions and item counts. 
      Description: "${description}".
      If dimensions aren't explicitly stated, estimate reasonable standards for a residential room (e.g., 12x12x9).
      Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            length: { type: Type.NUMBER },
            width: { type: Type.NUMBER },
            height: { type: Type.NUMBER },
            doors: { type: Type.NUMBER },
            windows: { type: Type.NUMBER },
            notes: { type: Type.STRING }
          },
          required: ["length", "width", "height", "doors", "windows"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const suggestColors = async (roomName: string): Promise<string[]> => {
    if (!process.env.API_KEY) return ["Swiss Coffee", "Chantilly Lace", "Revere Pewter"];
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Suggest 3 trending paint color names for a ${roomName}. Return just a JSON array of strings.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        return JSON.parse(response.text || '[]');
    } catch (e) {
        return ["Classic Gray", "Simply White", "Hale Navy"];
    }
}