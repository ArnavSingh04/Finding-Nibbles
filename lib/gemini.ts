import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

/**
 * Lazily construct a Gemini generative model using a Google AI Studio API key
 * (the `GEMINI_API_KEY` env var). This is the API-key product — distinct from
 * Vertex AI, which requires GCP service-account credentials.
 */
let cachedModel: GenerativeModel | null = null;

export function getGeminiModel(): GenerativeModel {
  if (cachedModel) return cachedModel;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY. Get one at https://aistudio.google.com/apikey and add it to .env."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  cachedModel = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || process.env.VERTEX_MODEL || "gemini-2.0-flash",
    generationConfig: {
      temperature: Number(process.env.AI_TEMPERATURE ?? 0.8),
      topP: 0.95,
      maxOutputTokens: 320,
    },
  });
  return cachedModel;
}
