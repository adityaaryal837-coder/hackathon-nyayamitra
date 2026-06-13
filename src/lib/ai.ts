// ─── ai.ts ────────────────────────────────────────────────────────────────────
// All Gemini calls go through /api/chat and /api/analyze (server-side routes).
// The GEMINI_API_KEY is NEVER exposed to the browser.
// The Constitution of Nepal PDF is loaded server-side and passed inline to Gemini.
// ─────────────────────────────────────────────────────────────────────────────

// Interfaces
export interface AIAnalysisResult {
  urgency: 'Low' | 'Medium' | 'High';
  readiness_score: number;
  action_plan: string[];
  summary: string;
}

// ─── Fallback Legal Rules Engine (used when Gemini API is not configured) ────
function runLocalHeuristicAnalysis(title: string, description: string, evidenceCount: number = 0): AIAnalysisResult {
  const text = `${title} ${description}`.toLowerCase();
  
  let urgency: 'Low' | 'Medium' | 'High' = 'Low';
  let category = 'General Law';
  const actionPlan: string[] = [];
  let summary = '';

  if (text.includes('violence') || text.includes('assault') || text.includes('threat') || text.includes('harass') || text.includes('domestic') || text.includes('abuse')) {
    urgency = 'High';
    category = 'Criminal / Family Law';
    actionPlan.push(
      'Seek safety immediately. If in imminent danger, contact local emergency services (Nepal Police: 100).',
      'File a complaint at your nearest District Police Office or submit an anonymous report.',
      'Collect and preserve evidence: screenshots, recordings, medical reports, or witness statements.',
      'Request a protective order under the Domestic Violence (Offence and Punishment) Act, 2066 BS.',
      'Contact the National Human Rights Commission if your fundamental rights (Part 3 of the Constitution) are violated.'
    );
    summary = 'This case involves potential physical safety hazards or criminal acts under Nepal law. Direct legal and safety action is highly recommended. Article 20 of the Constitution guarantees rights against criminal justice.';
  } else if (text.includes('salary') || text.includes('wages') || text.includes('fired') || text.includes('severance') || text.includes('termination') || text.includes('employ') || text.includes('labor') || text.includes('contract')) {
    urgency = 'Medium';
    category = 'Labor / Employment Law';
    actionPlan.push(
      'Gather your employment contract, appointment letter, and salary slips as primary evidence.',
      'Compile all relevant communications (emails, messages) regarding unpaid dues or wrongful termination.',
      'Send a formal demand letter to the employer citing the Labour Act, 2074 BS.',
      'File a complaint at the local Labour Office (Shram Karyalaya) for conciliation under Nepal labour law.',
      'Your right to employment is enshrined in Article 33 of the Constitution of Nepal.'
    );
    summary = 'This case relates to workplace disputes under Nepal\'s Labour Act 2074 BS. Documentation of employment terms and payment records is essential for legal proceedings.';
  } else if (text.includes('tenant') || text.includes('rent') || text.includes('landlord') || text.includes('lease') || text.includes('evict') || text.includes('property')) {
    urgency = 'Medium';
    category = 'Property / Tenancy Law';
    actionPlan.push(
      'Review your rental/lease agreement for clauses on eviction notice periods (usually 35 days minimum in Nepal).',
      'Keep records of all rent payment receipts and written landlord communications.',
      'Respond in writing to any eviction notice, asserting your rights under the Muluki Civil Code, 2074 BS.',
      'If forceful eviction is attempted, report to the local police as it violates Article 25 of the Constitution (right to property).',
      'File a case at the District Court if mediation fails.'
    );
    summary = 'This case involves property or tenancy disputes under Nepal\'s Muluki Civil Code. Article 25 of the Constitution of Nepal guarantees the right to property.';
  } else if (text.includes('fraud') || text.includes('scam') || text.includes('money') || text.includes('bank') || text.includes('stole') || text.includes('credit')) {
    urgency = 'High';
    category = 'Financial / Criminal Law';
    actionPlan.push(
      'Report fraudulent transactions to your bank immediately to initiate a freeze.',
      'File a complaint with the Nepal Police Cyber Bureau (cybercrime.police.gov.np).',
      'Gather all transaction records, email/chat correspondence, and account statements.',
      'Draft a detailed timeline of events for law enforcement.',
      'This may involve violations under the Electronic Transactions Act, 2063 BS and the Muluki Criminal Code, 2074 BS.'
    );
    summary = 'This case outlines potential financial fraud under Nepal\'s Electronic Transactions Act and criminal code. Prompt notification to banking institutions and the Nepal Police Cyber Bureau is critical.';
  } else {
    urgency = 'Low';
    category = 'Civil Law / General Query';
    actionPlan.push(
      'Document all relevant facts, dates, and names related to the dispute.',
      'Retrieve and store any agreements, receipts, or legal notices.',
      'Consult a registered legal advocate (Vakil) for a brief case review.',
      'Consider settling through local community-led mediation (Saamudayik Madhyastata) first.',
      'Review your fundamental rights under Part 3 of the Constitution of Nepal (2015).'
    );
    summary = 'This is a general legal inquiry under Nepal\'s civil law framework. Organizing facts, documentation, and consulting a registered advocate is the recommended first step.';
  }

  let score = Math.min(30, Math.floor(description.length / 10));
  score += Math.min(40, evidenceCount * 20);
  if (title.length > 5) score += 10;
  if (category !== 'Civil Law / General Query') score += 20;
  const readiness_score = Math.max(15, Math.min(95, score));

  return { urgency, readiness_score, action_plan: actionPlan, summary };
}

