import { GoogleGenerativeAI } from "@google/generative-ai";
import { RetrievedChunk } from "./retriever";
import { getAvailableKeys } from "./keys";

const MODEL = "gemini-2.5-flash";

// ── System Prompt ───────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a Nepal Legal Assistant.

Only answer using the retrieved legal documents provided in the context below.
Never invent laws or legal provisions.
Never answer from your own knowledge.

If the retrieved evidence is insufficient or not directly relevant to the question, respond with exactly:
"I could not find sufficient legal evidence in the indexed documents to answer this question."

When answering:
- Do NOT include any bracketed reference numbers (like [1], [2], or [3]) in the text of your answer.
- At the very end of your response, list the source files and page numbers (if available) that you used under a "**Sources:**" section. Format them as a list, for example:
  **Sources:**
  * CyberLaw.pdf, Page 2
  * ConstitutionOfNepal.pdf, Page 40
- Do NOT include any confidence percentages, confidence scores, or matching scores in your response.

Always be precise, formal, and legally accurate.`;

// ── Types ────────────────────────────────────────────────────────────────────
export interface GeneratedAnswer {
  answer: string;
  confidence: number;
  sources: Array<{
    filename: string;
    pageNumber: number | null;
    similarityScore: number;
    index: number;
  }>;
}

/**
 * Builds a human-readable context block from retrieved chunks.
 */
function buildContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((chunk, idx) => {
      const page =
        chunk.pageNumber != null ? ` | Page ${chunk.pageNumber}` : "";
      return (
        `[${idx + 1}] Source: ${chunk.filename}${page}\n` +
        `---\n${chunk.text}\n`
      );
    })
    .join("\n");
}

/**
 * Generates a legal answer from Gemini 2.5 Flash using retrieved context.
 * @param question - The user's legal question.
 * @param chunks - Retrieved document chunks from ChromaDB.
 * @returns A structured GeneratedAnswer with answer text and citation metadata.
 */
export async function generateAnswer(
  question: string,
  chunks: RetrievedChunk[]
): Promise<GeneratedAnswer> {
  const keys = getAvailableKeys();
  if (keys.length === 0) {
    throw new Error("No valid GEMINI_API_KEY or GOOGLE_API_KEY found in environment variables.");
  }

  const context = buildContext(chunks);
  const topScore = chunks[0]?.similarityScore ?? 0;

  const prompt = `Retrieved Legal Context:
${context}

User Question: ${question}

Instructions:
- Answer ONLY from the retrieved context above
- Cite sources by their [number] references
- If the context is insufficient, use the exact refusal phrase specified in your instructions`;

  let lastError: any = null;

  for (let i = 0; i < keys.length; i++) {
    try {
      const genAI = new GoogleGenerativeAI(keys[i]);
      const model = genAI.getGenerativeModel({
        model: MODEL,
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await model.generateContent(prompt);
      const answerText = result.response.text();

      const sources = chunks.map((chunk, idx) => ({
        filename: chunk.filename,
        pageNumber: chunk.pageNumber,
        similarityScore: chunk.similarityScore,
        index: idx + 1,
      }));

      return {
        answer: answerText,
        confidence: topScore,
        sources,
      };
    } catch (err: any) {
      lastError = err;
      console.warn(
        `[Generator] Key #${i + 1} failed (Length: ${keys[i].length}): ${err.message}. Trying next API key...`
      );
    }
  }

  throw new Error(`All available Gemini API keys failed for answer generation. Last error: ${lastError?.message}`);
}
