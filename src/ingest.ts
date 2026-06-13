/**
 * ingest.ts
 * CLI entry point for document ingestion.
 *
 * Usage:
 *   npm run ingest [./documents]
 *
 * Scans the given directory (default: ./documents), extracts text from
 * PDF / DOCX / TXT files, chunks them, generates embeddings, and stores
 * everything in Supabase Vector.
 */

import * as path from "path";
import * as dotenv from "dotenv";
import { clearAllChunks, upsertChunks, DocumentChunk } from "./rag/supabase";
import { generateEmbedding } from "./rag/embeddings";
import {
  scanDocuments,
  extractDocument,
  cleanText,
  chunkText,
  estimatePage,
  c,
  divider,
  SUPPORTED_EXTENSIONS,
} from "./utils";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

// ── Config ───────────────────────────────────────────────────────────────────
const CHUNK_SIZE = 2500;
const CHUNK_OVERLAP = 200;

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const docsDir = process.argv[2] || "./documents";
  const absoluteDir = path.resolve(docsDir);

  console.log();
  console.log(c.bold("  ╔══════════════════════════════════════════╗"));
  console.log(c.bold("  ║  Nepal Legal RAG — Supabase Ingestion    ║"));
  console.log(c.bold("  ╚══════════════════════════════════════════╝"));
  console.log();
  console.log(`  ${c.info("Directory:")} ${absoluteDir}`);
  console.log(
    `  ${c.info("Supported:")} ${SUPPORTED_EXTENSIONS.join(", ")}`
  );
  console.log(`  ${c.info("Chunk size:")} ${CHUNK_SIZE} chars | Overlap: ${CHUNK_OVERLAP} chars`);
  console.log();

  // ── Scan files ──────────────────────────────────────────────────────────
  let files: string[];
  try {
    files = scanDocuments(absoluteDir);
  } catch (err: any) {
    console.error(c.error(`  ✗ Error: ${err.message}`));
    console.error(
      c.warn(
        `  Create a 'documents' folder and add your PDF, DOCX, or TXT files.`
      )
    );
    process.exit(1);
  }

  if (files.length === 0) {
    console.warn(
      c.warn(`  ⚠  No supported documents found in: ${absoluteDir}`)
    );
    console.warn(
      c.warn(`     Add PDF, DOCX, or TXT files and run again.`)
    );
    process.exit(0);
  }

  console.log(`  Found ${c.bold(String(files.length))} document(s) to index.\n`);
  console.log(`  ${c.dim(divider())}`);

  // ── Clear existing Supabase document chunks ────────────────────────────
  process.stdout.write(`\n  Connecting to Supabase...`);
  try {
    await clearAllChunks();
    console.log(c.success(" ✓ (cleared existing database)"));
  } catch (err: any) {
    console.log(c.error(" ✗"));
    console.error(
      c.error(
        `\n  Cannot connect to Supabase. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.`
      )
    );
    console.error(c.warn(`  Error details: ${err.message}`));
    process.exit(1);
  }

  // ── Process each file ──────────────────────────────────────────────────
  let totalChunks = 0;
  let successCount = 0;
  let failCount = 0;

  for (const filePath of files) {
    const filename = path.basename(filePath);
    process.stdout.write(`\n  Processing ${c.info(filename)}...`);

    try {
      // 1. Extract text
      console.log("\n[1] Starting extraction");
      const { text: rawText, pageCount } = await extractDocument(filePath);
      console.log("\n[2] Extraction complete");
      console.log("[3] Raw text length:", rawText.length);

      // 2. Clean text
      const cleaned = cleanText(rawText);
      console.log("[4] Cleaned length:", cleaned.length);


      if (cleaned.length < 50) {
        console.log(c.warn(` ⚠  (empty or unreadable — skipped)`));
        failCount++;
        continue;
      }

      console.log("[4.1] Starting chunking...");


      // 3. Chunk text
      const chunks = chunkText(cleaned, CHUNK_SIZE, CHUNK_OVERLAP);
      console.log("[5] Chunk count:", chunks.length);
      console.log("[5.1] First chunk length:", chunks[0]?.text.length);
      console.log("[5.2] Last chunk length:", chunks[chunks.length - 1]?.text.length);
      process.stdout.write(` ${c.dim(`(${chunks.length} chunks)`)}`);

      // 4. Generate embeddings + upsert in rolling batches of 10
      //    This keeps memory usage flat regardless of document size.
      const UPSERT_BATCH = 10;
      let batchChunks: DocumentChunk[] = [];

      const flushBatch = async () => {
        if (batchChunks.length === 0) return;
        await upsertChunks(batchChunks);
        batchChunks = [];
      };

      for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk.text);
        const pageNum = estimatePage(chunk.charStart, pageCount);

        batchChunks.push({
          content: chunk.text,
          metadata: {
            filename,
            chunkId: chunk.chunkId,
            source: filePath,
            pageNumber: pageNum,
          },
          embedding,
        });

        // Progress dot every 10 chunks
        if (chunk.chunkId % 10 === 0 && chunk.chunkId > 0) {
          process.stdout.write(".");
        }

        // Flush to Supabase every UPSERT_BATCH chunks to free memory
        if (batchChunks.length >= UPSERT_BATCH) {
          await flushBatch();
        }
      }

      // Flush any remaining chunks
      await flushBatch();

      totalChunks += chunks.length;
      successCount++;
      console.log(` ${c.success("✓ indexed")}`);
    } catch (err: any) {
      console.log(c.error(` ✗ FAILED`));
      console.error(c.error(`     Error: ${err.message}`));
      failCount++;
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log();
  console.log(`  ${c.dim(divider())}`);
  console.log();
  console.log(c.bold("  Ingestion Complete"));
  console.log("API KEY:", process.env.GOOGLE_API_KEY?.slice(0, 10));
  console.log(
    `  ${c.success(`✓ ${successCount} document(s) indexed`)}  |  ${failCount > 0 ? c.error(`✗ ${failCount} failed`) : c.dim("0 failed")
    }`
  );
  console.log(`  ${c.info("Total chunks stored:")} ${totalChunks}`);
  console.log();
  console.log(
    `  Run ${c.bold("npm run chat")} to start asking legal questions.`
  );
  console.log();
}

main().catch((err) => {
  console.error(c.error(`\nFatal error: ${err.message}`));
  process.exit(1);
});
