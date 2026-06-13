'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Info, BookOpen, PhoneCall, Globe, Sun, Moon,
  Scale, ChevronLeft, ChevronRight, X, Menu,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface NavItem {
  id: string;
  labelKey: string;
  icon: React.ElementType;
  href?: string;
  isScroll?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', labelKey: 'nav.home', icon: Home, isScroll: true },
  { id: 'about', labelKey: 'nav.about', icon: Info, isScroll: true },
  { id: 'blog', labelKey: 'nav.blog', icon: BookOpen, isScroll: true },
  { id: 'contact', labelKey: 'nav.contact', icon: PhoneCall, isScroll: true },
];

const PublicSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeSection, setActiveSection] = useState('home');

  // ── Theme sync ────────────────────────────────────────────────────────────
  useEffect(() => {
    const sync = () => {
      const dark = document.documentElement.classList.contains('dark');
      setTheme(dark ? 'dark' : 'light');
    };
    sync();
    window.addEventListener('nyaya-theme-change', sync);
    return () => window.removeEventListener('nyaya-theme-change', sync);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('nyaya-theme', next);
    setTheme(next);
    window.dispatchEvent(new Event('nyaya-theme-change'));
  };

  // ── Language toggle ───────────────────────────────────────────────────────
  const toggleLanguage = () => setLanguage(language === 'en' ? 'ne' : 'en');

  // ── Scroll spy ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (pathname !== '/') return;
    const ids = ['home', 'about', 'blog', 'contact'];
    const onScroll = () => {
      const y = window.scrollY + 180;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && y >= el.offsetTop && y < el.offsetTop + el.offsetHeight) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  // ── Sidebar toggle event (from Header hamburger) ──────────────────────────
  useEffect(() => {
    const open = () => setIsMobileOpen(true);
    const close = () => setIsMobileOpen(false);
    window.addEventListener('nyaya-sidebar-open', open);
    window.addEventListener('nyaya-sidebar-close', close);
    return () => {
      window.removeEventListener('nyaya-sidebar-open', open);
      window.removeEventListener('nyaya-sidebar-close', close);
    };
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  const handleNavClick = (item: NavItem) => {
    setIsMobileOpen(false);
    if (item.isScroll) {
      if (pathname === '/') {
        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push(`/#${item.id}`);
      }
    }
  };

  const sidebarWidth = isCollapsed ? 'w-[90px]' : 'w-[280px]';

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* ── Logo ────────────────────────────────────────────────────────── */}
      <div className={`flex items-center h-[72px] border-b border-white/10 dark:border-brand-900/30 px-5 ${isCollapsed && !mobile ? 'justify-center' : 'gap-3'}`}>
        <div className="flex-shrink-0 p-2 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/30">
          <Scale className="h-6 w-6 text-gold-500" />
        </div>
        {(!isCollapsed || mobile) && (
          <div className="animate-fade-in overflow-hidden">
            <span className="font-bold text-lg tracking-wide text-[#0B192C] dark:text-brand-50 block leading-none">
              न्याय Mitra
            </span>
            <span className="text-[10px] tracking-widest text-gold-600 dark:text-gold-400 font-medium uppercase">
              Friend of Justice
            </span>
          </div>
        )}
        {/* Mobile close */}
        {mobile && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="ml-auto p-1.5 rounded-lg text-[#0B192C]/60 dark:text-brand-200/60 hover:bg-black/5"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* ── Nav Items ──────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.isScroll
            ? (activeSection === item.id && pathname === '/')
            : pathname === item.href;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              title={isCollapsed && !mobile ? t(item.labelKey) : undefined}
              className={`
                relative w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl
                transition-all duration-200 group text-left
                ${isActive
                  ? 'nav-item-active'
                  : 'text-[#0B192C]/70 dark:text-brand-200/70 hover:bg-brand-100/60 dark:hover:bg-brand-900/30 hover:text-[#0B192C] dark:hover:text-brand-50'
                }
              `}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-brand-600 dark:text-brand-300' : 'text-[#0B192C]/50 dark:text-brand-300/50 group-hover:text-brand-600 dark:group-hover:text-brand-300'}`} />

              {(!isCollapsed || mobile) && (
                <span className="text-sm font-semibold truncate animate-fade-in">
                  {t(item.labelKey)}
                </span>
              )}

              {/* Active indicator dot for collapsed */}
              {isCollapsed && !mobile && isActive && (
                <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-brand-500" />
              )}

              {/* Tooltip for collapsed */}
              {isCollapsed && !mobile && (
                <span className="absolute left-full ml-3 px-2.5 py-1.5 rounded-xl bg-[#0B192C] dark:bg-brand-100 text-brand-50 dark:text-[#0B192C] text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
                  {t(item.labelKey)}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Bottom Controls ─────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-white/10 dark:border-brand-900/30 space-y-2">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-brand-200/40 dark:border-brand-800/40 bg-white/40 dark:bg-brand-900/30 hover:border-gold-500/50 transition-all group ${isCollapsed && !mobile ? 'justify-center' : ''}`}
          title={isCollapsed && !mobile ? t('nav.language') : undefined}
        >
          <Globe className="h-5 w-5 text-gold-500 flex-shrink-0 group-hover:rotate-12 transition-transform duration-300" />
          {(!isCollapsed || mobile) && (
            <>
              <span className="text-xs font-semibold text-[#0B192C]/80 dark:text-brand-200/80 flex-1 text-left">
                {t('nav.language')}
              </span>
              <span className="text-[11px] font-bold text-gold-600 dark:text-gold-400 bg-gold-50 dark:bg-gold-900/20 px-2 py-0.5 rounded-full">
                {language === 'en' ? 'नेपाली' : 'English'}
              </span>
            </>
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-brand-200/40 dark:border-brand-800/40 bg-white/40 dark:bg-brand-900/30 hover:border-brand-400/50 transition-all group ${isCollapsed && !mobile ? 'justify-center' : ''}`}
          title={isCollapsed && !mobile ? (theme === 'dark' ? t('nav.themeLight') : t('nav.themeDark')) : undefined}
        >
          {theme === 'dark'
            ? <Sun className="h-5 w-5 text-amber-400 flex-shrink-0" />
            : <Moon className="h-5 w-5 text-brand-700 dark:text-brand-300 flex-shrink-0" />
          }
          {(!isCollapsed || mobile) && (
            <span className="text-xs font-semibold text-[#0B192C]/80 dark:text-brand-200/80 flex-1 text-left">
              {theme === 'dark' ? t('nav.themeLight') : t('nav.themeDark')}
            </span>
          )}
        </button>

        {/* Collapse toggle — desktop only */}
        {!mobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center py-2.5 rounded-2xl text-[#0B192C]/40 dark:text-brand-300/40 hover:text-brand-600 dark:hover:text-brand-300 hover:bg-brand-100/50 dark:hover:bg-brand-900/30 transition-all"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed
              ? <ChevronRight className="h-4 w-4" />
              : <ChevronLeft className="h-4 w-4" />
            }
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop Sidebar ───────────────────────────────────────────────────── */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 h-screen z-50 flex-col glass-sidebar transition-all duration-300 ${sidebarWidth}`}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile Overlay ────────────────────────────────────────────────────── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ─────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-50 w-[280px] flex flex-col glass-sidebar md:hidden
          transform transition-transform duration-300
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent mobile />
      </aside>
    </>
  );
};

export default PublicSidebar;
