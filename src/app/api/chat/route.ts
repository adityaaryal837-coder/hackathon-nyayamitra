import { NextRequest, NextResponse } from 'next/server';
import { retrieveRelevantChunks } from '@/rag/retriever';
import { generateAnswer } from '@/rag/generator';

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: { role: 'user' | 'assistant'; content: string }[] = body.messages ?? [];

    if (!messages.length) {
      return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1].content;

    // ── Retrieve relevant chunks from Supabase Vector RAG ──
    // similarity threshold: 0.6
    const chunks = await retrieveRelevantChunks(lastUserMessage, 5, 0.6);

    if (chunks.length === 0) {
      return NextResponse.json({
        reply: "⚠️ I could not find sufficient legal evidence in the indexed documents to answer this question. (Similarity match below 60% threshold)",
        source: 'gemini'
      });
    }

    // ── Generate response using Gemini 2.5 Flash and RAG context ──
    const { answer } = await generateAnswer(lastUserMessage, chunks);

    return NextResponse.json({ reply: answer, source: 'gemini' });

  } catch (err: unknown) {
    console.error('[chat/route] Gemini RAG API error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    
    // Check if it's the missing key error specifically to show a clean message
    if (message.includes('GOOGLE_API_KEY') || message.includes('GEMINI_API_KEY') || message.includes('API_KEY')) {
      return NextResponse.json({
        reply: '⚠️ The AI assistant is not configured. Please add your GEMINI_API_KEY or GOOGLE_API_KEY to the .env.local file and restart the server.',
        source: 'error'
      });
    }
    
    return NextResponse.json({
      reply: `I'm having trouble connecting to the AI right now. Please try again in a moment. (Error: ${message})`,
      source: 'error'
    }, { status: 500 });
  }
}
