import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

function createClient() {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!_client) {
    _client = createClient();
  }
  return _client;
}

/**
 * gemini-2.0-flash — low-latency tasks: resume parsing, Explain Mode
 */
export function getFlashModel() {
  return getClient().getGenerativeModel({ model: "gemini-2.0-flash" });
}

/**
 * gemini-1.5-pro — quality-sensitive tasks: LaTeX generation
 */
export function getProModel() {
  return getClient().getGenerativeModel({ model: "gemini-1.5-pro" });
}
