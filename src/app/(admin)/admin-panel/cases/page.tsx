'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  dbService, Case, Evidence, CaseUpdate, AdminNote
} from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { 
  Gavel, FileText, Clock, ShieldCheck, AlertCircle, 
  Search, Calendar, CheckSquare, MessageSquare, ChevronDown, Check, HelpCircle
} from 'lucide-react';

function CaseReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCaseId = searchParams.get('caseId');
  const { user } = useAuth();

  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  // Focus case details
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [updates, setUpdates] = useState<CaseUpdate[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);

  // Editing forms
  const [statusVal, setStatusVal] = useState<Case['status']>('Submitted');
  const [noteVal, setNoteVal] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    loadPlatformCases();
  }, [user]);

  // Handle deep-linking from searchParams query
  useEffect(() => {
    if (cases.length > 0 && queryCaseId) {
      const match = cases.find(c => c.id === queryCaseId);
      if (match) {
        handleSelectCase(match);
      }
    }
  }, [queryCaseId, cases]);

  const loadPlatformCases = async () => {
    try {
      const list = await dbService.getAllCases();
      setCases(list);
      if (list.length > 0 && !queryCaseId) {
        setSelectedCase(list[0]);
        await loadCaseDetails(list[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseDetails = async (caseId: string) => {
    try {
      const ev = await dbService.getEvidenceForCase(caseId);
      const logs = await dbService.getCaseUpdates(caseId);
      const notes = await dbService.getAdminNotes(caseId);
      
      setEvidenceList(ev);
      setUpdates(logs);
      setAdminNotes(notes);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectCase = async (c: Case) => {
    setSelectedCase(c);
    setStatusVal(c.status);
    await loadCaseDetails(c.id);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    setSuccessMsg('');
    try {
      const updated = await dbService.updateCaseStatus(selectedCase.id, statusVal);
      if (updated) {
        setSelectedCase(updated);
        // Refresh listings
        const refreshedList = await dbService.getAllCases();
        setCases(refreshedList);
        await loadCaseDetails(selectedCase.id);
        
        setSuccessMsg('Case status updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !noteVal.trim()) return;

    setSuccessMsg('');
    try {
      const newNote = await dbService.addAdminNote(selectedCase.id, noteVal.trim());
      if (newNote) {
        setNoteVal('');
        await loadCaseDetails(selectedCase.id);
        setSuccessMsg('Feedback note recorded!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-legal-bone-light dark:bg-legal-navy-dark text-legal-gold">
        <div className="text-center space-y-4">
          <Clock className="h-10 w-10 animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wider font-sans uppercase">Loading Cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-legal-bone-light dark:bg-legal-navy-dark transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 overflow-hidden flex flex-col md:flex-row h-full">
        {/* Cases review list column */}
        <div className="w-full md:w-80 border-r border-legal-gold/15 bg-legal-navy/5 flex flex-col h-full overflow-y-auto p-6 space-y-6">
          <h2 className="font-serif text-xl font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2 border-b border-legal-gold/15 pb-4">
            <Gavel className="h-5 w-5 text-legal-gold" />
            Review Registry
          </h2>

          {cases.length === 0 ? (
            <div className="text-center py-10">
              <HelpCircle className="h-10 w-10 text-legal-gold/30 mx-auto mb-2" />
              <p className="text-xs text-legal-navy/60 dark:text-legal-bone/60">No incidents reported.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map((c) => {
                const isSelected = selectedCase?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCase(c)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200
                      ${isSelected 
                        ? 'bg-legal-gold/15 border-legal-gold shadow-sm' 
                        : 'bg-legal-bone dark:bg-legal-navy border-legal-gold/10 hover:border-legal-gold/30'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-legal-gold">
                        {c.category}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider
                        ${c.urgency === 'High' ? 'bg-red-500/10 text-red-500' : 'bg-legal-navy/10 dark:bg-legal-bone/10'}`}>
                        {c.urgency}
                      </span>
                    </div>
                    
                    <h4 className="font-serif text-sm font-bold text-legal-navy dark:text-legal-bone-light truncate">
                      {c.title}
                    </h4>

                    {c.anonymous && (
                      <span className="text-[9px] bg-legal-navy/10 dark:bg-legal-bone/5 text-legal-navy/60 dark:text-legal-bone/60 px-1.5 py-0.5 rounded font-sans uppercase font-bold tracking-wider block mt-1.5 w-max">
                        Anonymous Report
                      </span>
                    )}

                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-legal-gold/5 text-[9px] text-legal-navy/55 dark:text-legal-bone/55 font-sans">
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      <span className="font-bold uppercase tracking-wider">{c.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Case details */}
        {selectedCase ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 h-full">
            
            {/* Action success alert */}
            {successMsg && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-sm font-semibold rounded-xl flex items-center gap-2">
                <Check className="h-5 w-5 flex-shrink-0" />
                {successMsg}
              </div>
            )}

            {/* Case details header */}
            <div className="border-b border-legal-gold/15 pb-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-legal-gold bg-legal-gold/10 px-2.5 py-1 rounded-md">
                  Report ID: {selectedCase.id}
                </span>
                <span className="text-xs font-bold text-legal-navy/50 dark:text-legal-bone/50 font-serif">
                  {selectedCase.category}
                </span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-legal-navy dark:text-legal-bone-light mt-3">
                {selectedCase.title}
              </h2>
              <p className="text-sm text-legal-navy/80 dark:text-legal-bone/80 font-sans mt-2 whitespace-pre-wrap leading-relaxed">
                {selectedCase.description}
              </p>
            </div>

            {/* Controls Panels split */}
            <div className="grid lg:grid-cols-2 gap-8">
              
              {/* Status Update Control */}
              <div className="glass-panel-light dark:glass-panel-dark p-6 rounded-2xl border border-legal-gold/15 shadow-glass space-y-4">
                <h3 className="font-serif text-base font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-legal-gold" />
                  Dispatch Status Control
                </h3>
                
                <form onSubmit={handleUpdateStatus} className="space-y-4">
                  <div className="space-y-1.5 relative">
                    <label className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                      Case Status
                    </label>
                    <div className="relative">
                      <select
                        value={statusVal}
                        onChange={(e) => setStatusVal(e.target.value as Case['status'])}
                        className="w-full pl-3.5 pr-8 py-2.5 text-xs font-bold font-sans rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone appearance-none"
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Evidence Review">Evidence Review</option>
                        <option value="Assigned">Assigned to Counsel</option>
                        <option value="Resolved">Resolved (Close case)</option>
                      </select>
                      <ChevronDown className="h-4.5 w-4.5 text-legal-gold absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-legal-navy dark:bg-legal-bone text-legal-bone-light dark:text-legal-navy hover:scale-102 transition-transform"
                  >
                    Change Case Status
                  </button>
                </form>
              </div>

              {/* Note Submission Form */}
              <div className="glass-panel-light dark:glass-panel-dark p-6 rounded-2xl border border-legal-gold/15 shadow-glass space-y-4">
                <h3 className="font-serif text-base font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-legal-gold" />
                  Write Administrator Review Note
                </h3>

                <form onSubmit={handleAddNote} className="space-y-4">
                  <textarea
                    placeholder="Provide detailed legal guidance, evidence requirements, or assign instructions for the client to read."
                    value={noteVal}
                    onChange={(e) => setNoteVal(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-xs font-medium focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone leading-relaxed"
                    required
                  />

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark hover:scale-102 transition-transform"
                  >
                    Record Feedback Note
                  </button>
                </form>
              </div>
            </div>

            {/* Evidence & Logs */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Evidence list */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                  <FileText className="h-5 w-5 text-legal-gold" />
                  Evidence Files Audit ({evidenceList.length})
                </h3>

                <div className="glass-panel-light dark:glass-panel-dark rounded-2xl border border-legal-gold/15 p-5 min-h-[120px] shadow-glass">
                  {evidenceList.length === 0 ? (
                    <p className="text-xs text-legal-navy/40 dark:text-legal-bone/40 text-center py-8 font-sans font-medium">
                      No evidence files attached to this case.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {evidenceList.map((ev) => (
                        <div 
                          key={ev.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-legal-navy/5 dark:bg-legal-bone/5 border border-legal-gold/10"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText className="h-4 w-4 text-legal-gold flex-shrink-0" />
                            <div className="truncate">
                              <span className="text-xs font-bold text-legal-navy dark:text-legal-bone-light truncate block">{ev.file_name}</span>
                              <span className="text-[9px] text-legal-navy/40 dark:text-legal-bone/40 block">
                                {(ev.file_size / 1024).toFixed(0)} KB • Uploaded {new Date(ev.uploaded_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <a
                            href={ev.file_url}
                            download={ev.file_name}
                            className="text-[10px] font-bold text-legal-gold uppercase tracking-wider hover:underline flex-shrink-0"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Updates Logs */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                  <Clock className="h-5 w-5 text-legal-gold" />
                  Case Log History
                </h3>

                <div className="glass-panel-light dark:glass-panel-dark rounded-2xl border border-legal-gold/15 p-5 min-h-[120px] shadow-glass">
                  {updates.length === 0 ? (
                    <p className="text-xs text-legal-navy/40 dark:text-legal-bone/40 text-center py-8 font-sans font-medium">
                      No status logs available.
                    </p>
                  ) : (
                    <div className="relative border-l border-legal-gold/20 pl-4 space-y-4">
                      {updates.map((update) => (
                        <div key={update.id} className="relative space-y-0.5">
                          <div className="absolute -left-[21.5px] top-1 h-3.5 w-3.5 rounded-full border-2 border-legal-gold bg-legal-navy dark:bg-legal-navy-dark" />
                          <div className="flex justify-between items-center text-[10px] font-sans font-semibold text-legal-navy/55 dark:text-legal-bone/55">
                            <span>Status: {update.status}</span>
                            <span>{new Date(update.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-legal-navy/80 dark:text-legal-bone/80 font-sans font-medium leading-relaxed">
                            {update.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Platform Notes History */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-legal-gold" />
                Notes Left By Admin Reviewers
              </h3>

              <div className="glass-panel-light dark:glass-panel-dark p-6 rounded-2xl border border-legal-gold/15 shadow-glass space-y-4">
                {adminNotes.length === 0 ? (
                  <p className="text-xs text-legal-navy/40 dark:text-legal-bone/40 text-center py-6 font-sans font-medium">
                    No administrator feedback notes left.
                  </p>
                ) : (
                  <div className="space-y-4 divide-y divide-legal-gold/10">
                    {adminNotes.map((note) => (
                      <div key={note.id} className="pt-4 first:pt-0 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-sans font-semibold text-legal-navy/55 dark:text-legal-bone/55">
                          <span className="text-legal-gold">Administrator Note Record</span>
                          <span>{new Date(note.created_at).toLocaleString()}</span>
                        </div>
                        <div className="p-4 rounded-xl bg-legal-navy/5 dark:bg-legal-bone/5 border border-legal-gold/5 flex gap-3 items-start">
                          <AlertCircle className="h-4.5 w-4.5 text-legal-gold mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-legal-navy/85 dark:text-legal-bone/85 leading-relaxed font-sans font-medium">
                            {note.note}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 bg-legal-bone-light dark:bg-legal-navy-dark text-center">
            <div className="max-w-xs space-y-3">
              <HelpCircle className="h-10 w-10 text-legal-gold mx-auto" />
              <h3 className="font-serif text-lg font-bold text-legal-navy dark:text-legal-bone-light">
                Select case file
              </h3>
              <p className="text-xs text-legal-navy/60 dark:text-legal-bone/60">
                Choose a case from the review registry on the left to modify status timeline or record admin review comments.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CaseReview() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-legal-bone-light dark:bg-legal-navy-dark text-legal-gold">
        <div className="text-center space-y-4">
          <Clock className="h-10 w-10 animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wider font-sans uppercase">Loading Registry...</p>
        </div>
      </div>
    }>
      <CaseReviewContent />
    </Suspense>
  );
}
