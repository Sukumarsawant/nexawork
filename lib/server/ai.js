import { GoogleGenerativeAI } from "@google/generative-ai";
import { withTimeout } from "./api";

const MAX_PROVIDER_OUTPUT_CHARS = 24_000;

export function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: "gemini-1.5-flash" });
}

export async function generateBoundedContent(model, prompt, timeoutMs = 15_000) {
  const result = await withTimeout(model.generateContent(prompt), timeoutMs);
  const text = result?.response?.text?.();
  if (typeof text !== "string" || text.length > MAX_PROVIDER_OUTPUT_CHARS) {
    throw new Error("INVALID_PROVIDER_RESPONSE");
  }
  return text;
}

export function parseProviderJson(text) {
  const candidate = text.match(/\{[\s\S]*\}/)?.[0];
  if (!candidate) return null;
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}
