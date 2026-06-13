/**
 * embeddings.ts
 * Generates text embeddings using Google's text-embedding-004 model
 * via the Gemini generative AI SDK.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAvailableKeys } from "./keys";

// gemini-embedding-001 produces 3072-dimensional embeddings
const EMBEDDING_MODEL = "gemini-embedding-001";

/**
 * Generates an embedding vector for a single piece of text.
 * @param text - The text to embed.
 * @returns A float array representing the semantic embedding.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const keys = getAvailableKeys();
  if (keys.length === 0) {
    throw new Error(
      "No valid GEMINI_API_KEY or GOOGLE_API_KEY found in environment variables."
    );
  }

  let lastError: any = null;

  for (let i = 0; i < keys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(keys[i]);
      const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (err: any) {
      lastError = err;
      console.warn(
        `[Embeddings] Key #${i + 1} failed (Length: ${keys[i].length}): ${err.message}. Trying next API key...`
      );
    }
  }

  throw new Error(
    `All available Gemini API keys failed for embedding generation. Last error: ${lastError?.message}`
  );
}

/**
 * Generates embeddings for multiple texts in batches to respect API rate limits.
 * @param texts - Array of texts to embed.
 * @param batchSize - Number of texts to process concurrently.
 * @returns Array of embedding vectors.
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  batchSize = 5
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await Promise.all(
      batch.map((text) => generateEmbedding(text))
    );
    embeddings.push(...batchEmbeddings);

    // Small delay to avoid hitting API rate limits
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return embeddings;
}
