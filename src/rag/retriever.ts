/**
 * retriever.ts
 * Handles semantic search against Supabase Vector to retrieve relevant legal document chunks.
 */

import { matchChunks } from "./supabase";
import { generateEmbedding } from "./embeddings";

export interface RetrievedChunk {
  id: string;
  text: string;
  filename: string;
  chunkId: number;
  source: string;
  pageNumber: number | null;
  similarityScore: number;
}

/**
 * Retrieves the top-k most relevant document chunks for a query.
 * @param query - The user's natural language question.
 * @param topK - Number of results to return (default: 5).
 * @param minSimilarity - Minimum similarity threshold (0–1). Chunks below this are filtered out.
 * @returns Sorted array of RetrievedChunk objects.
 */
export async function retrieveRelevantChunks(
  query: string,
  topK = 5,
  minSimilarity = 0.0
): Promise<RetrievedChunk[]> {
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Query Supabase for nearest neighbors
  const results = await matchChunks(queryEmbedding, minSimilarity, topK);

  const chunks: RetrievedChunk[] = results.map((row) => ({
    id: row.id,
    text: row.content,
    filename: row.metadata?.filename ?? "Unknown",
    chunkId: Number(row.metadata?.chunkId ?? 0),
    source: String(row.metadata?.source ?? ""),
    pageNumber: row.metadata?.pageNumber != null ? Number(row.metadata.pageNumber) : null,
    similarityScore: row.similarity,
  }));

  // Sort by similarity descending (best first) just in case
  chunks.sort((a, b) => b.similarityScore - a.similarityScore);

  return chunks;
}
