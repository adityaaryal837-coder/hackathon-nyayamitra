'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import {
  dbService, Case, Evidence, CaseUpdate, AdminNote
} from '@/lib/db';
import { useAuth } from '@/lib/auth';
import {
  Compass, FileText, CheckCircle2, Clock, Calendar,
  HelpCircle, UserCheck, Search, ShieldAlert, Award, FileWarning, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function CaseTracking() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  // Focus case variables
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [updates, setUpdates] = useState<CaseUpdate[]>([]);
  const [adminNotes, setAdminNotes] = useState<AdminNote[]>([]);

  const [loading, setLoading] = useState(true);

  // Status mapping to define timelines
  const phases = [
    { name: 'Submitted', desc: 'Case received', icon: FileWarning },
    { name: 'Under Review', desc: 'Admin reviewing details', icon: Search },
    { name: 'Evidence Review', desc: 'Evidentiary documents audit', icon: Clock },
    { name: 'Assigned', desc: 'Assigned to concerned staff ', icon: UserCheck },
    { name: 'Resolved', desc: 'Dispute closed', icon: Award },
  ] as const;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadCases(user.id);
  }, [user, authLoading, router]);

  const loadCases = async (userId: string) => {
    try {
      const userCases = await dbService.getCases(userId);
      setCases(userCases);
      if (userCases.length > 0) {
        setSelectedCase(userCases[0]);
        await loadCaseDetails(userCases[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseDetails = async (caseId: string) => {
    try {
      const [ev, up, notes] = await Promise.all([
        dbService.getEvidenceForCase(caseId),
        dbService.getCaseUpdates(caseId),
        dbService.getAdminNotes(caseId)
      ]);
      setEvidenceList(ev);
      setUpdates(up);
      setAdminNotes(notes);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectCase = async (c: Case) => {
    setSelectedCase(c);
    await loadCaseDetails(c.id);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-legal-bone-light dark:bg-legal-navy-dark text-legal-gold">
        <div className="text-center space-y-4">
          <Clock className="h-10 w-10 animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wider font-sans uppercase">Loading Cases...</p>
        </div>
      </div>
    );
  }

  // Find index of current status in timeline
  const getCurrentPhaseIndex = (status: Case['status']) => {
    return phases.findIndex(p => p.name === status);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-legal-bone-light dark:bg-legal-navy-dark transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 overflow-hidden flex flex-col md:flex-row h-full">
        {/* Left column: Case list */}
        <div className="w-full md:w-80 border-r border-legal-gold/15 bg-legal-navy/5 flex flex-col h-full overflow-y-auto p-6 space-y-6">
          <h2 className="font-serif text-xl font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2 border-b border-legal-gold/15 pb-4">
            <Compass className="h-5 w-5 text-legal-gold" />
            Track Cases
          </h2>

          {cases.length === 0 ? (
            <div className="text-center py-10 space-y-4">
              <HelpCircle className="h-10 w-10 text-legal-gold/30 mx-auto" />
              <p className="text-xs text-legal-navy/60 dark:text-legal-bone/60">No cases recorded.</p>
              <Link href="/report" className="inline-flex px-4 py-2 bg-legal-gold text-legal-navy-dark text-xs font-bold rounded-xl uppercase tracking-wider">
                File Report
              </Link>
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
                    <span className="text-[9px] uppercase tracking-wider font-bold text-legal-gold block mb-1">
                      {c.category}
                    </span>
                    <h4 className="font-serif text-sm font-bold text-legal-navy dark:text-legal-bone-light truncate">
                      {c.title}
                    </h4>
                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-legal-gold/5 text-[10px] text-legal-navy/50 dark:text-legal-bone/50 font-semibold font-sans">
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded
                        ${c.status === 'Resolved' ? 'bg-green-500/10 text-green-500' : 'bg-legal-gold/10 text-legal-gold'}`}>
                        {c.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Interactive Tracker details */}
        {selectedCase ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 h-full">
            {/* Header title */}
            <div className="border-b border-legal-gold/15 pb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-legal-gold bg-legal-gold/10 px-2.5 py-1 rounded-md">
                Case ID: {selectedCase.id}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-legal-navy dark:text-legal-bone-light mt-3">
                {selectedCase.title}
              </h2>
              <p className="text-sm text-legal-navy/80 dark:text-legal-bone/80 font-sans mt-2 whitespace-pre-wrap leading-relaxed">
                {selectedCase.description}
              </p>
            </div>

            {/* Timeline */}
            <div className="glass-panel-light dark:glass-panel-dark p-6 rounded-2xl border border-legal-gold/15 space-y-8 shadow-glass">
              <h3 className="font-serif text-base font-bold text-legal-navy dark:text-legal-bone-light">
                Resolution Timeline Progress
              </h3>

              {/* Responsive Phase Timeline */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative">
                {phases.map((p, idx) => {
                  const currentIdx = getCurrentPhaseIndex(selectedCase.status);
                  const isCompleted = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
                  const Icon = p.icon;

                  return (
                    <div
                      key={p.name}
                      className={`flex flex-col items-center text-center p-3 rounded-xl border relative transition-all duration-500
                        ${isCurrent
                          ? 'bg-legal-gold/15 border-legal-gold scale-105 shadow-sm shadow-legal-gold/10'
                          : isCompleted
                            ? 'bg-legal-navy/10 dark:bg-legal-bone/5 border-legal-gold/40 opacity-90'
                            : 'bg-transparent border-legal-gold/10 opacity-40'
                        }`}
                    >
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center mb-2.5 border
                        ${isCurrent || isCompleted
                          ? 'bg-legal-gold text-legal-navy-dark border-transparent'
                          : 'bg-transparent text-legal-navy/55 dark:text-legal-bone/55 border-legal-gold/30'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4.5 w-4.5" />}
                      </div>

                      <span className="text-xs font-bold font-sans tracking-wide block text-legal-navy dark:text-legal-bone-light">
                        {p.name}
                      </span>
                      <span className="text-[9px] text-legal-navy/40 dark:text-legal-bone/40 font-medium block mt-1 font-sans max-w-[120px] leading-tight">
                        {p.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Evidence & Updates Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column: Evidence List */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                  <FileText className="h-5 w-5 text-legal-gold" />
                  Attached Evidence Vault
                </h3>

                <div className="glass-panel-light dark:glass-panel-dark rounded-2xl border border-legal-gold/15 p-5 space-y-3 min-h-[150px] shadow-glass">
                  {evidenceList.length === 0 ? (
                    <p className="text-xs text-legal-navy/40 dark:text-legal-bone/40 text-center py-10 font-sans font-medium">
                      No evidence files uploaded. Tip: Attach receipts or contracts to increase AI Readiness.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {evidenceList.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-legal-navy/5 dark:bg-legal-bone/5 border border-legal-gold/10"
                        >
                          <div className="flex items-center gap-2 min-w-0">
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
                            className="text-[10px] font-bold text-legal-gold uppercase tracking-wider hover:underline flex items-center gap-1 flex-shrink-0"
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Case Logs */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                  <Clock className="h-5 w-5 text-legal-gold" />
                  Action Updates Log
                </h3>

                <div className="glass-panel-light dark:glass-panel-dark rounded-2xl border border-legal-gold/15 p-5 min-h-[150px] shadow-glass">
                  {updates.length === 0 ? (
                    <p className="text-xs text-legal-navy/40 dark:text-legal-bone/40 text-center py-10 font-sans font-medium">
                      No status logs available.
                    </p>
                  ) : (
                    <div className="relative border-l border-legal-gold/20 pl-4 space-y-6">
                      {updates.map((update) => (
                        <div key={update.id} className="relative space-y-1">
                          {/* Dot marker */}
                          <div className="absolute -left-[21.5px] top-1 h-3.5 w-3.5 rounded-full border-2 border-legal-gold bg-legal-navy dark:bg-legal-navy-dark" />

                          <div className="flex justify-between items-center text-[10px] font-sans font-semibold text-legal-navy/50 dark:text-legal-bone/50">
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

            {/* Admin Notes Box */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-legal-gold" />
                Administrator Feedback Notes
              </h3>

              <div className="glass-panel-light dark:glass-panel-dark rounded-2xl border border-legal-gold/15 p-6 shadow-glass space-y-4">
                {adminNotes.length === 0 ? (
                  <p className="text-xs text-legal-navy/40 dark:text-legal-bone/40 text-center py-6 font-sans font-medium">
                    No administrator review notes are recorded for this case file yet.
                  </p>
                ) : (
                  <div className="space-y-4 divide-y divide-legal-gold/10">
                    {adminNotes.map((note) => (
                      <div key={note.id} className="pt-4 first:pt-0 space-y-2">
                        <div className="flex justify-between text-[10px] font-sans font-semibold text-legal-navy/55 dark:text-legal-bone/55">
                          <span className="text-legal-gold">Advocate Review Panel</span>
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
                Select Case File
              </h3>
              <p className="text-xs text-legal-navy/60 dark:text-legal-bone/60">
                Choose one of your disputes from the left panel listing to inspect timelines and download documents.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
