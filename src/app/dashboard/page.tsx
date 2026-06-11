'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { dbService, Case, Notification } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { 
  FolderHeart, Bell, ShieldQuestion, FilePlus, 
  ArrowRight, ShieldCheck, Clock, ExternalLink, Calendar, CheckSquare
} from 'lucide-react';
import Link from 'next/link';

export default function UserDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role === 'admin') {
      router.push('/admin-panel');
      return;
    }
    loadDashboardData(user.id);
  }, [user, authLoading, router]);

  const loadDashboardData = async (userId: string) => {
    try {
      const userCases = await dbService.getCases(userId);
      const userNotifs = await dbService.getNotifications(userId);
      setCases(userCases);
      setNotifications(userNotifs);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setDataLoading(false);
    }
  };

  const handleMarkRead = async (notifId: string) => {
    const success = await dbService.markNotificationRead(notifId);
    if (success && user) {
      loadDashboardData(user.id);
    }
  };

  if (authLoading || dataLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-legal-bone-light dark:bg-legal-navy-dark text-legal-gold">
        <div className="text-center space-y-4">
          <Clock className="h-10 w-10 animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wider font-sans uppercase">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const activeCases = cases.filter(c => c.status !== 'Resolved').length;
  const resolvedCases = cases.filter(c => c.status === 'Resolved').length;

  return (
    <div className="flex h-screen overflow-hidden bg-legal-bone-light dark:bg-legal-navy-dark transition-colors duration-300">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-legal-gold/15 pb-6">
          <div>
            <h1 className="font-serif text-3xl font-extrabold text-legal-navy dark:text-legal-bone-light">
              Welcome, {user.full_name}
            </h1>
            <p className="text-xs font-sans text-legal-navy/60 dark:text-legal-bone/60 mt-1">
              Here is your case overview and legal assistance updates.
            </p>
          </div>
          <Link
            href="/report"
            className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark shadow-gold-glow hover:scale-102 transition-all"
          >
            <FilePlus className="h-4 w-4" />
            File New Case
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-panel-light dark:glass-panel-dark p-6 rounded-2xl border border-legal-gold/15 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-legal-gold/10 text-legal-gold border border-legal-gold/25">
              <FolderHeart className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-legal-navy/50 dark:text-legal-bone/50">Total Filed</h3>
              <p className="text-2xl font-serif font-extrabold text-legal-navy dark:text-legal-bone-light mt-0.5">{cases.length}</p>
            </div>
          </div>

          <div className="glass-panel-light dark:glass-panel-dark p-6 rounded-2xl border border-legal-gold/15 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/25">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-legal-navy/50 dark:text-legal-bone/50">Active Reviews</h3>
              <p className="text-2xl font-serif font-extrabold text-legal-navy dark:text-legal-bone-light mt-0.5">{activeCases}</p>
            </div>
          </div>

          <div className="glass-panel-light dark:glass-panel-dark p-6 rounded-2xl border border-legal-gold/15 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10 text-green-500 border border-green-500/25">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-sans uppercase tracking-wider text-legal-navy/50 dark:text-legal-bone/50">Resolved Cases</h3>
              <p className="text-2xl font-serif font-extrabold text-legal-navy dark:text-legal-bone-light mt-0.5">{resolvedCases}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Cases */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-serif text-xl font-bold text-legal-navy dark:text-legal-bone-light">
                Your Reported Incidents
              </h2>
              <Link href="/cases" className="text-xs font-bold font-sans uppercase tracking-wider text-legal-gold hover:underline flex items-center gap-1">
                View Tracker <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {cases.length === 0 ? (
              <div className="glass-panel-light dark:glass-panel-dark p-8 text-center rounded-2xl border border-legal-gold/15 space-y-4 py-16">
                <ShieldQuestion className="h-10 w-10 text-legal-gold/40 mx-auto" />
                <h3 className="text-base font-bold text-legal-navy dark:text-legal-bone-light">No Incidents Reported</h3>
                <p className="text-xs text-legal-navy/50 dark:text-legal-bone/50 max-w-xs mx-auto">
                  If you have witnessed or experienced a violation, you can file a confidential report now.
                </p>
                <Link
                  href="/report"
                  className="inline-flex px-4 py-2 bg-legal-navy dark:bg-legal-bone text-legal-bone-light dark:text-legal-navy rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  File Incident
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cases.map((c) => (
                  <div 
                    key={c.id} 
                    className="glass-panel-light dark:glass-panel-dark p-5 rounded-2xl border border-legal-gold/15 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-legal-gold/30 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-sans uppercase tracking-wider bg-legal-gold/10 text-legal-gold-dark dark:text-legal-gold">
                          {c.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans uppercase tracking-wider
                          ${c.urgency === 'High' ? 'bg-red-500/10 text-red-500' : c.urgency === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                          {c.urgency} Urgency
                        </span>
                        {c.anonymous && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-sans uppercase tracking-wider bg-legal-navy/15 dark:bg-legal-bone/10 text-legal-navy/70 dark:text-legal-bone/70">
                            Anonymous
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif text-lg font-bold text-legal-navy dark:text-legal-bone-light">
                        {c.title}
                      </h4>
                      <div className="flex items-center gap-4 text-[11px] text-legal-navy/50 dark:text-legal-bone/50 font-semibold font-sans">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-legal-gold" />
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckSquare className="h-3.5 w-3.5 text-legal-gold" />
                          Readiness: {c.readiness_score}%
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-legal-gold/10 justify-between">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider
                        ${c.status === 'Resolved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                          c.status === 'Submitted' ? 'bg-legal-blue/10 text-legal-blue border border-legal-blue/20' : 
                          'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                        {c.status}
                      </span>
                      <Link
                        href="/cases"
                        className="flex items-center gap-1 text-[11px] font-bold text-legal-gold uppercase tracking-wider hover:underline"
                      >
                        Track <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Panel */}
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
              <Bell className="h-5 w-5 text-legal-gold" />
              Notifications
            </h2>

            <div className="glass-panel-light dark:glass-panel-dark rounded-2xl border border-legal-gold/15 divide-y divide-legal-gold/10 overflow-hidden shadow-glass">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-legal-navy/40 dark:text-legal-bone/40">
                  You are fully up to date. No new notices.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-4 space-y-1 transition-all ${notif.read ? 'opacity-60 bg-transparent' : 'bg-legal-gold/5'}`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-legal-navy dark:text-legal-bone-light">{notif.title}</h4>
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="text-[9px] font-bold text-legal-gold uppercase tracking-wider hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-legal-navy/70 dark:text-legal-bone/70 leading-relaxed font-sans">{notif.message}</p>
                    <div className="text-[9px] text-legal-navy/40 dark:text-legal-bone/40 pt-1 font-semibold">
                      {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* AI Assistant Quick Prompt */}
            <div className="glass-panel-light dark:glass-panel-dark p-5 rounded-2xl border border-legal-gold/25 relative overflow-hidden space-y-3 shadow-gold-glow">
              <div className="absolute inset-0 bg-gradient-to-br from-legal-gold/10 via-transparent to-transparent pointer-events-none" />
              <h3 className="font-serif text-base font-bold text-legal-navy dark:text-legal-bone-light">
                AI Legal Counsel
              </h3>
              <p className="text-xs text-legal-navy/70 dark:text-legal-bone/70 leading-relaxed font-sans">
                Analyze contracts, clarify civil statutes, or map case action plans in seconds using AI assistance.
              </p>
              <Link
                href="/assistant"
                className="inline-flex w-full items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-legal-navy dark:bg-legal-bone text-legal-bone-light dark:text-legal-navy hover:scale-102 transition-transform"
              >
                Start Legal Chat
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
