import { GoogleGenAI } from "@google/genai";
import { FeedbackCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeFeedback(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following student feedback for NU Laguna university. 
      Feedback: "${text}"
      
      Provide your analysis in JSON format with the following keys:
      - "sentiment": either "positive", "neutral", or "negative"
      - "summary": a very brief 1-sentence summary of the core issue.`,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
}

export async function summarizeResults(feedbacks: any[]) {
  try {
    const context = feedbacks.map(f => `Liked: ${f.likedMost}, Improvements: ${f.improvements}`).join('\n');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize the overall feedback for NU Laguna from these submissions: \n${context}\n\nProvide 3 key takeaways and a sentiment overall.`,
    });
    return response.text;
  } catch (error) {
    return "Could not generate summary at this time.";
  }
}

export async function generateAdminResponse(feedbackDescription: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `As an administrator at NU Laguna, draft a professional and empathetic response to this student feedback: "${feedbackDescription}". Focus on acknowledging the concern and stating that it will be looked into. Keep it under 2 sentences.`,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Response Error:", error);
    return "Thank you for your feedback. We have received it and will look into this matter.";
  }
}
