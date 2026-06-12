'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Scale, ArrowRight, FileWarning, MessageSquare, EyeOff,
  Users, Briefcase, Compass, BookOpen, ShieldCheck,
  Award, Heart, Star, Quote,
  Mail, Phone, MapPin, Facebook, Linkedin, Instagram, Twitter,
} from 'lucide-react';
import Header from '@/components/Header';
import PublicSidebar from '@/components/PublicSidebar';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/LanguageContext';

const ThreeCanvas = dynamic(() => import('@/components/ThreeCanvas'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 z-0" />,
});

// ── Scroll Reveal Hook ─────────────────────────────────────────────────────────
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ── Reusable reveal wrapper ────────────────────────────────────────────────────
const Reveal: React.FC<{ children: React.ReactNode; delay?: string; className?: string }> = ({
  children, delay = '0ms', className = ''
}) => {
  const ref = useScrollReveal();
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: delay }}>
      {children}
    </div>
  );
};

// ── Feature card icons map ────────────────────────────────────────────────────
const FEATURE_ICONS = [EyeOff, Users, Briefcase, Compass, MessageSquare, BookOpen];
const ABOUT_ICONS   = [Award, Compass, ShieldCheck, Heart];
const ABOUT_COLORS  = [
  'from-blue-500/10 to-blue-600/5 border-blue-200/50 text-blue-600',
  'from-purple-500/10 to-purple-600/5 border-purple-200/50 text-purple-600',
  'from-green-500/10 to-green-600/5 border-green-200/50 text-green-600',
  'from-red-500/10 to-red-600/5 border-red-200/50 text-red-600',
];

// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const stats = [
    { number: '12,400+', label: t('stats.citizens') },
    { number: '98.4%',   label: t('stats.accuracy') },
    { number: '2,850+',  label: t('stats.resolved') },
    { number: '100%',    label: t('stats.anonymity') },
  ];

  const featureKeys = ['ai', 'community', 'lawyer', 'complaint', 'lang', 'awareness'] as const;
  const aboutKeys   = ['mission', 'vision', 'values', 'impact'] as const;

  const blogPosts  = t('blog.posts') as unknown as any[];
  const testimonials = t('testimonials.items') as unknown as any[];

  // ── We re-read arrays via index to avoid type errors with t()
  const getBlogPosts = () => {
    try {
      const { translations } = require('@/lib/LanguageContext');
      return translations[language].blog.posts;
    } catch { return []; }
  };
  const getTestimonials = () => {
    try {
      const { translations } = require('@/lib/LanguageContext');
      return translations[language].testimonials.items;
    } catch { return []; }
  };

  const posts   = getBlogPosts();
  const reviews = getTestimonials();

  return (
    <div className="relative min-h-screen bg-brand-50 dark:bg-[#06101C] transition-colors duration-300">

      {/* ── Left Sidebar ─────────────────────────────────────────────────────── */}
      <PublicSidebar />

      {/* ── Top Header ───────────────────────────────────────────────────────── */}
      <Header />

      {/* ── Page Content (push right on desktop) ─────────────────────────────── */}
      <div className="md:pl-[280px] transition-all duration-300">

        {/* ════════════════════════════════════════════════════════════════════
            HERO SECTION
        ══════════════════════════════════════════════════════════════════════ */}
        <section
          id="home"
          className="relative min-h-[100svh] flex items-center pt-[72px] pb-16 px-4 sm:px-6 lg:px-10 overflow-hidden"
        >
          {/* Three.js animated background */}
          <ThreeCanvas imageSrc="/image/lawstatue.png" type="statue" />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-50/90 via-brand-100/80 to-brand-200/60 dark:from-[#06101C]/95 dark:via-[#0B192C]/90 dark:to-[#0D2140]/80 z-0" />

          {/* Decorative blobs */}
          <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-brand-300/20 dark:bg-brand-700/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-56 h-56 rounded-full bg-gold-300/15 dark:bg-gold-700/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">

            {/* ── LEFT: Copy & CTAs ─────────────────────────────────────────── */}
            <div className="lg:col-span-6 space-y-7 animate-slide-up">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-100/80 dark:bg-brand-900/40 border border-brand-200/60 dark:border-brand-700/40 text-brand-700 dark:text-brand-300 text-xs font-semibold uppercase tracking-wider">
                <Scale className="h-3.5 w-3.5 text-gold-500 animate-pulse-slow" />
                {t('hero.badge')}
              </div>

              {/* Main heading */}
              <h1 className="font-bold leading-[1.1] text-[clamp(2.5rem,5vw,4rem)] text-[#0B192C] dark:text-brand-50">
                {t('hero.title1')}{' '}
                <span className="block shimmer-blue">{t('hero.title2')}</span>
                <span className="block text-gold-500">{t('hero.title3')}</span>
              </h1>

              {/* Description */}
              <p className="text-[1.05rem] leading-relaxed text-[#0B192C]/75 dark:text-brand-200/75 max-w-lg">
                {t('hero.description')}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href={user ? '/report' : '/signup'}
                  className="btn-primary inline-flex items-center gap-2.5 px-7 py-4 text-base font-semibold group"
                >
                  <FileWarning className="h-5 w-5" />
                  {t('hero.ctaPrimary')}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="#about"
                  onClick={(e) => { e.preventDefault(); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="btn-glass inline-flex items-center gap-2.5 px-7 py-4 text-base font-semibold"
                >
                  {t('hero.ctaSecondary')}
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                {[['🔒', 'End-to-End Encrypted'], ['⚡', 'Instant AI Response'], ['🇳🇵', 'Made for Nepal']].map(([emoji, label]) => (
                  <span key={label} className="flex items-center gap-1.5 text-xs font-medium text-[#0B192C]/60 dark:text-brand-300/60">
                    <span>{emoji}</span>{label}
                  </span>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Floating Illustration ──────────────────────────────── */}
            <div className="lg:col-span-6 relative flex items-center justify-center min-h-[380px]">

              {/* Central SVG emblem */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] dark:opacity-[0.05]">
                <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.2"
                  className="w-full h-full text-brand-700 dark:text-brand-300 animate-spin-slow">
                  <circle cx="100" cy="100" r="90" strokeDasharray="12 6" />
                  <circle cx="100" cy="100" r="70" />
                  <path d="M100 30v140M60 80h80M60 80l20 35M140 80l-20 35M80 115a14 14 0 0028 0M45 160h110" />
                </svg>
              </div>

              {/* Floating Card 1 — AI Consultant */}
              <div className="absolute top-8 left-4 sm:left-0 lg:-left-6 z-20 glass-card p-4 flex items-center gap-3 w-52 animate-float-1">
                <div className="p-2.5 rounded-2xl bg-brand-100 dark:bg-brand-900/50 border border-brand-200/50 dark:border-brand-700/40">
                  <MessageSquare className="h-5 w-5 text-brand-600 dark:text-brand-300" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0B192C] dark:text-brand-50">{t('hero.card1Title')}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">{t('hero.card1Status')}</span>
                  </div>
                </div>
              </div>

              {/* Floating Card 2 — Readiness Score */}
              <div className="absolute bottom-16 right-4 sm:right-0 lg:-right-6 z-20 glass-card p-4 flex items-center gap-3 w-52 animate-float-2">
                <div className="p-2.5 rounded-2xl bg-gold-50 dark:bg-gold-900/20 border border-gold-200/50 dark:border-gold-700/40">
                  <ShieldCheck className="h-5 w-5 text-gold-600 dark:text-gold-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0B192C] dark:text-brand-50">{t('hero.card2Title')}</p>
                  <p className="text-[11px] font-semibold text-gold-600 dark:text-gold-400 mt-0.5">{t('hero.card2Value')}</p>
                </div>
              </div>

              {/* Floating Card 3 — Privacy */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 glass-card p-4 flex items-center gap-3 w-48 animate-float-3">
                <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-700/40">
                  <EyeOff className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0B192C] dark:text-brand-50">{t('hero.card3Title')}</p>
                  <p className="text-[10px] font-medium text-[#0B192C]/55 dark:text-brand-300/55 mt-0.5">{t('hero.card3Sub')}</p>
                </div>
              </div>

              {/* Large scales SVG illustration */}
              <svg viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg"
                className="w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 opacity-25 dark:opacity-15 text-brand-700 dark:text-brand-300">
                <line x1="160" y1="40" x2="160" y2="280" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                <line x1="80"  y1="80" x2="240" y2="80" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                <path d="M80 80 L50 150 Q80 175 110 150 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
                <path d="M240 80 L210 155 Q240 180 270 155 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
                <rect x="140" y="275" width="40" height="8" rx="4" fill="currentColor" fillOpacity="0.4"/>
              </svg>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            STATS BANNER
        ══════════════════════════════════════════════════════════════════════ */}
        <section className="py-12 bg-[#0B192C] dark:bg-[#03080F] border-y border-brand-900/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <Reveal key={i} delay={`${i * 80}ms`}>
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-bold text-gold-400">{s.number}</div>
                  <div className="text-xs sm:text-sm text-brand-300/70 font-medium">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            FEATURES SECTION
        ══════════════════════════════════════════════════════════════════════ */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
          <Reveal className="text-center mb-16">
            <h2 className="font-bold text-[clamp(1.8rem,4vw,3rem)] text-[#0B192C] dark:text-brand-50 mb-4">
              {t('features.heading')}
            </h2>
            <div className="section-divider mb-5" />
            <p className="text-[#0B192C]/65 dark:text-brand-200/65 max-w-2xl mx-auto text-base sm:text-lg">
              {t('features.subheading')}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureKeys.map((key, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <Reveal key={key} delay={`${i * 80}ms`}>
                  <div className="glass-card p-7 h-full flex gap-5 items-start gold-glow-hover cursor-default">
                    <div className="flex-shrink-0 p-3.5 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/50 dark:to-brand-900/20 border border-brand-200/50 dark:border-brand-700/30">
                      <Icon className="h-6 w-6 text-brand-600 dark:text-brand-300" />
                    </div>
                    <div className="space-y-2.5 min-w-0">
                      <h3 className="font-bold text-[1.05rem] text-[#0B192C] dark:text-brand-50">
                        {t(`features.${key}.title`)}
                      </h3>
                      <p className="text-sm text-[#0B192C]/65 dark:text-brand-200/65 leading-relaxed">
                        {t(`features.${key}.desc`)}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            ABOUT SECTION
        ══════════════════════════════════════════════════════════════════════ */}
        <section id="about" className="py-24 px-4 sm:px-6 lg:px-10 bg-white/50 dark:bg-brand-900/10 border-y border-brand-100/40 dark:border-brand-900/30">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-16">
              <h2 className="font-bold text-[clamp(1.8rem,4vw,3rem)] text-[#0B192C] dark:text-brand-50 mb-4">
                {t('about.heading')}
              </h2>
              <div className="section-divider mb-5" />
              <p className="text-[#0B192C]/65 dark:text-brand-200/65 max-w-2xl mx-auto text-base sm:text-lg">
                {t('about.subheading')}
              </p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aboutKeys.map((key, i) => {
                const Icon = ABOUT_ICONS[i];
                return (
                  <Reveal key={key} delay={`${i * 100}ms`}>
                    <div className={`glass-card p-8 flex gap-5 items-start bg-gradient-to-br ${ABOUT_COLORS[i]}`}>
                      <div className="flex-shrink-0 p-3.5 rounded-2xl bg-white/70 dark:bg-white/10 border border-white/50">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-2.5">
                        <h3 className="font-bold text-[1.05rem] text-[#0B192C] dark:text-brand-50">
                          {t(`about.${key}.title`)}
                        </h3>
                        <p className="text-sm text-[#0B192C]/70 dark:text-brand-200/70 leading-relaxed">
                          {t(`about.${key}.desc`)}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            BLOG SECTION
        ══════════════════════════════════════════════════════════════════════ */}
        <section id="blog" className="py-24 px-4 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-16">
              <h2 className="font-bold text-[clamp(1.8rem,4vw,3rem)] text-[#0B192C] dark:text-brand-50 mb-4">
                {t('blog.heading')}
              </h2>
              <div className="section-divider mb-5" />
              <p className="text-[#0B192C]/65 dark:text-brand-200/65 max-w-xl mx-auto">
                {t('blog.subheading')}
              </p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {posts.map((post: any, i: number) => (
                <Reveal key={i} delay={`${i * 80}ms`}>
                  <article className="glass-card p-7 flex flex-col h-full blue-glow-hover cursor-pointer group">
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 border border-brand-200/50 dark:border-brand-700/40 mb-4 self-start">
                      {post.tag}
                    </span>
                    <h3 className="font-bold text-[1rem] text-[#0B192C] dark:text-brand-50 mb-3 leading-snug group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-[#0B192C]/60 dark:text-brand-200/60 leading-relaxed flex-1 mb-5">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-[11px] font-medium text-[#0B192C]/45 dark:text-brand-300/45 pt-4 border-t border-brand-100/50 dark:border-brand-800/30">
                      <span>{post.date}</span>
                      <span className="flex items-center gap-1 text-brand-600 dark:text-brand-300 font-semibold">
                        {t('blog.readMore')} <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            TESTIMONIALS SECTION
        ══════════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-4 sm:px-6 lg:px-10 bg-gradient-to-br from-brand-100/50 to-brand-50/30 dark:from-brand-900/20 dark:to-[#06101C] border-y border-brand-100/40 dark:border-brand-900/30">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-16">
              <h2 className="font-bold text-[clamp(1.8rem,4vw,3rem)] text-[#0B192C] dark:text-brand-50 mb-4">
                {t('testimonials.heading')}
              </h2>
              <div className="section-divider mb-5" />
              <p className="text-[#0B192C]/65 dark:text-brand-200/65 max-w-xl mx-auto">
                {t('testimonials.subheading')}
              </p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((item: any, i: number) => (
                <Reveal key={i} delay={`${i * 100}ms`}>
                  <div className="glass-card p-7 flex flex-col h-full relative">
                    <Quote className="absolute top-5 right-5 h-8 w-8 text-brand-200/40 dark:text-brand-700/30" />
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} className="h-4 w-4 text-gold-400 fill-gold-400" />
                      ))}
                    </div>
                    <p className="text-sm text-[#0B192C]/75 dark:text-brand-200/75 leading-relaxed italic flex-1 mb-6">
                      "{item.quote}"
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-brand-100/50 dark:border-brand-800/30">
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0B192C] dark:text-brand-50">{item.name}</p>
                        <p className="text-xs text-[#0B192C]/50 dark:text-brand-300/50">{item.role}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            CONTACT SECTION
        ══════════════════════════════════════════════════════════════════════ */}
        <section id="contact" className="py-24 px-4 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-16">
              <h2 className="font-bold text-[clamp(1.8rem,4vw,3rem)] text-[#0B192C] dark:text-brand-50 mb-4">
                {t('contact.heading')}
              </h2>
              <div className="section-divider mb-5" />
              <p className="text-[#0B192C]/65 dark:text-brand-200/65 max-w-xl mx-auto">
                {t('contact.subheading')}
              </p>
            </Reveal>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

              {/* ── Left: Contact Info Card ───────────────────────────────── */}
              <Reveal className="lg:col-span-2">
                <div className="glass-card p-8 h-full space-y-6">
                  <h3 className="font-bold text-[1.1rem] text-[#0B192C] dark:text-brand-50 mb-2">
                    न्याय Mitra
                  </h3>
                  <p className="text-sm text-[#0B192C]/65 dark:text-brand-200/65 leading-relaxed">
                    {t('footer.mission')}
                  </p>

                  <div className="space-y-4 pt-2">
                    {[
                      { icon: Mail,   label: t('contact.email'),   value: 'info@nyayamitra.org' },
                      { icon: Phone,  label: t('contact.phone'),   value: '+977 1-4200000' },
                      { icon: MapPin, label: t('contact.address'), value: 'Kathmandu, Nepal' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-4 p-3.5 rounded-2xl bg-brand-50/60 dark:bg-brand-900/30 border border-brand-100/50 dark:border-brand-800/30">
                        <div className="p-2.5 rounded-xl bg-gold-50 dark:bg-gold-900/20 border border-gold-200/40 dark:border-gold-700/30">
                          <Icon className="h-4 w-4 text-gold-600 dark:text-gold-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#0B192C]/45 dark:text-brand-300/45">{label}</p>
                          <p className="text-sm font-semibold text-[#0B192C] dark:text-brand-50 mt-0.5">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Social Icons */}
                  <div className="pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400 mb-3">
                      {t('contact.socials')}
                    </p>
                    <div className="flex gap-3">
                      {[Facebook, Linkedin, Instagram, Twitter].map((Icon, i) => (
                        <a key={i} href="#"
                          className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/40 border border-brand-100/50 dark:border-brand-800/40 text-[#0B192C]/60 dark:text-brand-300/60 hover:text-brand-600 dark:hover:text-brand-300 hover:border-brand-400/50 hover:scale-110 transition-all duration-200">
                          <Icon className="h-4 w-4" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* ── Right: Contact Form ───────────────────────────────────── */}
              <Reveal className="lg:col-span-3" delay="100ms">
                <div className="glass-card p-8 h-full">
                  <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
                          {t('contact.formName')}
                        </label>
                        <input
                          type="text"
                          placeholder={t('contact.formPlaceholderName')}
                          className="glass-input w-full px-4 py-3 text-sm text-[#0B192C] dark:text-brand-50 placeholder-[#0B192C]/35 dark:placeholder-brand-300/35"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
                          {t('contact.formEmail')}
                        </label>
                        <input
                          type="email"
                          placeholder={t('contact.formPlaceholderEmail')}
                          className="glass-input w-full px-4 py-3 text-sm text-[#0B192C] dark:text-brand-50 placeholder-[#0B192C]/35 dark:placeholder-brand-300/35"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
                        {t('contact.formMessage')}
                      </label>
                      <textarea
                        rows={6}
                        placeholder={t('contact.formPlaceholderMessage')}
                        className="glass-input w-full px-4 py-3 text-sm text-[#0B192C] dark:text-brand-50 placeholder-[#0B192C]/35 dark:placeholder-brand-300/35 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn-primary w-full py-4 text-sm font-semibold inline-flex items-center justify-center gap-2"
                    >
                      {t('contact.formSend')}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════════════════════════════ */}
        <footer className="bg-[#0B192C] dark:bg-[#03080F] border-t border-brand-900/30">
          {/* Main footer content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Brand */}
            <div className="space-y-5 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-gold-500/15 border border-gold-500/25">
                  <Scale className="h-5 w-5 text-gold-400" />
                </div>
                <span className="font-bold text-lg tracking-wide text-brand-50">न्याय Mitra</span>
              </div>
              <p className="text-sm text-brand-300/65 leading-relaxed">{t('footer.mission')}</p>
              <p className="text-xs text-gold-500/80 italic">{t('footer.tagline')}</p>

              {/* Social icons */}
              <div className="flex gap-3 pt-1">
                {[Facebook, Linkedin, Instagram, Twitter].map((Icon, i) => (
                  <a key={i} href="#"
                    className="p-2.5 rounded-xl bg-brand-800/40 border border-brand-700/30 text-brand-400 hover:text-gold-400 hover:border-gold-500/40 hover:scale-110 transition-all duration-200">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400">{t('footer.quickLinks')}</h4>
              <ul className="space-y-2.5 text-sm font-medium text-brand-300/70">
                {[
                  ['home', t('nav.home')],
                  ['about', t('nav.about')],
                  ['blog', t('nav.blog')],
                  ['contact', t('nav.contact')],
                ].map(([id, label]) => (
                  <li key={id}>
                    <button
                      onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })}
                      className="hover:text-brand-50 hover:translate-x-1 transition-all duration-200 inline-flex"
                    >
                      {label}
                    </button>
                  </li>
                ))}
                <li><Link href="/" className="hover:text-brand-50 hover:translate-x-1 transition-all inline-flex">{t('footer.privacyPolicy')}</Link></li>
                <li><Link href="/" className="hover:text-brand-50 hover:translate-x-1 transition-all inline-flex">{t('footer.termsOfService')}</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400">{t('footer.services')}</h4>
              <ul className="space-y-2.5 text-sm font-medium text-brand-300/70">
                {[
                  [user ? '/assistant' : '/signup', 'AI Assistant'],
                  [user ? '/community' : '/signup', 'Community Support'],
                  [user ? '/awareness' : '/signup', 'Legal Awareness'],
                  [user ? '/lawyers'   : '/signup', 'Mentorship'],
                ].map(([href, label]) => (
                  <li key={label}>
                    <Link href={href} className="hover:text-brand-50 hover:translate-x-1 transition-all duration-200 inline-flex">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400">{t('footer.contactInfo')}</h4>
              <ul className="space-y-3 text-sm text-brand-300/70">
                {[
                  { icon: Mail,   value: 'info@nyayamitra.org' },
                  { icon: Phone,  value: '+977 1-4200000' },
                  { icon: MapPin, value: 'Kathmandu, Nepal' },
                ].map(({ icon: Icon, value }) => (
                  <li key={value} className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-gold-400 flex-shrink-0" />
                    <span className="hover:text-brand-50 transition-colors">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-brand-800/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-brand-400/60">
              <p>&copy; {new Date().getFullYear()} न्याय Mitra. {t('footer.rights')}</p>
              <div className="flex gap-5">
                <Link href="/" className="hover:text-brand-200 transition-colors">{t('footer.privacyPolicy')}</Link>
                <Link href="/" className="hover:text-brand-200 transition-colors">{t('footer.termsOfService')}</Link>
              </div>
            </div>
          </div>
        </footer>

      </div>{/* end md:pl-[280px] */}
    </div>
  );
}
