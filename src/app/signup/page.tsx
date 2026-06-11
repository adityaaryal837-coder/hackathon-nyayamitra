'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scale, Mail, Lock, User, AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '@/lib/db';

export default function Signup() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    if (!fullName.trim()) {
      setErrorMsg('Full name is required.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }

    if (!supabase) {
      setErrorMsg('Supabase connection is not configured. Check your .env.local file.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'user',
          }
        }
      });

      if (error) {
        // Map common Supabase error scenarios to friendly messages
        if (error.status === 422 || error.message.includes('422')) {
          setErrorMsg('Signup is currently disabled or email/password requirements were not met. Go to your Supabase dashboard → Authentication → Providers → Email → enable "Allow new users to sign up" and disable "Confirm email" for development.');
        } else if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
          setErrorMsg('An account with this email already exists. Try logging in instead.');
        } else {
          setErrorMsg(error.message);
        }
        setIsLoading(false);
        return;
      }

      // No session means email confirmation is required
      if (data.user && !data.session) {
        setSuccessMsg('Account created! Please check your email to confirm your account, then log in.');
      } else {
        setSuccessMsg('Account created successfully! Redirecting to login…');
      }
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during registration.';
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

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
            Create Your Account
          </h1>
          <p className="mt-2 text-xs font-sans text-legal-navy/60 dark:text-legal-bone/60">
            Join Nyaya Mitra to access your secure legal workspace
          </p>
        </div>

        <div className="glass-panel-light dark:glass-panel-dark p-8 rounded-2xl border border-legal-gold/20 shadow-glass">
          <form onSubmit={handleSignup} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                {successMsg}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="signup-name" className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-legal-gold" />
                <input
                  id="signup-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Hari Prasad Sharma"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="signup-email" className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-legal-gold" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="signup-password" className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-legal-gold" />
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="signup-confirm-password" className="block text-xs font-bold font-sans uppercase tracking-wider text-legal-gold">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-legal-gold" />
                <input
                  id="signup-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                  required
                />
              </div>
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              disabled={isLoading || !!successMsg}
              className="w-full py-3.5 mt-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-300"
            >
              {isLoading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>

          <div className="mt-4 text-center text-xs font-sans text-legal-navy/60 dark:text-legal-bone/60">
            {'Already have an account? '}
            <Link href="/login" className="font-semibold text-legal-gold hover:underline">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
