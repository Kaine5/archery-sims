
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getCommentary = async (
  matchContext: string,
  setResult: string
) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a professional Olympic Archery commentator. 
      The current context is: ${matchContext}. 
      The latest set result is: ${setResult}. 
      Give a brief (1-2 sentences) exciting commentary about this set. 
      Focus on the tension and the skill shown.`,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });
    return response.text || "The crowd holds their breath as the next arrow is nocked.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "What an incredible display of focus and precision!";
  }
};

export const getMatchReview = async (
  userName: string,
  matchHistory: string
) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a short, encouraging summary for the archer ${userName} based on their match performance: ${matchHistory}. Keep it under 50 words.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "A solid performance! Practice makes perfect.";
  } catch (error) {
    return "Great match! Your consistency is improving.";
  }
};
