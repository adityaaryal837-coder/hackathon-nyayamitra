'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { dbService, Case } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { aiService } from '@/lib/ai';
import { 
  MessageSquare, Send, Sparkles, Scale, AlertCircle, 
  HelpCircle, CheckCircle, ShieldAlert, FileText, ChevronDown
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Session storage key & 10-minute TTL ──────────────────────────────────────
const SESSION_KEY = 'nyaya_mitra_chat_session';
const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

const DEFAULT_GREETING: ChatMessage = {
  role: 'assistant',
  content: "Namaste! \uD83D\uDE4F I am **Nyaya Mitra AI**, your digital legal companion for Nepalese law.\n\nI can help you understand:\n- **Fundamental Rights** \u2014 Constitution of Nepal (2015)\n- **Cyber Law** \u2014 Electronic Transactions Act, 2063 BS\n- **Civil & Contract Law** \u2014 National Civil Code (Muluki Civil Code), 2074 BS\n\nAll answers are grounded in the official Nepalese legal documents. Select a reported case from the top for a legal audit, or ask me any legal question below.",
  timestamp: new Date()
};

function loadChatSession(): ChatMessage[] {
  if (typeof window === 'undefined') return [DEFAULT_GREETING];
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [DEFAULT_GREETING];
    const parsed = JSON.parse(raw) as { savedAt: number; messages: { role: 'user' | 'assistant'; content: string; timestamp: string }[] };
    // Check TTL — expire after 10 minutes
    if (Date.now() - parsed.savedAt > SESSION_TTL_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      return [DEFAULT_GREETING];
    }
    // Revive timestamp strings back to Date objects
    return parsed.messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [DEFAULT_GREETING];
  }
}

function saveChatSession(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ savedAt: Date.now(), messages }));
  } catch {}
}

