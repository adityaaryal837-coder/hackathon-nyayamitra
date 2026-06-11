'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { dbService, supabase } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { 
  User, Mail, ShieldAlert, Calendar, Check, 
  UserCheck, AlertCircle, Save, Clock
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // Form values
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [casesCount, setCasesCount] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    setFullName(user.full_name);
    setEmail(user.email);
    // Load case statistics
    if (user.role === 'user') {
      dbService.getCases(user.id).then(list => setCasesCount(list.length));
    } else {
      dbService.getAllCases().then(list => setCasesCount(list.length));
    }
  }, [user, authLoading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    if (!fullName || !email) {
      setErrorMsg('Full name and email are required.');
      setIsLoading(false);
      return;
    }

    if (!supabase) {
      setErrorMsg('Supabase connection is not configured.');
      setIsLoading(false);
      return;
    }

    try {
      if (!user) return;

      const { error: authError } = await supabase.auth.updateUser({
        email: email.trim().toLowerCase(),
        data: { full_name: fullName.trim() }
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase()
        })
        .eq('id', user.id);
      if (profileError) throw profileError;

      const updatedProfile = {
        ...user,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase()
      };
      // Auth state will auto-refresh via onAuthStateChange listener in auth.tsx
      window.dispatchEvent(new Event('auth-state-change'));
      setSuccessMsg('Profile details updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile details.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-legal-bone-light dark:bg-legal-navy-dark transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
        {/* Header */}
        <div className="border-b border-legal-gold/15 pb-6">
          <h1 className="font-serif text-3xl font-extrabold text-legal-navy dark:text-legal-bone-light flex items-center gap-2.5">
            <User className="h-7 w-7 text-legal-gold" />
            Profile Settings
          </h1>
          <p className="text-xs font-sans text-legal-navy/60 dark:text-legal-bone/60 mt-1">
            Manage your account credentials, security access, and personal credentials.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Settings Form */}
          <div className="lg:col-span-2">
            <div className="glass-panel-light dark:glass-panel-dark p-6 sm:p-8 rounded-2xl border border-legal-gold/15 shadow-glass">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <Check className="h-4.5 w-4.5 flex-shrink-0" />
                    {successMsg}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-legal-gold" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-legal-gold" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                      required
                    />
                  </div>
                </div>

                {/* Save button */}
                <div className="pt-4 border-t border-legal-gold/10 flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark shadow-md hover:scale-102 transition-transform"
                  >
                    <Save className="h-4 w-4" />
                    {isLoading ? 'Saving Changes...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Account Details Side Card */}
          <div className="space-y-6">
            <div className="glass-panel-light dark:glass-panel-dark p-6 rounded-2xl border border-legal-gold/15 space-y-4">
              <h3 className="font-serif text-lg font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-legal-gold" />
                Account Status
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs border-b border-legal-gold/10 pb-3">
                  <span className="text-legal-navy/50 dark:text-legal-bone/50 font-semibold font-sans">Access Permission:</span>
                  <span className="font-bold uppercase tracking-wider text-legal-gold flex items-center gap-1">
                    {user.role === 'admin' && <ShieldAlert className="h-3.5 w-3.5" />}
                    {user.role}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs border-b border-legal-gold/10 pb-3">
                  <span className="text-legal-navy/50 dark:text-legal-bone/50 font-semibold font-sans">Joined Platform:</span>
                  <span className="font-bold text-legal-navy dark:text-legal-bone-light font-sans flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-legal-gold" />
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pb-1">
                  <span className="text-legal-navy/50 dark:text-legal-bone/50 font-semibold font-sans">
                    {user.role === 'admin' ? 'Total Platform Cases:' : 'Cases Filed By You:'}
                  </span>
                  <span className="font-extrabold text-legal-navy dark:text-legal-bone-light font-serif text-sm">
                    {casesCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-panel-light dark:glass-panel-dark p-6 rounded-2xl border border-legal-gold/15 space-y-4">
              <h3 className="font-serif text-lg font-bold text-legal-navy dark:text-legal-bone-light flex items-center gap-2">
                <Clock className="h-5 w-5 text-legal-gold" />
                Security Guidelines
              </h3>
              <p className="text-[11px] text-legal-navy/60 dark:text-legal-bone/60 leading-relaxed font-sans font-medium">
                Keep your login credentials secure. System logs record case creation timestamps and evidence check logs. If you require absolute anonymity, ensure the "File Anonymously" toggle is switched on during case report uploads.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
