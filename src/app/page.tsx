'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, MessageSquare, Compass, BookOpen, 
  ArrowRight, Scale, CheckCircle2, ChevronRight, FileWarning, EyeOff
} from 'lucide-react';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';

const ThreeCanvas = dynamic(() => import('@/components/ThreeCanvas'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 z-0 flex items-center justify-center bg-transparent">
      {/* Fallback */}
    </div>
  ),
});

export default function Home() {
  const { user } = useAuth();


  const stats = [
    { number: '12,400+', label: 'Citizens Assisted' },
    { number: '98.4%', label: 'Case Analysis Accuracy' },
    { number: '2,850+', label: 'Disputes Resolved' },
    { number: '100%', label: 'Anonymity Assured' },
  ];

  const features = [
    {
      icon: EyeOff,
      title: 'Anonymous Incident Reporting',
      description: 'Report civil and human rights violations securely without revealing your identity. End-to-end encrypted logs protect your testimony.',
    },
    {
      icon: MessageSquare,
      title: 'AI Legal Consultant',
      description: 'Receive instantaneous, structured legal advice, documentation checklists, and case readiness analysis powered by Gemini.',
    },
    {
      icon: Compass,
      title: 'Live Case Tracking',
      description: 'Monitor your dispute resolution process across five status phases in real-time. Direct access to panel admin review notes.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-legal-bone-light dark:bg-legal-navy-dark transition-colors duration-300">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center py-20 px-4 overflow-hidden border-b border-legal-gold/10">
        {/* Three.js Animated Background Statue of Justice */}
        <ThreeCanvas imageSrc="/image/lawstatue.png" type="statue" />

        {/* Ambient Dark Overlay for serious look */}
        <div className="absolute inset-0 bg-gradient-to-t from-legal-bone-light via-legal-bone-light/80 to-transparent dark:from-legal-navy-dark dark:via-legal-navy-dark/95 dark:to-transparent z-0" />

        <div className="max-w-4xl mx-auto text-center relative z-10 animate-slide-up">
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-legal-gold/10 border border-legal-gold/30 text-legal-gold-dark dark:text-legal-gold text-xs font-semibold uppercase tracking-wider mb-8">
            <Scale className="h-4 w-4 animate-pulse-slow" />
            Democratizing Justice & Rights Enforcement
          </div>

          {/* Shimmering Main Header */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-legal-navy dark:text-legal-bone-light mb-6 leading-tight">
            Empowering Citizens Through <br />
            <span className="shimmer-text">Transparent Justice</span>
          </h1>

          <p className="font-sans text-base sm:text-xl text-legal-navy/80 dark:text-legal-bone/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Nyaya Mitra is a state-of-the-art legal companion. Securely report incidents, check case readiness, consult our AI legal advisor, and track resolutions.
          </p>

          {/* Action buttons with glass effects */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Link
              href={user ? '/report' : '/signup'}
              className="group flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark shadow-gold-glow hover:shadow-lg transition-all duration-300 border border-legal-gold/40 hover:border-legal-gold"
            >
              <FileWarning className="h-4 w-4" />
              File Urgent Incident
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-12 bg-legal-navy text-legal-bone dark:bg-legal-navy-dark border-y border-legal-gold/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="font-serif text-3xl sm:text-4xl font-extrabold text-legal-gold tracking-wide">
                  {stat.number}
                </div>
                <div className="text-xs sm:text-sm text-legal-bone/60 font-sans font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-legal-navy dark:text-legal-bone-light mb-4">
            Platform Capabilities
          </h2>
          <div className="h-[2px] w-24 bg-legal-gold mx-auto mb-6" />
          <p className="text-legal-navy/70 dark:text-legal-bone/70 max-w-xl mx-auto text-sm sm:text-base font-sans">
            Nyaya Mitra implements an integrated legal ecosystem designed to reduce legal friction, support transparency, and restore faith in judicial equity.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div 
                key={i} 
                className="glass-panel-light dark:glass-panel-dark p-8 rounded-2xl border border-legal-gold/15 hover:border-legal-gold/30 gold-glow-hover transition-all duration-300 flex gap-6 items-start"
              >
                <div className="p-3.5 rounded-xl bg-legal-gold/10 border border-legal-gold/25 text-legal-gold flex-shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-serif text-xl font-bold text-legal-navy dark:text-legal-bone-light">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-legal-navy/70 dark:text-legal-bone/70 leading-relaxed font-sans font-medium">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive CTA Banner */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="glass-panel-light dark:glass-panel-dark border border-legal-gold/25 rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="absolute inset-0 bg-gradient-to-r from-legal-gold/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="space-y-4 max-w-xl text-center lg:text-left relative z-10">
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-legal-navy dark:text-legal-bone-light leading-tight">
              Ready to Seek Justice or Expand Awareness?
            </h2>
            <p className="text-sm text-legal-navy/70 dark:text-legal-bone/70 leading-relaxed font-sans">
              Sign up today to start file cases, run automated legal documentation health-checks, talk to your digital AI counselor, and browse legal awareness articles.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto relative z-10">
            <Link
              href="/signup"
              className="px-8 py-4 rounded-xl text-sm font-bold bg-legal-navy dark:bg-legal-bone text-legal-bone-light dark:text-legal-navy text-center hover:bg-legal-navy-light dark:hover:bg-legal-bone-dark transition-all duration-300 shadow-md"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-xl text-sm font-bold border border-legal-gold/30 hover:border-legal-gold text-legal-gold hover:bg-legal-gold/5 text-center transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-legal-gold/15 py-12 bg-legal-bone dark:bg-legal-navy-dark text-center font-sans transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex justify-center items-center gap-3">
            <Scale className="h-6 w-6 text-legal-gold" />
            <span className="font-serif text-lg font-bold tracking-wider text-legal-navy dark:text-legal-bone-light">
              NYAYA MITRA
            </span>
          </div>
          <p className="text-xs text-legal-navy/50 dark:text-legal-bone/50 max-w-md mx-auto leading-relaxed">
            Nyaya Mitra is a hackathon prototype designed to support civil rights transparency. All uploaded incidents and AI interactions are strictly simulated in local database storage.
          </p>
          <div className="flex justify-center gap-6 text-xs font-semibold text-legal-navy/60 dark:text-legal-bone/60">
            <Link href="/" className="hover:text-legal-gold transition-colors">Terms of Service</Link>
            <Link href="/" className="hover:text-legal-gold transition-colors">Privacy Policy</Link>
          </div>
          <p className="text-[10px] text-legal-navy/40 dark:text-legal-bone/40">
            &copy; {new Date().getFullYear()} Nyaya Mitra. Empowering citizens globally.
          </p>
        </div>
      </footer>
    </div>
  );
}
