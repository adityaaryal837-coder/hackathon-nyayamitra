import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generateWithFallback } from '@/lib/geminiManager';

// ─── System prompt — Nepal legal documents ────────────────────────────────────
const SYSTEM_PROMPT = `You are "Nyaya Mitra AI", a specialized legal assistant for Nepal.

You have been provided with the following Nepalese legal documents:
1. The Constitution of Nepal (2015 / 2072 BS) - the supreme law of Nepal
2. The Electronic Transactions Act (Cyber Law) of Nepal
3. The National Civil Code (Muluki Civil Code) Contract provisions

STRICT RULES:
1. Answer questions ONLY based on the Nepalese legal documents provided to you.
2. For questions about cyber law, hacking, online fraud, digital transactions — refer to the Electronic Transactions Act (Cyber Law).
3. For contract disputes, civil obligations, property — refer to the National Civil Code.
4. For fundamental rights, state structure, citizenship — refer to the Constitution of Nepal.
5. Always cite the relevant Article, Section, or Schedule number from the appropriate document.
6. Be clear, professional, and helpful. Explain legal terms in simple, plain language.
7. Give brief legal disclaimers when appropriate (e.g., "For official legal advice, consult a licensed advocate / Vakil").
8. Do NOT answer questions about other countries' laws, general knowledge, science, or entertainment.
9. Format your answers clearly using numbered points or sections where appropriate.
10. When referencing the Constitution, use: "Article [number], Part [number] of the Constitution of Nepal".
11. When referencing Cyber Law, use: "Section [number] of the Electronic Transactions Act, 2063 BS".
12. When referencing Civil Code, use: "Section [number] of the Muluki Civil Code, 2074 BS".`;

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: { role: 'user' | 'assistant'; content: string }[] = body.messages ?? [];

    if (!messages.length) {
      return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });
    }

    // ── Load legal PDFs from public/laws/ directory ──
    const lawsDir = path.join(process.cwd(), 'public', 'laws');

    // Define PDFs to load — Constitution is required, others are supplementary
    const pdfFiles = [
      { name: 'ConstitutionOfNepal.pdf', required: true },
      { name: 'CyberLaw.pdf', required: false },
      { name: 'NationalCivilCodeContract.pdf', required: false },
    ];

    const loadedPdfs: { name: string; base64: string }[] = [];

    for (const pdfFile of pdfFiles) {
      const pdfPath = path.join(lawsDir, pdfFile.name);
      if (fs.existsSync(pdfPath)) {
        const pdfBuffer = fs.readFileSync(pdfPath);
        loadedPdfs.push({ name: pdfFile.name, base64: pdfBuffer.toString('base64') });
        console.log(`[chat/route] Loaded PDF: ${pdfFile.name}`);
      } else if (pdfFile.required) {
        console.error(`[chat/route] Required PDF missing: ${pdfFile.name}`);
        return NextResponse.json({
          reply: `⚠️ The Constitution of Nepal PDF is missing. Please ensure "ConstitutionOfNepal.pdf" exists in the public/laws/ folder.`,
          source: 'error'
        });
      } else {
        console.warn(`[chat/route] Optional PDF not found: ${pdfFile.name}`);
      }
    }

    // ── Build chat history (all prior messages except the last user message) ──
    const lastUserMessage = messages[messages.length - 1].content;
    const historyForContext = messages
      .slice(0, -1)
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    // ── Compose the prompt with all PDFs inline ──
    const parts: any[] = [];

    // Attach all loaded PDFs as inline data
    for (const pdf of loadedPdfs) {
      parts.push({
        inlineData: {
          data: pdf.base64,
          mimeType: 'application/pdf',
        },
      });
    }

    // Add conversation context if any
    if (historyForContext.trim()) {
      parts.push({
        text: `Previous conversation:\n${historyForContext}\n\nCurrent question:`
      });
    }

    // Add the current user question
    parts.push({ text: lastUserMessage });

    // ── Generate content with fallback manager ──
    const result = await generateWithFallback(
      'gemini-2.5-flash',
      { contents: [{ role: 'user', parts }] },
      SYSTEM_PROMPT
    );
    
    const reply = result.response.text();

    return NextResponse.json({ reply, source: 'gemini' });

  } catch (err: unknown) {
    console.error('[chat/route] Gemini API error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    
    // Check if it's the missing key error specifically to show a clean message
    if (message.includes('No valid GEMINI_API_KEY')) {
      return NextResponse.json({
        reply: '⚠️ The AI assistant is not configured. Please add your GEMINI_API_KEY to the .env.local file and restart the server.',
        source: 'error'
      });
    }
    
    return NextResponse.json({
      reply: `I'm having trouble connecting to the AI right now. Please try again in a moment. (Error: ${message})`,
      source: 'error'
    }, { status: 500 });
  }
}
