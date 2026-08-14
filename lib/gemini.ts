import { GoogleGenAI } from "@google/genai";

/**
 * Gemini text generation via the current `@google/genai` SDK and a Google AI
 * Studio API key (`GEMINI_API_KEY`). This is the API-key product — not Vertex AI.
 *
 * The default model is `gemini-flash-latest`, an auto-updating alias, so the app
 * keeps working when Google retires specific pinned model versions. Override with
 * GEMINI_MODEL if you need a fixed version.
 */
let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY. Get one at https://aistudio.google.com/apikey and add it to .env."
    );
  }
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

export async function generateAiText(prompt: string): Promise<string> {
  const response = await getClient().models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-flash-latest",
    contents: prompt,
    config: {
      temperature: Number(process.env.AI_TEMPERATURE ?? 0.8),
      topP: 0.95,
      // Generous budget: newer flash models spend tokens on "thinking" before
      // emitting the JSON, so a tight cap can return empty text.
      maxOutputTokens: 1200,
    },
  });
  return response.text ?? "";
}
