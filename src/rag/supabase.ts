/**
 * supabase.ts
 * Manages connections and operations with Supabase Vector (pgvector).
 */

// Polyfill WebSocket for Node.js environments (< Node 22) to prevent Supabase Realtime client instantiation errors
if (typeof globalThis !== "undefined" && !globalThis.WebSocket) {
  (globalThis as any).WebSocket = class {};
}

import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are not set. Check your .env.local file."
  );
}

// Singleton Supabase Client
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface DocumentChunk {
  content: string;
  metadata: {
    filename: string;
    chunkId: number;
    source: string;
    pageNumber: number | null;
  };
  embedding: number[];
}

/**
 * Upserts a batch of document chunks with their embeddings into Supabase.
 */
export async function upsertChunks(chunks: DocumentChunk[]): Promise<void> {
  const payload = chunks.map((chunk) => ({
    content: chunk.content,
    metadata: chunk.metadata,
    embedding: chunk.embedding,
  }));

  const { error } = await supabaseClient
    .from("legal_document_chunks")
    .upsert(payload);

  if (error) {
    throw new Error(`Failed to upsert chunks into Supabase: ${error.message}`);
  }
}

/**
 * Clears all legal document chunks from the table to allow a full re-index.
 */
export async function clearAllChunks(): Promise<void> {
  // PostgREST requires a filter to run a delete request.
  // Using a filter on 'id' being not null deletes all records.
  const { error } = await supabaseClient
    .from("legal_document_chunks")
    .delete()
    .neq("content", "");

  if (error) {
    throw new Error(`Failed to clear chunks from Supabase: ${error.message}`);
  }
}

/**
 * Calls the `match_legal_documents` RPC function in PostgreSQL
 * to search for nearest matching legal document chunks using cosine similarity.
 */
export async function matchChunks(
  queryEmbedding: number[],
  matchThreshold: number,
  matchCount: number
): Promise<
  Array<{
    id: string;
    content: string;
    metadata: {
      filename: string;
      chunkId: number;
      source: string;
      pageNumber: number | null;
    };
    similarity: number;
  }>
> {
  const { data, error } = await supabaseClient.rpc("match_legal_documents", {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    throw new Error(`Failed to match chunks via Supabase RPC: ${error.message}`);
  }

  return data || [];
}
