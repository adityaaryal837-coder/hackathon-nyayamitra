import { GoogleGenerativeAI, GenerateContentRequest, GenerateContentResult } from '@google/generative-ai';

// In-memory usage tracking (persists during dev server session)
// For a production app, this would be stored in a database.
export const tokenUsageStats = {
  totalPromptTokens: 0,
  totalCandidateTokens: 0,
  totalTokens: 0,
};

function getAvailableKeys(): string[] {
  const keys: string[] = [];
  
  // Collect any key that starts with GEMINI_API_KEY
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('GEMINI_API_KEY') && value && value !== 'your_gemini_api_key_here') {
      keys.push(value);
    }
  }
  
  // Ensure we have at least something, or return empty
  return keys;
}

export async function generateWithFallback(
  modelName: string,
  request: GenerateContentRequest | string,
  systemInstruction?: string
): Promise<GenerateContentResult> {
  const keys = getAvailableKeys();
  
  if (keys.length === 0) {
    throw new Error('No valid GEMINI_API_KEY found in environment variables.');
  }

  let lastError: any = null;

  for (let i = 0; i < keys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(keys[i]);
      const model = genAI.getGenerativeModel({
        model: modelName,
        ...(systemInstruction ? { systemInstruction } : {})
      });

      console.log(`[GeminiManager] Attempting generation with API Key #${i + 1}`);
      const result = await model.generateContent(request);
      
      // Token Tracking
      const usage = result.response.usageMetadata;
      if (usage) {
        tokenUsageStats.totalPromptTokens += usage.promptTokenCount;
        tokenUsageStats.totalCandidateTokens += usage.candidatesTokenCount;
        tokenUsageStats.totalTokens += usage.totalTokenCount;
        console.log(`[GeminiManager] Token Usage - Prompt: ${usage.promptTokenCount}, Candidate: ${usage.candidatesTokenCount}, Total: ${usage.totalTokenCount}`);
        console.log(`[GeminiManager] Global Token Usage - Total: ${tokenUsageStats.totalTokens}`);
      }

      return result;
    } catch (err: any) {
      lastError = err;
      console.warn(`[GeminiManager] Error with API Key #${i + 1}: ${err.message}`);
      
      // Decide whether to fallback
      // Typically, we fallback on rate limits (429) or quota limits (403/400 with specific messages)
      const message = err.message || '';
      if (
        message.includes('429') || 
        message.includes('Too Many Requests') || 
        message.includes('quota') || 
        message.includes('exhausted')
      ) {
        console.log(`[GeminiManager] Falling back to next API key...`);
        continue;
      } else {
        // For other errors (e.g. invalid prompt, context length), we shouldn't retry
        throw err;
      }
    }
  }

  throw new Error(`All Gemini API keys failed. Last error: ${lastError?.message}`);
}
