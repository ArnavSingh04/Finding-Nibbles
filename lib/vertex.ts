import fs from "fs";
import os from "os";
import path from "path";
import { VertexAI } from "@google-cloud/vertexai";

/**
 * Lazily construct a Vertex AI generative model.
 *
 * Credentials resolution (mirrors the old Meteor server startup):
 *  1. GOOGLE_SERVICE_ACCOUNT_JSON — inline JSON, written to a secure temp file.
 *  2. GOOGLE_APPLICATION_CREDENTIALS — path to a key file (used as-is by ADC).
 */
let cachedModel: ReturnType<VertexAI["getGenerativeModel"]> | null = null;

function ensureCredentials(): void {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (inline && !process.env.GOOGLE_APPLICATION_CREDENTIALS?.endsWith(".json-written")) {
    try {
      const parsed = typeof inline === "string" ? inline : JSON.stringify(inline);
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gcp-"));
      const keyPath = path.join(tmpDir, "serviceAccount.json");
      fs.writeFileSync(keyPath, parsed);
      process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
    } catch (err) {
      console.error("Failed to materialise GOOGLE_SERVICE_ACCOUNT_JSON:", err);
    }
  }
}

export function getVertexModel() {
  if (cachedModel) return cachedModel;
  ensureCredentials();

  const project =
    process.env.GOOGLE_CLOUD_PROJECT || process.env.PROJECT_ID || "finding-nibbles-vertex";
  const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.LOCATION || "us-central1";

  const vertexAI = new VertexAI({ project, location });
  cachedModel = vertexAI.getGenerativeModel({
    model: process.env.VERTEX_MODEL || "gemini-2.0-flash-001",
    generationConfig: {
      temperature: Number(process.env.AI_TEMPERATURE ?? 0.8),
      topP: 0.95,
      maxOutputTokens: 320,
    },
  });
  return cachedModel;
}
