'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Scale, LayoutDashboard, MessageSquareCode, FileWarning, 
  Compass, User, ShieldAlert, Gavel, Radio, LogOut, 
  ChevronLeft, ChevronRight, Users, Briefcase, Settings, Moon, Sun, Globe
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/LanguageContext';

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const syncTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };
    syncTheme();
    window.addEventListener('theme-change', syncTheme);
    return () => window.removeEventListener('theme-change', syncTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    setTheme(nextTheme);
    window.dispatchEvent(new Event('theme-change'));
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  // Redirect if not authenticated (after loading finishes)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) return null;

  if (user.is_blocked) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#06101c] p-4 text-[#EBF4FF]">
        <div className="bg-[#0c1827] border-2 border-red-500/30 rounded-[32px] max-w-md w-full p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="p-4 bg-red-500/15 rounded-2xl w-fit mx-auto text-red-500">
            <ShieldAlert className="h-12 w-12 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-white">Access Denied</h1>
            <p className="text-sm text-red-400 font-bold uppercase tracking-wider font-sans">Account Blocked</p>
          </div>
          <p className="text-xs text-brand-200/80 leading-relaxed font-sans font-medium">
            Your account has been suspended by an administrator for violating community guidelines, posting inappropriate content, or sharing misleading comments.
          </p>
          <div className="border-t border-[#D4AF37]/10 pt-4 space-y-4">
            <p className="text-[10px] text-brand-300/60 font-sans">
              If you believe this is a mistake, please reach out to support at <strong>support@nyayamitra.org.np</strong>.
            </p>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-widest shadow-md transition-all active:scale-95 cursor-pointer font-sans"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  const userLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Legal Assistant', href: '/assistant', icon: MessageSquareCode },
    { name: 'Report Incident', href: '/report', icon: FileWarning },
    { name: 'Case Tracking', href: '/cases', icon: Compass },
    { name: 'Community', href: '/community', icon: Users },
    { name: 'Verified Lawyers', href: '/lawyers', icon: Briefcase },
  ];

  const adminLinks = [
    { name: 'Admin Overview', href: '/admin-panel', icon: ShieldAlert },
    { name: 'Case Review', href: '/admin-panel/cases', icon: Gavel },
    { name: 'Manage Lawyers', href: '/admin-panel/lawyers', icon: Briefcase },
    { name: 'Manage Feed', href: '/admin-panel/feed', icon: Users },
  ];

  const activeLinks = isAdmin ? adminLinks : userLinks;

  return (
    <aside 
      className={`relative h-screen bg-legal-navy text-legal-bone border-r border-legal-gold/15 flex flex-col justify-between transition-all duration-300 z-30 shadow-glass-dark
        ${isCollapsed ? 'w-20' : 'w-64 md:w-72'}`}
    >
      {/* Top Header */}
      <div>
        <div className="h-24 flex items-center justify-between px-6 border-b border-legal-gold/10">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 rounded-xl bg-legal-gold/15 border border-legal-gold/30 text-legal-gold flex-shrink-0">
              <Scale className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in">
                <span className="font-serif text-lg font-bold tracking-wider text-legal-bone block">
                  NYAYA MITRA
                </span>
                <span className="block text-[8px] tracking-widest text-legal-gold font-sans uppercase">
                  {isAdmin ? 'ADMIN PORTAL' : 'CLIENT WORKSPACE'}
                </span>
              </div>
            )}
          </Link>
        </div>



        {/* Navigation items */}
        <nav className="mt-6 px-4 space-y-1.5">
          {activeLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative
                  ${isActive 
                    ? 'bg-gradient-to-r from-legal-gold/20 to-legal-gold/5 text-legal-gold border-l-2 border-legal-gold' 
                    : 'text-legal-bone/70 hover:bg-legal-gold/5 hover:text-legal-bone-light'
                  }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-legal-gold' : 'text-legal-bone/60 group-hover:text-legal-gold transition-colors'}`} />
                {!isCollapsed && (
                  <span className="text-sm font-semibold tracking-wide font-sans animate-fade-in truncate">
                    {link.name}
                  </span>
                )}
                
                {/* Tooltip on collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-legal-navy-dark border border-legal-gold/20 rounded-md text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-50">
                    {link.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-legal-gold/10 bg-legal-navy-dark/20">
        {/* Theme and Home Page shortcuts removed per user preferences */}

        {/* Settings Dropdown Button */}
        <div className="relative mb-2.5">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-legal-gold/5 transition-all duration-300 group w-full
              ${showSettings ? 'bg-legal-gold/10 text-legal-gold' : 'text-legal-bone/80'}`}
          >
            <Settings className={`h-5 w-5 flex-shrink-0 transition-colors ${showSettings ? 'text-legal-gold' : 'text-legal-bone/60 group-hover:text-legal-gold'}`} />
            {!isCollapsed && (
              <span className="text-sm font-semibold tracking-wide font-sans">Settings</span>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-legal-navy-dark border border-legal-gold/20 rounded-md text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-50 text-legal-bone">
                Settings
              </div>
            )}
          </button>
          
          {/* Settings Menu Popup */}
          {showSettings && (
            <div className={`absolute bottom-full left-0 mb-2 w-56 bg-legal-navy dark:bg-[#0c1827] border border-legal-gold/20 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in ${isCollapsed ? 'ml-16' : ''}`}>
              <div className="p-3 space-y-3">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-legal-gold/10 rounded-lg text-legal-bone/90 hover:text-legal-gold transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    <span className="text-xs font-bold font-sans">Theme</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-legal-gold/80 bg-legal-gold/10 px-2 py-0.5 rounded">
                    {theme}
                  </span>
                </button>
                
                {/* Language Toggle */}
                <button
                  onClick={() => {
                    setLanguage(language === 'en' ? 'ne' : 'en');
                    setShowSettings(false); // Optionally close after selecting language
                  }}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-legal-gold/10 rounded-lg text-legal-bone/90 hover:text-legal-gold transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4" />
                    <span className="text-xs font-bold font-sans">Language</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-legal-gold/80 bg-legal-gold/10 px-2 py-0.5 rounded">
                    {language === 'en' ? 'EN' : 'NE'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Clickable User Profile Settings shortcut */}
        <Link
          href="/profile"
          className={`flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-legal-gold/5 transition-all duration-300 group relative mb-2.5 border border-transparent
            ${pathname === '/profile' ? 'bg-legal-gold/10 border-legal-gold/20 text-legal-gold' : 'text-legal-bone/80'}`}
        >
          <div className="h-9 w-9 rounded-xl bg-legal-gold/10 border border-legal-gold/25 flex items-center justify-center text-legal-gold font-serif font-bold flex-shrink-0">
            {(user.full_name || 'U').charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden text-left">
              <h4 className="text-xs font-semibold tracking-wide truncate group-hover:text-legal-gold transition-colors">{user.full_name || 'New Member'}</h4>
              <p className="text-[9px] text-legal-gold font-sans truncate">{user.email}</p>
            </div>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-legal-navy-dark border border-legal-gold/20 rounded-md text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-50 text-legal-bone">
              Profile Settings
            </div>
          )}
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-4 w-full px-4 py-3 rounded-xl text-red-400/80 hover:bg-red-500/5 hover:text-red-400 transition-all duration-300 group relative"
        >
          <LogOut className="h-5 w-5 flex-shrink-0 text-red-500/60 group-hover:text-red-500 transition-colors" />
          {!isCollapsed && (
            <span className="text-sm font-semibold tracking-wide font-sans truncate">Log Out</span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-legal-navy-dark border border-legal-gold/20 rounded-md text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-50">
              Log Out
            </div>
          )}
        </button>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3.5 top-10 h-7 w-7 rounded-full bg-legal-navy border border-legal-gold/20 hover:border-legal-gold items-center justify-center text-legal-gold cursor-pointer shadow-md shadow-black/20 hover:scale-105 transition-all"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