// ─── AI Service ────────────────────────────────────────────────────────────────
export const aiService = {
  /**
   * Analyzes an incident via the secure /api/analyze server route.
   * Falls back to local heuristics if the API is unavailable.
   */
  async analyzeIncident(title: string, description: string, evidenceCount: number = 0): Promise<AIAnalysisResult> {
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, evidenceCount }),
      });

      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();

      // Validate response shape
      if (data.urgency && data.readiness_score !== undefined && data.action_plan && data.summary) {
        return data as AIAnalysisResult;
      }
      throw new Error('Invalid response shape from analyze API');
    } catch (e) {
      console.warn('[aiService.analyzeIncident] Falling back to heuristics:', e);
      return runLocalHeuristicAnalysis(title, description, evidenceCount);
    }
  },

  /**
   * Gets a legal chat response grounded in the Constitution of Nepal PDF.
   * Calls the secure /api/chat server route — the PDF is attached server-side.
   */
  async getLegalAssistanceChat(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();

      if (data.reply) return data.reply;
      throw new Error('No reply in response');
    } catch (e) {
      console.warn('[aiService.getLegalAssistanceChat] Falling back to static replies:', e);
      return getFallbackReply(messages[messages.length - 1]?.content ?? '');
    }
  },
};

// ─── Static fallback replies (used when Gemini is not configured) ─────────────
function getFallbackReply(userMessage: string): string {
  const text = userMessage.toLowerCase();

  if (text.includes('hello') || text.includes('hi ') || text.includes('hey') || text.trim() === 'hi') {
    return `Namaste! 🙏 I am **Nyaya Mitra AI**, your digital legal companion for Nepalese law.

I can help you understand:
- **Fundamental Rights** (Constitution of Nepal 2015, Part 3, Articles 16–46)
- **Cyber Law** — Electronic Transactions Act, 2063 BS
- **Civil Law** — National Civil Code (Muluki Civil Code), 2074 BS
- **State Structure** — Federal, Provincial, and Local Governments
- **Constitutional remedies** available to citizens
- **Citizenship and Nationality** provisions

Please ask me any question about Nepalese law, and I'll provide guidance with article/section references.

*Note: For official legal proceedings, always consult a licensed advocate (Vakil).*`;
  }

  if (text.includes('cyber') || text.includes('cybercrime') || text.includes('electronic') || text.includes('hacking') || text.includes('digital') || text.includes('online fraud') || text.includes('internet')) {
    return `**Cyber Law in Nepal — Electronic Transactions Act, 2063 BS**

Nepal's primary cyber law is the **Electronic Transactions Act (ETA), 2063 BS (2008 AD)**. Here are key provisions:

**Offences under ETA:**
1. **Section 44** — Unauthorized access to computer systems (hacking) is a criminal offence
2. **Section 45** — Damage to computer systems or data
3. **Section 46** — Publication of illegal material in electronic form (including obscene content)
4. **Section 47** — Breach of confidentiality of electronic records
5. **Section 48** — Fraud using electronic means

**Constitutional grounding:**
- **Article 17(2)(d)** of the Constitution of Nepal guarantees freedom of expression, but also allows restrictions for national security and public morality.
- **Article 28** guarantees the Right to Privacy, which is directly relevant to digital privacy violations.

**What to do if you're a cyber crime victim:**
1. Report to the **Nepal Police Cyber Bureau** — cybercrime.police.gov.np
2. Preserve all digital evidence (screenshots, URLs, email headers)
3. File a complaint at your local Police Office under ETA, 2063 BS

*For official legal proceedings, consult a licensed advocate (Vakil).*`;
  }

  if (text.includes('fundamental right') || text.includes('rights') || text.includes('article 16') || text.includes('part 3')) {
    return `**Fundamental Rights under the Constitution of Nepal (Part 3)**

The Constitution of Nepal (2015) guarantees the following key fundamental rights:

1. **Article 16** — Right to live with dignity
2. **Article 17** — Right to freedom (speech, assembly, movement, profession)
3. **Article 18** — Right to equality (no discrimination based on origin, religion, race, caste, sex)
4. **Article 19** — Right to communication
5. **Article 20** — Rights regarding criminal justice (right to fair trial, no double jeopardy)
6. **Article 21** — Right against preventive detention
7. **Article 22** — Right against torture
8. **Article 23** — Right against untouchability and racial discrimination
9. **Article 24** — Right against exploitation
10. **Article 25** — Right to property
11. **Article 26** — Right to religious freedom
12. **Article 27** — Right to information
13. **Article 28** — Right to privacy
14. **Article 29** — Right against exploitation
15. **Article 46** — Right to constitutional remedy

*For any specific right, please ask and I'll explain it in detail.*`;
  }

  if (text.includes('police') || text.includes('arrest') || text.includes('detention') || text.includes('jail')) {
    return `**Your Rights During Police Interactions (Constitution of Nepal)**

Under **Articles 20 and 21** of the Constitution of Nepal:

1. **Article 20(1)** — No person shall be held in custody without being informed of the grounds for such custody.
2. **Article 20(5)** — Every arrested person must be produced before a judicial authority within **24 hours** of arrest.
3. **Article 20(6)** — You have the right to legal counsel of your choice at the time of arrest.
4. **Article 20(9)** — No person shall be compelled to be a witness against themselves (right against self-incrimination).
5. **Article 21** — No person shall be held under preventive detention for more than the period prescribed by law without judicial review.

**Immediate steps to take:**
- Remain calm and politely invoke your right to an advocate.
- Request to contact a family member or lawyer.
- Do not sign any documents without legal advice.

*Disclaimer: For official legal proceedings, consult a registered advocate.*`;
  }

  if (text.includes('citizenship') || text.includes('nagrikta')) {
    return `**Citizenship provisions in the Constitution of Nepal**

**Part 2 (Articles 10–14)** covers citizenship:

- **Article 10** — No one shall be deprived of citizenship.
- **Article 11** — Citizenship by descent, birth, or naturalization is recognized.
- **Article 11(2)** — A person born in Nepal with a Nepali citizen father **or** mother may obtain citizenship.
- **Article 11(5)** — Foreign citizens married to Nepali citizens may obtain naturalized citizenship.
- **Article 12** — Citizenship certificates are issued by the Government of Nepal.

*For citizenship applications, visit your local District Administration Office (Jilla Prasashan Karyalaya).*`;
  }

  return `I am Nyaya Mitra AI, specialized in **Nepalese law**.

I can answer questions related to:
- **Constitution of Nepal (2015)** — Fundamental Rights, State Structure, Citizenship
- **Cyber Law** — Electronic Transactions Act, 2063 BS (hacking, online fraud, digital offences)
- **Civil Law** — National Civil Code (Muluki Civil Code), 2074 BS (contracts, property, obligations)

Please ask me a specific legal question and I'll provide a detailed answer with article/section references.

*Note: Add your GEMINI_API_KEY in .env.local for full AI-powered responses grounded in the actual PDF documents.*`;
}
