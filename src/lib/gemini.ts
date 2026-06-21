import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Carrega .env.local se disponível
dotenv.config({ path: ".env.local" });

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
}

export const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});
