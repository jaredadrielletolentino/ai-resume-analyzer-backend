import dotenv from "dotenv";
dotenv.config();

// Validate required env vars
const requiredEnvVars = ["GEMINI_API_KEY", "MONGO_URI"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  mongoUri: process.env.MONGO_URI,
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
};