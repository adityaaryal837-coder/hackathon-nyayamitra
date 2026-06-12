'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scale, Mail, Lock, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/LanguageContext';

export default function Login() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');
  const [isLoading, setIsLoading]   = useState(false);

  // Redirect if already authenticated — backend untouched
  useEffect(() => {
    if (!loading && user) {
      router.push(user.role === 'admin' ? '/admin-panel' : '/dashboard');
    }
  }, [user, loading, router]);

  // ── LOGIN HANDLER — backend logic unchanged ────────────────────────────────
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
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setErrorMsg('Your email has not been confirmed yet. Please check your inbox and click the confirmation link.');
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
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred during authentication.');
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50 dark:bg-[#06101C]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-brand-200/30 border-t-brand-500 animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500/70">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 bg-brand-50 dark:bg-[#06101C] transition-colors duration-300 overflow-hidden">

      {/* Background decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-brand-200/30 dark:bg-brand-900/20 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-gold-200/20 dark:bg-gold-900/10 blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-semibold text-[#0B192C]/60 dark:text-brand-300/60 hover:text-brand-600 dark:hover:text-brand-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('auth.backToHome')}
      </Link>

      {/* Auth card */}
      <div className="w-full max-w-md space-y-7 animate-slide-up relative z-10">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 rounded-3xl bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/50 dark:to-brand-900/20 border border-brand-200/50 dark:border-brand-700/40 shadow-sm">
            <Scale className="h-8 w-8 text-brand-600 dark:text-brand-300" />
          </div>
          <div>
            <h1 className="font-bold text-3xl text-[#0B192C] dark:text-brand-50">{t('auth.loginTitle')}</h1>
            <p className="mt-1.5 text-sm text-[#0B192C]/55 dark:text-brand-300/55">{t('auth.loginSubtitle')}</p>
          </div>
        </div>

        {/* Form card */}
        <div className="glass-card p-8 space-y-5">

          {/* Error */}
          {errorMsg && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-700/40 text-red-600 dark:text-red-400 text-sm font-medium rounded-2xl flex items-start gap-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400 dark:text-brand-500" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="glass-input w-full pl-11 pr-4 py-3.5 text-sm text-[#0B192C] dark:text-brand-50 placeholder-[#0B192C]/35 dark:placeholder-brand-400/35"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
                  {t('auth.password')}
                </label>
                <Link href="/forgot-password" className="text-xs font-semibold text-brand-500 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-200 transition-colors">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400 dark:text-brand-500" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="glass-input w-full pl-11 pr-12 py-3.5 text-sm text-[#0B192C] dark:text-brand-50 placeholder-[#0B192C]/35 dark:placeholder-brand-400/35"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? t('auth.hidePassword') : t('auth.showPassword')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0B192C]/40 dark:text-brand-400/40 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="remember-me-toggle"
                onClick={() => setRememberMe(!rememberMe)}
                className={`relative w-9 h-5 rounded-full transition-all duration-300 flex-shrink-0 ${rememberMe ? 'bg-brand-500' : 'bg-[#0B192C]/15 dark:bg-brand-800/40'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${rememberMe ? 'left-4' : 'left-0.5'}`} />
              </button>
              <span className="text-sm text-[#0B192C]/65 dark:text-brand-200/65 select-none">{t('auth.rememberMe')}</span>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-brand-100/60 dark:bg-brand-800/40" />
            <span className="text-xs text-[#0B192C]/35 dark:text-brand-300/35 font-medium">or</span>
            <div className="flex-1 h-px bg-brand-100/60 dark:bg-brand-800/40" />
          </div>

          {/* Redirect to signup */}
          <div className="text-center text-sm text-[#0B192C]/55 dark:text-brand-300/55">
            {t('auth.noAccount')}{' '}
            <Link href="/signup" className="font-bold text-brand-600 dark:text-brand-300 hover:underline">
              {t('auth.signUpLink')}
            </Link>
          </div>
        </div>

        {/* Legal note */}
        <p className="text-center text-[11px] text-[#0B192C]/35 dark:text-brand-400/35 leading-relaxed px-4">
          By continuing, you agree to our{' '}
          <Link href="/" className="underline hover:text-brand-500">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/" className="underline hover:text-brand-500">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