export default function AILegalAssistant() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('general');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  // Chat states — initialised from sessionStorage (10-min TTL)
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatSession());
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompts — covering all three legal documents
  const suggestions = [
    "Explain my rights if I am arrested by police.",
    "What does cyber law of Nepal say about hacking?",
    "What are contract obligations under the Civil Code?",
    "What is the right to constitutional remedy (Article 46)?"
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadCases(user.id);
  }, [user, authLoading, router]);

  // Persist chat session to sessionStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) saveChatSession(messages);
  }, [messages]);

  useEffect(() => {
    // Scroll chat to bottom on new message
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    // Sync analysis metrics when case selection changes
    if (selectedCaseId === 'general') {
      setSelectedCase(null);
    } else {
      const match = cases.find(c => c.id === selectedCaseId);
      if (match) {
        setSelectedCase(match);
        // Push contextual helper message
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `I have loaded the files for case "${match.title}". I see its urgency is classified as ${match.urgency} and the readiness score is ${match.readiness_score}%. How can I help you strengthen your case file?`,
            timestamp: new Date()
          }
        ]);
      }
    }
  }, [selectedCaseId, cases]);

  const loadCases = async (userId: string) => {
    const list = await dbService.getCases(userId);
    setCases(list);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const newMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInputVal('');
    setIsTyping(true);

    try {
      // Map history format
      const history = messages.concat(newMsg).map(m => ({
        role: m.role,
        content: m.content
      }));

      const reply = await aiService.getLegalAssistanceChat(history);
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          timestamp: new Date()
        }
      ]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having trouble connecting to the network right now. Please review the recommended actions checklist on the right panel.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputVal);
  };

  if (!user) return null;

  // Analysis fallback logic when no case selected
  const defaultReadiness = 20;
  const defaultUrgency = 'Low';
  const defaultActionPlan = [
    'Select a case from the top selector for custom metrics.',
    'Formulate a clear written summary of your legal dispute.',
    'Locate and organize all signed agreements, receipts, or contracts.',
    'Ask Nyaya Mitra AI regarding specific constitutional provisions.'
  ];

  const currentReadiness = selectedCase ? selectedCase.readiness_score : defaultReadiness;
  const currentUrgency = selectedCase ? selectedCase.urgency : defaultUrgency;
  const currentActionPlan = selectedCase ? selectedCase.action_plan : defaultActionPlan;

  return (
    <div className="flex h-screen overflow-hidden bg-legal-bone-light dark:bg-legal-navy-dark transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Upper Case Selector Panel */}
        <div className="bg-legal-bone dark:bg-legal-navy px-6 py-4 border-b border-legal-gold/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10 shadow-sm">
          <div className="space-y-1">
            <h1 className="font-serif text-2xl font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-legal-gold animate-pulse" />
              AI Legal Assistant
            </h1>
            <p className="text-[11px] font-sans text-legal-navy/60 dark:text-legal-bone/60">
              Powered by Gemini AI · Constitution of Nepal (2015) · Cyber Law (ETA, 2063 BS) · National Civil Code (2074 BS)
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto relative">
            <span className="text-xs font-semibold text-legal-navy/60 dark:text-legal-bone/60 whitespace-nowrap font-sans">
              Focus Case:
            </span>
            <div className="relative w-full sm:w-60">
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full pl-3.5 pr-8 py-2 text-xs font-semibold font-sans rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark focus:outline-none focus:border-legal-gold appearance-none"
              >
                <option value="general">General Consultation</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    Case: {c.title.slice(0, 24)}...
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-legal-gold absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Lower Split Screen */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Module */}
          <div className="flex-1 flex flex-col h-full bg-legal-bone-light dark:bg-legal-navy-dark">
            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs border flex-shrink-0
                        ${isUser 
                          ? 'bg-legal-navy dark:bg-legal-bone text-legal-bone-light dark:text-legal-navy border-transparent' 
                          : 'bg-legal-gold/10 text-legal-gold border-legal-gold/30'
                        }`}
                      >
                        {isUser ? 'U' : 'AI'}
                      </div>
                      
                      {/* Text Bubble */}
                      <div className={`p-4 rounded-2xl text-sm font-sans font-medium leading-relaxed whitespace-pre-wrap shadow-sm
                        ${isUser 
                          ? 'bg-legal-navy dark:bg-legal-navy-light text-legal-bone-light' 
                          : 'glass-panel-light dark:glass-panel-dark border border-legal-gold/15 text-legal-navy dark:text-legal-bone-light'
                        }`}
                      >
                        {msg.content}
                        <div className="text-[9px] text-right mt-1.5 opacity-50 font-sans font-semibold">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-lg bg-legal-gold/10 text-legal-gold border border-legal-gold/30 flex items-center justify-center font-bold text-xs">
                      AI
                    </div>
                    <div className="p-4 rounded-2xl glass-panel-light dark:glass-panel-dark border border-legal-gold/15 text-sm flex gap-1.5 items-center">
                      <span className="h-2 w-2 rounded-full bg-legal-gold animate-bounce" />
                      <span className="h-2 w-2 rounded-full bg-legal-gold animate-bounce [animation-delay:0.2s]" />
                      <span className="h-2 w-2 rounded-full bg-legal-gold animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions Panel (Rendered only when history is small) */}
            {messages.length < 4 && !isTyping && (
              <div className="px-6 py-2 flex flex-wrap gap-2 justify-center">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(sug)}
                    className="px-3.5 py-1.5 rounded-full border border-legal-gold/25 hover:border-legal-gold text-[11px] font-sans font-semibold text-legal-navy/85 dark:text-legal-bone-light hover:bg-legal-gold/5 transition-all duration-200"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Message Input Box */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-legal-gold/15 bg-legal-bone dark:bg-legal-navy z-10 flex gap-3">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask your legal query or request a contract audit..."
                className="flex-1 px-4 py-3 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark hover:scale-105 transition-all shadow-md flex items-center justify-center flex-shrink-0"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>

          {/* AI Metrics & Insights Sidebar */}
          <div className="hidden lg:block w-80 h-full border-l border-legal-gold/15 overflow-y-auto bg-legal-navy/5 p-6 space-y-6">
            {/* Case Title if loaded */}
            {selectedCase && (
              <div className="border-b border-legal-gold/15 pb-4">
                <span className="text-[9px] font-bold uppercase tracking-wider text-legal-gold bg-legal-gold/10 px-2 py-0.5 rounded-md">
                  Active Audit
                </span>
                <h3 className="font-serif text-base font-bold text-legal-navy dark:text-legal-bone-light truncate mt-1">
                  {selectedCase.title}
                </h3>
              </div>
            )}

            {/* AI Case Readiness Score circular SVG gauge */}
            <div className="glass-panel-light dark:glass-panel-dark p-5 rounded-2xl border border-legal-gold/15 text-center space-y-3">
              <h4 className="text-xs font-bold font-sans uppercase tracking-wider text-legal-gold flex justify-center items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Case Readiness Score
              </h4>
              
              <div className="relative h-32 w-32 mx-auto flex items-center justify-center">
                {/* SVG Circle Gauge */}
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="48"
                    stroke="rgba(197, 168, 128, 0.15)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="48"
                    stroke="#C5A880"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={301.6}
                    strokeDashoffset={301.6 - (301.6 * currentReadiness) / 100}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="text-center">
                  <span className="text-2xl font-serif font-extrabold text-legal-navy dark:text-legal-bone-light">{currentReadiness}%</span>
                  <span className="block text-[8px] text-legal-navy/40 dark:text-legal-bone/40 font-bold tracking-widest font-sans uppercase">Ready</span>
                </div>
              </div>
              <p className="text-[10px] text-legal-navy/50 dark:text-legal-bone/50 max-w-[200px] mx-auto leading-relaxed">
                Evaluates file strength based on description completeness and evidentiary documents attached.
              </p>
            </div>

            {/* AI Urgency Status */}
            <div className="glass-panel-light dark:glass-panel-dark p-5 rounded-2xl border border-legal-gold/15 flex items-center justify-between">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold font-sans uppercase tracking-wider text-legal-gold flex items-center gap-1">
                  <ShieldAlert className="h-4 w-4" />
                  Urgency Status
                </h4>
                <p className="text-[10px] text-legal-navy/55 dark:text-legal-bone/55">Assigned by AI classifier</p>
              </div>

              <span className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sans uppercase tracking-wider
                ${currentUrgency === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/25' : 
                  currentUrgency === 'Medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25' : 
                  'bg-green-500/10 text-green-500 border border-green-500/25'}`}>
                {currentUrgency}
              </span>
            </div>

            {/* AI Action Plan checklist */}
            <div className="glass-panel-light dark:glass-panel-dark p-5 rounded-2xl border border-legal-gold/15 space-y-4">
              <h4 className="text-xs font-bold font-sans uppercase tracking-wider text-legal-gold flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Action Plan Checklist
              </h4>
              
              <ul className="space-y-3">
                {currentActionPlan.map((action, idx) => (
                  <li key={idx} className="flex gap-2 items-start">
                    <div className="h-4 w-4 rounded border border-legal-gold/45 text-legal-gold flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold">{idx + 1}</span>
                    </div>
                    <span className="text-[11px] font-medium leading-relaxed font-sans text-legal-navy/80 dark:text-legal-bone/80">
                      {action}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
