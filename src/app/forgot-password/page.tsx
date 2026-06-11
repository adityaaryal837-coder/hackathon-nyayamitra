'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Scale, Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsSent(true);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-legal-bone-light dark:bg-legal-navy-dark transition-colors duration-300">
      <Link href="/login" className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-bold font-sans uppercase tracking-wider text-legal-navy/60 dark:text-legal-bone/60 hover:text-legal-gold transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Login
      </Link>

      <div className="w-full max-w-md space-y-8 animate-slide-up relative z-10">
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-legal-gold/15 border border-legal-gold/30 text-legal-gold mb-4">
            <Scale className="h-8 w-8" />
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-legal-navy dark:text-legal-bone-light">
            Reset Password
          </h2>
          <p className="mt-2 text-xs font-sans text-legal-navy/60 dark:text-legal-bone/60">
            We will send you a password recovery instructions link
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel-light dark:glass-panel-dark p-8 rounded-2xl border border-legal-gold/20 shadow-glass">
          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="name@organization.org"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-legal-gold/20 bg-legal-bone-light dark:bg-legal-navy-dark text-sm focus:outline-none focus:border-legal-gold text-legal-navy dark:text-legal-bone"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-300"
              >
                {isLoading ? 'Sending Request...' : 'Send Recovery Email'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex p-3 rounded-full bg-green-500/10 border border-green-500/30 text-green-500">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="font-serif text-lg font-bold text-legal-navy dark:text-legal-bone-light">
                Recovery Link Sent
              </h3>
              <p className="text-xs text-legal-navy/70 dark:text-legal-bone/70 max-w-xs mx-auto leading-relaxed">
                If the email <strong className="text-legal-gold">{email}</strong> matches our directory, a recovery email has been sent. Please check your spam inbox as well.
              </p>
              <div className="pt-4">
                <Link href="/login" className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-legal-navy dark:bg-legal-bone text-legal-bone-light dark:text-legal-navy hover:scale-102 transition-transform">
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
