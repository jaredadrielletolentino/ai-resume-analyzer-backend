import { GoogleGenerativeAI } from "@google/generative-ai";

// Check if API key exists
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing in .env file");
  throw new Error("GEMINI_API_KEY is required");
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default genAI;