/**
 * chat.ts
 * Interactive CLI chat session for the Nepal Legal RAG Assistant.
 *
 * Usage:
 *   npm run chat
 *
 * Starts a REPL loop that:
 *   1. Accepts a legal question
 *   2. Retrieves relevant chunks from Supabase Vector
 *   3. Checks similarity threshold (refuses if < 0.6)
 *   4. Sends context to Gemini 2.5 Flash
 *   5. Prints the answer with citations
 */

import * as path from "path";
import * as readline from "readline";
import * as dotenv from "dotenv";
import { retrieveRelevantChunks } from "./rag/retriever";
import { generateAnswer } from "./rag/generator";
import { supabaseClient } from "./rag/supabase";
import { c, divider, formatScore } from "./utils";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

// ── Config ───────────────────────────────────────────────────────────────────
const TOP_K = 5;
const MIN_SIMILARITY = 0.6; // Below this → refuse to call Gemini

// ── Helpers ──────────────────────────────────────────────────────────────────
function printBanner() {
  console.log();
  console.log(c.bold("  ╔══════════════════════════════════════════════╗"));
  console.log(c.bold("  ║      🏛  Nepal Legal AI Assistant  🏛        ║"));
  console.log(c.bold("  ║         Powered by Gemini 2.5 Flash          ║"));
  console.log(c.bold("  ╚══════════════════════════════════════════════╝"));
  console.log();
  console.log(c.dim(`  Type your legal question and press Enter.`));
  console.log(c.dim(`  Type ${c.bold("'exit'")} or press Ctrl+C to quit.`));
  console.log(`  ${c.dim(divider("─", 50))}`);
  console.log();
}

function printAnswer(
  answer: string,
  confidence: number,
  sources: Array<{
    filename: string;
    pageNumber: number | null;
    similarityScore: number;
    index: number;
  }>
) {
  console.log();
  console.log(c.bold(`  ┌${"─".repeat(48)}┐`));
  console.log(c.bold(`  │  Answer                                        │`));
  console.log(c.bold(`  └${"─".repeat(48)}┘`));
  console.log();

  // Wrap answer text at ~72 chars for readability
  const lines = answer.split("\n");
  for (const line of lines) {
    if (line.trim() === "") {
      console.log();
    } else {
      // Indent each line
      console.log(`  ${line}`);
    }
  }

  console.log();
  console.log(`  ${c.label("Confidence:")} ${c.bold(formatScore(confidence))}`);

  console.log();
  console.log(c.bold(`  Sources:`));
  for (const source of sources) {
    const page =
      source.pageNumber != null && source.pageNumber > 0
        ? ` Page ${source.pageNumber}`
        : "";
    const score = formatScore(source.similarityScore);
    console.log(
      `  ${c.dim(`[${source.index}]`)} ${c.info(source.filename)}${page ? c.dim(page) : ""}  ${c.dim(`(${score} match)`)}`
    );
  }

  console.log();
  console.log(`  ${c.dim(divider("─", 50))}`);
  console.log();
}

function printRefusal(topScore: number) {
  console.log();
  console.log(
    c.warn(
      `  ⚠  Insufficient evidence found in indexed legal documents.`
    )
  );
  console.log(
    c.dim(
      `     Best similarity score: ${formatScore(topScore)} (threshold: ${formatScore(MIN_SIMILARITY)})`
    )
  );
  console.log(
    c.dim(`     Try rephrasing your question or index more documents.`)
  );
  console.log();
  console.log(`  ${c.dim(divider("─", 50))}`);
  console.log();
}

// ── Main REPL ─────────────────────────────────────────────────────────────────
async function main() {
  printBanner();

  // Verify Supabase is reachable and table exists
  process.stdout.write(`  Connecting to Supabase...`);
  try {
    const { count, error } = await supabaseClient
      .from("legal_document_chunks")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    console.log(c.success(` ✓`));
    console.log(
      `  ${c.info("Indexed chunks:")} ${c.bold(String(count ?? 0))}\n`
    );

    if (count === 0) {
      console.log(
        c.warn(
          `  ⚠  No documents indexed yet. Run ${c.bold("npm run ingest ./documents")} first.`
        )
      );
      console.log();
    }
  } catch (err: any) {
    console.log(c.error(` ✗`));
    console.error(
      c.error(
        `\n  Cannot connect to Supabase database. Make sure your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.`
      )
    );
    console.error(c.warn(`  Error details: ${err.message}`));
    process.exit(1);
  }

  // Set up readline REPL
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `  ${c.bold(c.info("You:"))} `,
  });

  rl.prompt();

  rl.on("line", async (line: string) => {
    const question = line.trim();

    if (!question) {
      rl.prompt();
      return;
    }

    if (question.toLowerCase() === "exit" || question.toLowerCase() === "quit") {
      console.log();
      console.log(c.dim("  Goodbye. Stay legally informed. 🏛"));
      console.log();
      rl.close();
      process.exit(0);
    }

    console.log();
    process.stdout.write(`  ${c.dim("Searching legal documents...")}`);

    try {
      // Step 1: Retrieve relevant chunks
      const chunks = await retrieveRelevantChunks(question, TOP_K, 0.0);

      // Step 2: Check similarity threshold
      const topScore = chunks[0]?.similarityScore ?? 0;

      if (chunks.length === 0 || topScore < MIN_SIMILARITY) {
        process.stdout.write("\r" + " ".repeat(50) + "\r");
        printRefusal(topScore);
        rl.prompt();
        return;
      }

      process.stdout.write(
        `\r  ${c.dim(`Found ${chunks.length} relevant chunk(s). Generating answer...`)}`
      );

      // Step 3: Generate answer with Gemini
      const { answer, confidence, sources } = await generateAnswer(
        question,
        chunks
      );

      // Step 4: Print formatted output
      process.stdout.write("\r" + " ".repeat(60) + "\r");
      printAnswer(answer, confidence, sources);
    } catch (err: any) {
      process.stdout.write("\r" + " ".repeat(60) + "\r");
      console.log();
      console.error(c.error(`  ✗ Error: ${err.message}`));
      console.log();
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log();
    console.log(c.dim("  Session ended."));
    console.log();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(c.error(`\nFatal error: ${err.message}`));
  process.exit(1);
});
