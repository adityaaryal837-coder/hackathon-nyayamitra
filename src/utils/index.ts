/**
 * utils/index.ts
 * Shared utilities: text cleaning, chunking, file parsing, and console styling.
 */

import * as fs from "fs";
import * as path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

// ── Console Colors (ANSI) ────────────────────────────────────────────────────
export const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  bgBlue: "\x1b[44m",
};

export const c = {
  success: (s: string) => `${colors.green}${s}${colors.reset}`,
  error: (s: string) => `${colors.red}${s}${colors.reset}`,
  warn: (s: string) => `${colors.yellow}${s}${colors.reset}`,
  info: (s: string) => `${colors.cyan}${s}${colors.reset}`,
  bold: (s: string) => `${colors.bright}${s}${colors.reset}`,
  dim: (s: string) => `${colors.dim}${s}${colors.reset}`,
  label: (s: string) => `${colors.magenta}${colors.bright}${s}${colors.reset}`,
};

// ── Supported Extensions ─────────────────────────────────────────────────────
export const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".txt"];

// ── Text Cleaning ─────────────────────────────────────────────────────────────
/**
 * Cleans extracted text by removing excessive whitespace, control characters,
 * and normalizing line breaks.
 */
export function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n") // normalize CRLF
    .replace(/\r/g, "\n") // normalize CR
    .replace(/[^\S\n]+/g, " ") // collapse multiple spaces (keep newlines)
    .replace(/\n{3,}/g, "\n\n") // collapse 3+ newlines to 2
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // remove control chars
    .trim();
}

// ── Text Chunking ─────────────────────────────────────────────────────────────
export interface TextChunk {
  text: string;
  chunkId: number;
  charStart: number;
  charEnd: number;
}

/**
 * Splits text into overlapping chunks for better retrieval coverage.
 * Tries to split at sentence/word boundaries when possible.
 *
 * @param text - Cleaned document text.
 * @param chunkSize - Target characters per chunk (default: 1000).
 * @param overlap - Overlap characters between adjacent chunks (default: 200).
 */
export function chunkText(
  text: string,
  chunkSize = 1000,
  overlap = 200
): TextChunk[] {
  const chunks: TextChunk[] = [];
  let start = 0;
  let chunkId = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    if (end < text.length) {
      const searchBack = text.substring(end - 100, end);
      const sentenceBreak = searchBack.lastIndexOf("।");
      const periodBreak = searchBack.lastIndexOf(". ");
      const newlineBreak = searchBack.lastIndexOf("\n");

      const best = Math.max(sentenceBreak, periodBreak, newlineBreak);

      if (best > 0) {
        end = end - 100 + best + 1;
      }
    }

    const chunk = text.substring(start, end).trim();

    if (chunk.length > 50) {
      chunks.push({
        text: chunk,
        chunkId,
        charStart: start,
        charEnd: end,
      });
      chunkId++;
    }

    // CRITICAL FIX
    if (end >= text.length) {
      break;
    }

    start = end - overlap;
  }

  return chunks;
}

// ── File Extraction ──────────────────────────────────────────────────────────
export interface ExtractedDocument {
  text: string;
  pageCount: number | null;
}

/**
 * Extracts text from a PDF file page-by-page to avoid loading the entire
 * document into memory at once. This is critical for large PDFs (>50MB).
 */
export async function extractPdf(filePath: string): Promise<ExtractedDocument> {
  const buffer = fs.readFileSync(filePath);

  const pageTexts: string[] = [];

  // pdf-parse pagerender callback fires once per page — avoids full-doc memory load
  const options = {
    pagerender: (pageData: any): Promise<string> => {
      return pageData.getTextContent().then((content: any) => {
        const text = content.items
          .map((item: any) => item.str)
          .join(" ");
        pageTexts.push(text);
        return text;
      });
    },
  };

  const data = await pdfParse(buffer, options);
  const pageCount = data.numpages;

  // If pagerender collected per-page text, use it; otherwise fall back to full text
  const fullText =
    pageTexts.length > 0
      ? pageTexts.join("\n\n")
      : data.text;

  return { text: fullText, pageCount };
}


/**
 * Extracts text from a DOCX file using mammoth.
 */
export async function extractDocx(
  filePath: string
): Promise<ExtractedDocument> {
  const result = await mammoth.extractRawText({ path: filePath });
  return {
    text: result.value,
    pageCount: null, // DOCX doesn't have reliable page info
  };
}

/**
 * Extracts text from a plain text file.
 */
export async function extractTxt(filePath: string): Promise<ExtractedDocument> {
  const text = fs.readFileSync(filePath, "utf-8");
  return { text, pageCount: null };
}

/**
 * Dispatches file extraction based on extension.
 */
export async function extractDocument(
  filePath: string
): Promise<ExtractedDocument> {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".pdf":
      return extractPdf(filePath);
    case ".docx":
      return extractDocx(filePath);
    case ".txt":
      return extractTxt(filePath);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

/**
 * Scans a directory and returns all supported document file paths.
 */
export function scanDocuments(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  const stat = fs.statSync(dirPath);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${dirPath}`);
  }

  const files = fs.readdirSync(dirPath);
  return files
    .filter((file) => SUPPORTED_EXTENSIONS.includes(path.extname(file).toLowerCase()))
    .map((file) => path.join(dirPath, file));
}

/**
 * Estimates an approximate page number for a character offset in a document.
 * Assumes ~3000 characters per page (rough average for legal documents).
 */
export function estimatePage(charStart: number, pageCount: number | null): number | null {
  if (pageCount == null) return null;
  const estimatedPage = Math.floor(charStart / 3000) + 1;
  return Math.min(estimatedPage, pageCount);
}

/**
 * Formats a similarity score as a percentage string.
 */
export function formatScore(score: number): string {
  return `${(score * 100).toFixed(0)}%`;
}

/**
 * Prints a horizontal divider line.
 */
export function divider(char = "─", length = 50): string {
  return char.repeat(length);
}
