import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// ─── Gemini client (server-side only — key is NOT exposed to browser) ─────────
const geminiKey = process.env.GEMINI_API_KEY;

if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
  console.warn('[chat/route] GEMINI_API_KEY is not set in .env.local');
}

const genAI = geminiKey && geminiKey !== 'your_gemini_api_key_here'
  ? new GoogleGenerativeAI(geminiKey)
  : null;

// ─── System prompt — strictly Constitution of Nepal ──────────────────────────
const SYSTEM_PROMPT = `You are "Nyaya Mitra AI", a specialized constitutional legal assistant for Nepal.

STRICT RULES:
1. You MUST only answer questions based on the Constitution of Nepal (2015 / 2072 BS) provided to you as a document.
2. If a question is NOT related to the Constitution of Nepal, politely decline and say:
   "I can only assist with questions about the Constitution of Nepal (2015). Please ask me about fundamental rights, state structure, governance, constitutional provisions, or related legal matters."
3. Always cite the relevant Part, Article, or Schedule number from the Constitution in your answer.
4. Be clear, professional, and helpful. Explain legal terms in plain language.
5. You may give brief legal disclaimers when appropriate (e.g., "For official legal advice, consult a licensed advocate").
6. Do NOT answer questions about other countries' laws, general knowledge, science, entertainment, or anything outside the Constitution of Nepal.
7. Format your answers clearly using numbered points or sections where appropriate.
8. When referencing articles, use the format: "Article [number], Part [number] of the Constitution of Nepal".`;

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: { role: 'user' | 'assistant'; content: string }[] = body.messages ?? [];

    if (!messages.length) {
      return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });
    }

    // ── If Gemini is not configured, return a clear error ──
    if (!genAI) {
      return NextResponse.json({
        reply: '⚠️ The AI assistant is not configured. Please add your GEMINI_API_KEY to the .env.local file and restart the server.',
        source: 'error'
      });
    }

    // ── Load the Constitution of Nepal PDF from the filesystem ──
    const pdfPath = path.join(process.cwd(), 'public', 'nepal-constitution.pdf');
    
    if (!fs.existsSync(pdfPath)) {
      return NextResponse.json({
        reply: '⚠️ The Constitution of Nepal PDF is missing from the server. Please ensure "nepal-constitution.pdf" exists in the public/ folder.',
        source: 'error'
      });
    }

    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');

    // ── Build Gemini model ──
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    // ── Build chat history (all prior messages except the last user message) ──
    const lastUserMessage = messages[messages.length - 1].content;
    const historyForContext = messages
      .slice(0, -1)
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    // ── Compose the prompt with PDF inline (only send PDF on first message or every request) ──
    // We inline the PDF every request since the context window is reset each call
    const parts: any[] = [];

    // Attach the PDF as inline data
    parts.push({
      inlineData: {
        data: pdfBase64,
        mimeType: 'application/pdf',
      },
    });

    // Add conversation context if any
    if (historyForContext.trim()) {
      parts.push({
        text: `Previous conversation:\n${historyForContext}\n\nCurrent question:`
      });
    }

    // Add the current user question
    parts.push({ text: lastUserMessage });

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const reply = result.response.text();

    return NextResponse.json({ reply, source: 'gemini' });

  } catch (err: unknown) {
    console.error('[chat/route] Gemini API error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({
      reply: `I'm having trouble connecting to the AI right now. Please try again in a moment. (Error: ${message})`,
      source: 'error'
    }, { status: 500 });
  }
}
