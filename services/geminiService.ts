import { GoogleGenAI, Content, Part, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION, CREATE_LEAD_TOOL, CHECK_STATUS_TOOL, CHECK_EMPLOYEE_TOOL, NAVIGATE_WEBSITE_TOOL, SEND_WHATSAPP_TOOL } from "../constants";

let aiClient: GoogleGenAI | null = null;

const getClient = () => {
  if (!aiClient) {
    if (!process.env.API_KEY) {
        throw new Error("API Key not found");
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
};

interface ChatResponse {
  text: string;
  toolCalls?: { name: string; args: any; id: string }[];
}

export const sendMessageToGemini = async (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string
): Promise<ChatResponse> => {
  const ai = getClient();
  const modelId = "gemini-2.5-flash"; // Text-optimized model

  // Format history for API
  const formattedHistory: Content[] = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }] as Part[]
  }));

  const contents: Content[] = [
    ...formattedHistory,
    { role: "user", parts: [{ text: newMessage }] as Part[] },
  ];

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [CREATE_LEAD_TOOL, CHECK_STATUS_TOOL, CHECK_EMPLOYEE_TOOL, NAVIGATE_WEBSITE_TOOL, SEND_WHATSAPP_TOOL] }],
      },
    });

    const candidate = response.candidates?.[0];
    const toolCalls = candidate?.content?.parts
      ?.filter(part => !!part.functionCall)
      .map(part => ({
        name: part.functionCall!.name,
        args: part.functionCall!.args,
        id: part.functionCall!.id || 'unknown-id'
      }));

    if (toolCalls && toolCalls.length > 0) {
      return { text: response.text || "", toolCalls };
    }

    return { text: response.text || "I'm sorry, I didn't catch that. Could you say it again?" };
  } catch (error) {
    console.error("Gemini Text Chat Error:", error);
    throw error;
  }
};

export const summarizeTranscript = async (transcript: string): Promise<string> => {
  const ai = getClient();
  const modelId = "gemini-2.5-flash";
  
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ role: "user", parts: [{ text: `Please provide a concise, professional summary of this conversation between an AI agent (Neha) and a customer. Focus on the customer's needs, contact details, and any follow-up actions. Keep it under 100 words. Use bullet points if necessary.\n\nTranscript:\n${transcript}` }] }],
    });
    return response.text || "Summary unavailable.";
  } catch (error) {
    console.error("Summarization Error:", error);
    return "Error generating summary.";
  }
};
