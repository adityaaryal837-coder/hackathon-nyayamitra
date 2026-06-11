'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scale, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/db';
import { useAuth } from '@/lib/auth';

export default function Login() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        router.push('/admin-panel');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    if (!supabase) {
      setErrorMsg('Supabase connection is not configured. Check your .env.local file.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        // Provide friendlier messages for common errors
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setErrorMsg('Your email has not been confirmed yet. Please check your inbox and click the confirmation link, or ask your admin to disable email confirmation in the Supabase dashboard.');
        } else if (error.message.toLowerCase().includes('invalid login credentials')) {
          setErrorMsg('Incorrect email or password. Please try again.');
        } else {
          setErrorMsg(error.message);
        }
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during authentication.';
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  // Show spinner while checking session (never show blank screen)
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-legal-bone-light dark:bg-legal-navy-dark">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-legal-gold/30 border-t-legal-gold animate-spin" />
        <p className="text-xs font-bold font-sans uppercase tracking-widest text-legal-gold/70">Verifying session…</p>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-legal-bone-light dark:bg-legal-navy-dark transition-colors duration-300">
      <Link href="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-bold font-sans uppercase tracking-wider text-legal-navy/60 dark:text-legal-bone/60 hover:text-legal-gold transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="w-full max-w-md space-y-8 animate-slide-up relative z-10">
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-legal-gold/15 border border-legal-gold/30 text-legal-gold mb-4">
            <Scale className="h-8 w-8" />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-legal-navy dark:text-legal-bone-light">
            Sign in to Nyaya Mitra
          </h1>
          <p className="mt-2 text-xs font-sans text-legal-navy/60 dark:text-legal-bone/60">
            Enter your credentials to access your legal workspace
          </p>
        </div>

        <div className="glass-panel-light dark:glass-panel-dark p-8 rounded-2xl border border-legal-gold/20 shadow-glass">
          <form onSubmit={handleLogin} className="space-y-6">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-legal-gold" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[11px] font-semibold text-legal-navy/50 dark:text-legal-bone/50 hover:text-legal-gold">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-legal-gold" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                  required
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-300"
            >
              {isLoading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs font-sans text-legal-navy/60 dark:text-legal-bone/60">
            {"Don't have an account? "}
            <Link href="/signup" className="font-semibold text-legal-gold hover:underline">
              Create one here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
