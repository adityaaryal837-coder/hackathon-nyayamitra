import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

/**
 * Gathers and cleans all Gemini / Google API keys from process.env that start with
 * GEMINI_API_KEY or GOOGLE_API_KEY. Strips quotes and filters duplicates.
 */
export function getAvailableKeys(): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(process.env)) {
    if (
      (key.startsWith("GEMINI_API_KEY") || key.startsWith("GOOGLE_API_KEY")) &&
      value &&
      value.trim() !== "" &&
      value !== "your_gemini_api_key_here"
    ) {
      const cleanKey = value.trim().replace(/^["']|["']$/g, "");
      if (cleanKey && !keys.includes(cleanKey)) {
        keys.push(cleanKey);
      }
    }
  }

  return keys;
}
