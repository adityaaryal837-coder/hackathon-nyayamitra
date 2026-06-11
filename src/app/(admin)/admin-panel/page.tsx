'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { dbService, Case } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { 
  ShieldAlert, FolderKanban, Radio, CheckCircle, 
  Clock, AlertTriangle, Calendar, ChevronRight, Scale
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadPlatformData();
  }, [user]);

  const loadPlatformData = async () => {
    try {
      const allCases = await dbService.getAllCases();
      setCases(allCases);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-legal-bone-light dark:bg-legal-navy-dark text-legal-gold">
        <div className="text-center space-y-4">
          <Clock className="h-10 w-10 animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wider font-sans uppercase">Loading Admin Portal...</p>
        </div>
      </div>
    );
  }

  const totalCount = cases.length;
  const inReviewCount = cases.filter(c => c.status === 'Under Review' || c.status === 'Evidence Review').length;
  const resolvedCount = cases.filter(c => c.status === 'Resolved').length;
  const highUrgencyCount = cases.filter(c => c.urgency === 'High').length;

  const categoryCounts = cases.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getCategoryRatio = (count: number) => {
    if (totalCount === 0) return 0;
    return Math.round((count / totalCount) * 100);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-legal-bone-light dark:bg-legal-navy-dark transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-legal-gold/15 pb-6">
          <div>
            <h1 className="font-serif text-3xl font-extrabold text-legal-navy dark:text-legal-bone-light">
              Admin CMS Overview
            </h1>
            <p className="text-xs font-sans text-legal-navy/60 dark:text-legal-bone/60 mt-1">
              Platform Analytics · Case Queue
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-wider font-sans">
            <ShieldAlert className="h-4 w-4" />
            Admin Mode
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="glass-panel-light dark:glass-panel-dark p-5 rounded-2xl border border-legal-gold/15 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-legal-gold/10 text-legal-gold border border-legal-gold/25">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[10px] font-bold font-sans uppercase tracking-wider text-legal-navy/50 dark:text-legal-bone/50">Total Incidents</h3>
              <p className="text-xl font-serif font-extrabold text-legal-navy dark:text-legal-bone-light mt-0.5">{totalCount}</p>
            </div>
          </div>

          <div className="glass-panel-light dark:glass-panel-dark p-5 rounded-2xl border border-legal-gold/15 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/25">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[10px] font-bold font-sans uppercase tracking-wider text-legal-navy/50 dark:text-legal-bone/50">In Active Review</h3>
              <p className="text-xl font-serif font-extrabold text-legal-navy dark:text-legal-bone-light mt-0.5">{inReviewCount}</p>
            </div>
          </div>

          <div className="glass-panel-light dark:glass-panel-dark p-5 rounded-2xl border border-legal-gold/15 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10 text-green-500 border border-green-500/25">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[10px] font-bold font-sans uppercase tracking-wider text-legal-navy/50 dark:text-legal-bone/50">Resolved Cases</h3>
              <p className="text-xl font-serif font-extrabold text-legal-navy dark:text-legal-bone-light mt-0.5">{resolvedCount}</p>
            </div>
          </div>

          <div className="glass-panel-light dark:glass-panel-dark p-5 rounded-2xl border border-legal-gold/15 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/25 animate-pulse">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[10px] font-bold font-sans uppercase tracking-wider text-legal-navy/50 dark:text-legal-bone/50">High Priority</h3>
              <p className="text-xl font-serif font-extrabold text-legal-navy dark:text-legal-bone-light mt-0.5">{highUrgencyCount}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cases Queue */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-serif text-xl font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-1.5">
                <Scale className="h-5 w-5 text-legal-gold" />
                Case Review Queue
              </h2>
              <Link href="/admin-panel/cases" className="text-xs font-bold font-sans uppercase tracking-wider text-legal-gold hover:underline">
                Open Review Editor
              </Link>
            </div>

            {cases.length === 0 ? (
              <div className="glass-panel-light dark:glass-panel-dark text-center py-20 rounded-2xl border border-legal-gold/15 text-xs text-legal-navy/40 dark:text-legal-bone/40">
                No incidents recorded in the database yet.
              </div>
            ) : (
              <div className="space-y-4">
                {cases.map((c) => (
                  <div
                    key={c.id}
                    className="glass-panel-light dark:glass-panel-dark p-5 rounded-2xl border border-legal-gold/15 flex justify-between items-center gap-4 hover:border-legal-gold/35 transition-all"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold font-sans uppercase tracking-wider bg-legal-gold/10 text-legal-gold-dark dark:text-legal-gold">
                          {c.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-sans uppercase tracking-wider
                          ${c.urgency === 'High' ? 'bg-red-500/10 text-red-500' : c.urgency === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                          {c.urgency} Priority
                        </span>
                        {c.anonymous && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold font-sans uppercase tracking-wider bg-legal-navy/15 dark:bg-legal-bone/10 text-legal-navy/70 dark:text-legal-bone/70">
                            Anonymous
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif text-base font-bold text-legal-navy dark:text-legal-bone-light truncate">{c.title}</h4>
                      <p className="text-xs text-legal-navy/55 dark:text-legal-bone/55 font-semibold font-sans flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-legal-gold" />
                        Filed {new Date(c.created_at).toLocaleDateString()} · Readiness: {c.readiness_score}%
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
                      <span className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border
                        ${c.status === 'Resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                          c.status === 'Submitted' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                        {c.status}
                      </span>
                      <Link
                        href={`/admin-panel/cases?caseId=${c.id}`}
                        className="flex items-center gap-0.5 text-[10px] font-bold text-legal-gold uppercase tracking-wider hover:underline"
                      >
                        Review <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Breakdown & Quick Actions */}
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-1.5">
              <ShieldAlert className="h-5 w-5 text-legal-gold" />
              Category Loads
            </h2>

            <div className="glass-panel-light dark:glass-panel-dark p-6 rounded-2xl border border-legal-gold/15 space-y-6 shadow-glass">
              <h3 className="font-serif text-sm font-bold text-legal-navy dark:text-legal-bone-light pb-2 border-b border-legal-gold/10">
                Incident Distribution
              </h3>
              <div className="space-y-4">
                {['Constitutional Rights', 'Labor Law', 'Property Law', 'Criminal Law', 'Civil Liberties'].map((cat) => {
                  const count = categoryCounts[cat] || 0;
                  const ratio = getCategoryRatio(count);
                  return (
                    <div key={cat} className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-legal-navy/70 dark:text-legal-bone/70">{cat}</span>
                        <span className="text-legal-gold">{count} ({ratio}%)</span>
                      </div>
                      <div className="w-full h-2 rounded bg-legal-navy/10 dark:bg-legal-bone/10 overflow-hidden">
                        <div
                          className="h-full bg-legal-gold rounded transition-all duration-1000"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>


          </div>
        </div>
      </main>
    </div>
  );
}
