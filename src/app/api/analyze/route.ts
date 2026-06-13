import { NextRequest, NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/geminiManager';

export async function POST(req: NextRequest) {
  try {
    const { title, description, evidenceCount } = await req.json();

    const prompt = `
You are a legal case analyst for Nepal. Analyze the following incident report in the context of Nepal's laws and the Constitution of Nepal (2015).

Title: "${title}"
Description: "${description}"
Evidence Attached: ${evidenceCount ?? 0} files.

Provide your analysis strictly in JSON format with the following keys:
- "urgency": either "Low", "Medium", or "High"
- "readiness_score": a percentage score from 0 to 100 indicating how complete the case details/evidence are for legal presentation.
- "action_plan": an array of 3-5 specific, step-by-step actionable recommendations the user should take immediately under Nepal's legal framework.
- "summary": a 2-sentence professional summary explaining the legal context and any relevant constitutional provisions.

Output ONLY valid JSON. Do NOT include markdown code block formatting.
    `.trim();

    const result = await generateWithFallback('gemini-1.5-flash', prompt);
    const text = result.response.text().trim();
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error('[analyze/route] Error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
