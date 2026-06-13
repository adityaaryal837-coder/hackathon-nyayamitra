'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scale, Mail, Lock, User, AlertCircle, ArrowLeft, Eye, EyeOff, Check, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/db';
import { useLanguage } from '@/lib/LanguageContext';

// ── Password strength calculator ───────────────────────────────────────────────
function calcStrength(pw: string): { score: number; label: string; color: string; width: string } {
  let score = 0;
  if (pw.length >= 6)  score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const map = [
    { label: 'strengthWeak',   color: 'bg-red-400',    width: 'w-1/4' },
    { label: 'strengthWeak',   color: 'bg-red-400',    width: 'w-1/4' },
    { label: 'strengthFair',   color: 'bg-amber-400',  width: 'w-2/4' },
    { label: 'strengthGood',   color: 'bg-blue-400',   width: 'w-3/4' },
    { label: 'strengthStrong', color: 'bg-green-500',  width: 'w-full' },
    { label: 'strengthStrong', color: 'bg-green-500',  width: 'w-full' },
  ];
  return { score, ...map[Math.min(score, 5)] };
}

// ── Email Verification Screen ──────────────────────────────────────────────────
function VerifyEmailScreen({ email, t }: { email: string; t: (k: string) => string }) {
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  React.useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (!canResend || !supabase) return;
    setResending(true);
    try {
      await supabase.auth.resend({ type: 'signup', email });
    } catch {}
    setCountdown(60);
    setCanResend(false);
    setResending(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 bg-brand-50 dark:bg-[#06101C] transition-colors duration-300 overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-brand-200/30 dark:bg-brand-900/20 blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up relative z-10 space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-3xl bg-green-50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-700/30">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="font-bold text-2xl text-[#0B192C] dark:text-brand-50">{t('auth.verifyTitle')}</h1>
          <p className="text-sm text-[#0B192C]/60 dark:text-brand-300/60">
            {t('auth.verifySubtitle')}{' '}
            <span className="font-semibold text-brand-600 dark:text-brand-300">{email}</span>
          </p>
        </div>

        <div className="glass-card p-8 space-y-6 text-center">
          {/* Animated mail illustration */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/50 dark:to-brand-900/20 border border-brand-200/50 dark:border-brand-700/40 flex items-center justify-center">
                <Mail className="h-10 w-10 text-brand-500" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-40" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-brand-500 items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </span>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-[#0B192C]/70 dark:text-brand-200/70 leading-relaxed">
              We sent a verification email to your inbox. Click the link to activate your account.
            </p>
            <p className="text-xs text-[#0B192C]/45 dark:text-brand-400/45">
              Check your spam folder if you don't see it.
            </p>
          </div>

          {/* Checklist */}
          <div className="space-y-2.5 text-left">
            {['Check your email inbox', 'Click the verification link', 'Come back and sign in'].map((step, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-[#0B192C]/65 dark:text-brand-200/65">
                <div className="h-6 w-6 rounded-full bg-brand-100 dark:bg-brand-900/40 border border-brand-200/50 dark:border-brand-700/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-300">{i + 1}</span>
                </div>
                {step}
              </div>
            ))}
          </div>

          {/* Resend button */}
          <button
            onClick={handleResend}
            disabled={!canResend || resending}
            className={`w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all
              ${canResend
                ? 'btn-primary'
                : 'bg-[#0B192C]/5 dark:bg-brand-800/20 text-[#0B192C]/35 dark:text-brand-300/35 cursor-not-allowed border border-brand-100/40 dark:border-brand-800/30'
              }`}
          >
            {resending
              ? <><RefreshCw className="h-4 w-4 animate-spin" /> Sending…</>
              : canResend
                ? <><RefreshCw className="h-4 w-4" /> {t('auth.resendEmail')}</>
                : <>{t('auth.resendIn')} {countdown}s…</>
            }
          </button>

          <Link
            href="/login"
            className="block text-sm font-semibold text-brand-600 dark:text-brand-300 hover:underline text-center"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main Signup Component ──────────────────────────────────────────────────────
export default function Signup() {
  const router = useRouter();
  const { t } = useLanguage();

  const [fullName, setFullName]             = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]             = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [errorMsg, setErrorMsg]             = useState('');
  const [successMsg, setSuccessMsg]         = useState('');
  const [isLoading, setIsLoading]           = useState(false);
  const [showVerify, setShowVerify]         = useState(false);

  const strength = useMemo(() => calcStrength(password), [password]);
  const passwordsMatch = confirmPassword === '' || password === confirmPassword;

  // ── SIGNUP HANDLER — backend logic unchanged ────────────────────────────────
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
      // Add a timeout to prevent hanging if Supabase is sleeping/waking up
      const signupPromise = supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: fullName.trim(), role: 'user' } },
      });

      const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) => 
        setTimeout(() => reject(new Error('Server is taking too long to respond (it may be waking up from sleep). Please try again in 1-2 minutes.')), 15000)
      );

      const { data, error } = await Promise.race([signupPromise, timeoutPromise]);

      if (error) {
        if (error.status === 422 || error.message.includes('422')) {
          setErrorMsg('Signup is currently disabled. Please check Supabase settings.');
        } else if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
          setErrorMsg('An account with this email already exists. Try logging in instead.');
        } else {
          setErrorMsg(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data?.user && !data?.session) {
        // Email verification required — show dedicated verify screen
        setShowVerify(true);
      } else {
        setSuccessMsg('Account created successfully! Redirecting…');
        setTimeout(() => router.push('/login'), 2500);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show verify email UI
  if (showVerify) return <VerifyEmailScreen email={email} t={t} />;

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 bg-brand-50 dark:bg-[#06101C] transition-colors duration-300 overflow-hidden">

      {/* Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-brand-200/25 dark:bg-brand-900/15 blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-gold-200/15 dark:bg-gold-900/10 blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Back */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-semibold text-[#0B192C]/60 dark:text-brand-300/60 hover:text-brand-600 dark:hover:text-brand-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('auth.backToHome')}
      </Link>

      <div className="w-full max-w-md animate-slide-up relative z-10 space-y-7">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3.5 rounded-3xl bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/50 dark:to-brand-900/20 border border-brand-200/50 dark:border-brand-700/40 shadow-sm">
            <Scale className="h-8 w-8 text-brand-600 dark:text-brand-300" />
          </div>
          <div>
            <h1 className="font-bold text-3xl text-[#0B192C] dark:text-brand-50">{t('auth.signupTitle')}</h1>
            <p className="mt-1.5 text-sm text-[#0B192C]/55 dark:text-brand-300/55">{t('auth.signupSubtitle')}</p>
          </div>
        </div>

        {/* Form card */}
        <div className="glass-card p-8 space-y-5">

          {/* Alerts */}
          {errorMsg && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-700/40 text-red-600 dark:text-red-400 text-sm font-medium rounded-2xl flex items-start gap-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200/60 dark:border-green-700/40 text-green-700 dark:text-green-400 text-sm font-medium rounded-2xl flex items-center gap-3">
              <Check className="h-4 w-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">

            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="signup-name" className="block text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
                {t('auth.fullName')}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400 dark:text-brand-500" />
                <input
                  id="signup-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Hari Prasad Sharma"
                  required
                  className="glass-input w-full pl-11 pr-4 py-3.5 text-sm text-[#0B192C] dark:text-brand-50 placeholder-[#0B192C]/35 dark:placeholder-brand-400/35"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="signup-email" className="block text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400 dark:text-brand-500" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="glass-input w-full pl-11 pr-4 py-3.5 text-sm text-[#0B192C] dark:text-brand-50 placeholder-[#0B192C]/35 dark:placeholder-brand-400/35"
                />
              </div>
            </div>

            {/* Password + strength */}
            <div className="space-y-1.5">
              <label htmlFor="signup-password" className="block text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400 dark:text-brand-500" />
                <input
                  id="signup-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="glass-input w-full pl-11 pr-12 py-3.5 text-sm text-[#0B192C] dark:text-brand-50 placeholder-[#0B192C]/35 dark:placeholder-brand-400/35"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0B192C]/40 dark:text-brand-400/40 hover:text-brand-600 dark:hover:text-brand-300 transition-colors">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {password && (
                <div className="space-y-1.5 pt-1">
                  <div className="h-1.5 w-full bg-brand-100/60 dark:bg-brand-800/30 rounded-full overflow-hidden">
                    <div className={`strength-bar h-full ${strength.color} ${strength.width}`} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-[#0B192C]/50 dark:text-brand-300/50">
                      {t('auth.passwordStrength')}
                    </span>
                    <span className={`text-[11px] font-bold ${strength.score >= 4 ? 'text-green-500' : strength.score >= 2 ? 'text-amber-500' : 'text-red-400'}`}>
                      {t(`auth.${strength.label}`)}
                    </span>
                  </div>
                  {/* Requirements checklist */}
                  <div className="grid grid-cols-2 gap-1 pt-0.5">
                    {[
                      [password.length >= 6,     '6+ characters'],
                      [password.length >= 10,    '10+ characters'],
                      [/[A-Z]/.test(password),   'Uppercase letter'],
                      [/[0-9]/.test(password),   'Number'],
                      [/[^A-Za-z0-9]/.test(password), 'Special character'],
                    ].map(([met, label], i) => (
                      <div key={i} className={`flex items-center gap-1.5 text-[10px] font-medium ${met ? 'text-green-600 dark:text-green-400' : 'text-[#0B192C]/35 dark:text-brand-400/35'}`}>
                        <div className={`h-3 w-3 rounded-full flex items-center justify-center flex-shrink-0 ${met ? 'bg-green-500' : 'bg-[#0B192C]/10 dark:bg-brand-700/30'}`}>
                          {met && <Check className="h-2 w-2 text-white" />}
                        </div>
                        {label as string}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="signup-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-400 dark:text-brand-500" />
                <input
                  id="signup-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className={`glass-input w-full pl-11 pr-12 py-3.5 text-sm text-[#0B192C] dark:text-brand-50 placeholder-[#0B192C]/35 dark:placeholder-brand-400/35 ${!passwordsMatch && confirmPassword ? 'border-red-300 dark:border-red-700' : ''}`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0B192C]/40 dark:text-brand-400/40 hover:text-brand-600 dark:hover:text-brand-300 transition-colors">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!passwordsMatch && confirmPassword && (
                <p className="text-[11px] text-red-500 font-medium">Passwords do not match</p>
              )}
              {passwordsMatch && confirmPassword && password && (
                <p className="text-[11px] text-green-500 font-medium flex items-center gap-1">
                  <Check className="h-3 w-3" /> Passwords match
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="signup-submit-btn"
              type="submit"
              disabled={isLoading || !!successMsg}
              className="btn-primary w-full py-4 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? t('auth.creating') : t('auth.createAccount')}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-brand-100/60 dark:bg-brand-800/40" />
            <span className="text-xs text-[#0B192C]/35 dark:text-brand-300/35 font-medium">or</span>
            <div className="flex-1 h-px bg-brand-100/60 dark:bg-brand-800/40" />
          </div>

          <div className="text-center text-sm text-[#0B192C]/55 dark:text-brand-300/55">
            {t('auth.haveAccount')}{' '}
            <Link href="/login" className="font-bold text-brand-600 dark:text-brand-300 hover:underline">
              {t('auth.signInLink')}
            </Link>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#0B192C]/35 dark:text-brand-400/35 leading-relaxed px-4">
          By creating an account, you agree to our{' '}
          <Link href="/" className="underline hover:text-brand-500">Terms</Link>
          {' '}and{' '}
          <Link href="/" className="underline hover:text-brand-500">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
