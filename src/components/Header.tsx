'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Scale, Menu, LogIn, User, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/LanguageContext';

const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  // Shrink header on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const openMobileSidebar = () => {
    window.dispatchEvent(new Event('nyaya-sidebar-open'));
  };

  const dashboardHref = user?.role === 'admin' ? '/admin-panel' : '/dashboard';

  return (
    <header
      className={`
        fixed top-0 right-0 z-40
        md:left-[280px] left-0
        transition-all duration-300
        ${scrolled
          ? 'bg-white/90 dark:bg-[#0B192C]/90 backdrop-blur-xl shadow-sm border-b border-brand-100/60 dark:border-brand-900/40'
          : 'bg-white/70 dark:bg-[#0B192C]/70 backdrop-blur-md'
        }
      `}
    >
      <div className="flex items-center justify-between h-[72px] px-4 sm:px-6 lg:px-8 max-w-7xl">

        {/* ── Left: Hamburger (mobile) + Brand ─────────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Hamburger — mobile only */}
          <button
            id="mobile-menu-toggle"
            onClick={openMobileSidebar}
            aria-label="Open navigation"
            className="md:hidden p-2 rounded-xl text-[#0B192C]/70 dark:text-brand-200/70 hover:bg-brand-100/60 dark:hover:bg-brand-900/30 transition-all"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Brand logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/30 group-hover:border-gold-500/60 transition-all">
              <Scale className="h-5 w-5 text-gold-500" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-[1.1rem] tracking-wide text-[#0B192C] dark:text-brand-50 group-hover:text-brand-700 dark:group-hover:text-brand-200 transition-colors block leading-none">
                न्याय Mitra
              </span>
              <span className="text-[9px] tracking-widest text-gold-600 dark:text-gold-400 font-medium uppercase block">
                Friend of Justice
              </span>
            </div>
          </Link>
        </div>

        {/* ── Right: Auth Actions ───────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          {!loading && user ? (
            <>
              <Link
                href={dashboardHref}
                id="nav-dashboard-link"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold bg-[#0B192C] dark:bg-brand-100 text-white dark:text-[#0B192C] hover:bg-brand-800 dark:hover:bg-brand-50 transition-all shadow-sm"
              >
                {user.role === 'admin'
                  ? <ShieldAlert className="h-4 w-4 text-gold-400" />
                  : <User className="h-4 w-4" />
                }
                {user.role === 'admin' ? t('nav.adminPanel') : t('nav.dashboard')}
              </Link>

              <button
                onClick={handleLogout}
                id="nav-logout-btn"
                title={t('nav.logout')}
                aria-label={t('nav.logout')}
                className="p-2.5 rounded-2xl border border-red-300/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                id="nav-login-link"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold text-[#0B192C]/80 dark:text-brand-200/80 hover:text-brand-700 dark:hover:text-brand-100 transition-colors"
              >
                <LogIn className="h-4 w-4 text-gold-500" />
                {t('nav.login')}
              </Link>

              <Link
                href="/signup"
                id="nav-register-link"
                className="btn-primary px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-1.5"
              >
                {t('nav.signup')}
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;
