'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Scale, Menu, X, LogIn, User, ShieldAlert, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Sync theme state on mount and theme-change events
  useEffect(() => {
    const syncTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };
    syncTheme();
    window.addEventListener('theme-change', syncTheme);
    return () => window.removeEventListener('theme-change', syncTheme);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

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
    setIsOpen(false);
    await signOut();
    router.push('/');
  };

  const dashboardHref = user?.role === 'admin' ? '/admin-panel' : '/dashboard';

  const navLinks = !loading && user
    ? [
        { name: 'Home', href: '/' },
        { name: 'Dashboard', href: dashboardHref },
      ]
    : [
        { name: 'Home', href: '/' },
        { name: 'Login', href: '/login' },
        { name: 'Signup', href: '/signup' },
      ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-legal-gold/15 bg-legal-bone-light dark:bg-legal-navy-dark transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex md:grid md:grid-cols-3 justify-between items-center h-20">
          {/* Logo - Left Col */}
          <Link href="/" className="flex items-center gap-3 group justify-start">
            <div className="p-2.5 rounded-xl bg-legal-gold/10 border border-legal-gold/30 text-legal-gold group-hover:bg-legal-gold/20 transition-all duration-300">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-legal-navy dark:text-legal-bone-light group-hover:text-legal-gold transition-colors duration-300">
                NYAYA MITRA
              </span>
              <span className="block text-[10px] tracking-widest text-legal-gold font-sans uppercase">
                Friend of Justice
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links - Center Col */}
          <div className="hidden md:flex justify-center items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              
              if (link.name === 'Login') {
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    id="nav-login-link"
                    className="flex items-center gap-1.5 font-sans text-sm font-semibold text-legal-navy/80 dark:text-legal-bone/80 hover:text-legal-navy dark:hover:text-legal-bone-light transition-colors duration-300"
                  >
                    <LogIn className="h-4 w-4 text-legal-gold" />
                    Login
                  </Link>
                );
              }
              
              if (link.name === 'Signup') {
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    id="nav-register-link"
                    className="px-5 py-2.5 rounded-xl font-sans text-sm font-semibold bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark shadow-md hover:shadow-lg transition-all duration-300 border border-legal-gold/20 hover:border-legal-gold"
                  >
                    Signup
                  </Link>
                );
              }

              if (link.name === 'Dashboard') {
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    id="nav-dashboard-link"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-sans uppercase tracking-wider bg-legal-navy dark:bg-legal-bone text-legal-bone-light dark:text-legal-navy hover:bg-legal-navy-light dark:hover:bg-legal-bone-dark shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    {user?.role === 'admin' ? (
                      <ShieldAlert className="h-4 w-4 text-legal-gold" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    {user?.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                  </Link>
                );
              }

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`font-sans text-sm font-semibold tracking-wide transition-all duration-300 relative py-1
                    ${isActive
                      ? 'text-legal-gold'
                      : 'text-legal-navy/70 dark:text-legal-bone/70 hover:text-legal-navy dark:hover:text-legal-bone-light'
                    }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-legal-gold to-legal-gold/30 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Actions & Theme Toggle - Right Col */}
          <div className="flex justify-end items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              {/* Theme Toggle */}
              <div className="p-0.5 bg-white rounded-xl shadow-sm border border-gray-200/50 flex items-center">
                <button
                  onClick={toggleTheme}
                  id="theme-toggle-desktop"
                  className="p-2 rounded-xl bg-white text-gray-800 hover:bg-gray-100 transition-all duration-300 flex items-center justify-center"
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-amber-500 fill-amber-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-indigo-600 fill-indigo-600" />
                  )}
                </button>
              </div>

              {/* Logout button (rendered separately when logged in) */}
              {!loading && user && (
                <button
                  onClick={handleLogout}
                  id="nav-logout-btn"
                  title="Log Out"
                  className="p-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/5 transition-all duration-300"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Mobile menu toggle & Theme Toggle */}
            <div className="md:hidden flex items-center gap-2">
              {/* Theme Toggle Mobile */}
              <div className="p-0.5 bg-white rounded-xl shadow-sm border border-gray-200/50 flex items-center">
                <button
                  onClick={toggleTheme}
                  id="theme-toggle-mobile"
                  className="p-2 rounded-xl bg-white text-gray-800 hover:bg-gray-100 transition-all duration-300 flex items-center justify-center"
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 text-amber-500 fill-amber-500" />
                  ) : (
                    <Moon className="h-4 w-4 text-indigo-600 fill-indigo-600" />
                  )}
                </button>
              </div>
              <button
                onClick={() => setIsOpen(!isOpen)}
                id="mobile-menu-toggle"
                className="inline-flex items-center justify-center p-2 rounded-xl text-legal-navy dark:text-legal-bone-light hover:bg-legal-gold/10 focus:outline-none transition-all"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden glass-panel-light dark:glass-panel-dark border-t border-legal-gold/15 py-4 px-6 animate-fade-in absolute w-full left-0 shadow-lg">
          <div className="space-y-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;

              if (link.name === 'Signup') {
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex justify-center items-center w-full py-3 rounded-xl font-semibold bg-gradient-to-br from-legal-gold to-legal-gold-dark text-legal-navy-dark shadow-md"
                  >
                    Signup
                  </Link>
                );
              }

              if (link.name === 'Login') {
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-base font-semibold text-legal-navy/80 dark:text-legal-bone/80 border border-legal-gold/20 rounded-xl bg-legal-bone dark:bg-legal-navy-dark"
                  >
                    <LogIn className="h-4 w-4 text-legal-gold animate-pulse" />
                    Login
                  </Link>
                );
              }

              if (link.name === 'Dashboard') {
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-bold bg-legal-navy dark:bg-legal-bone text-legal-bone-light dark:text-legal-navy"
                  >
                    {user?.role === 'admin' ? <ShieldAlert className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    {user?.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                  </Link>
                );
              }

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block py-2 text-base font-semibold tracking-wide
                    ${isActive ? 'text-legal-gold border-l-2 border-legal-gold pl-2' : 'text-legal-navy/70 dark:text-legal-bone/70'}`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* If logged in, show Logout button at the bottom of mobile menu */}
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold border border-red-500/20 text-red-500 hover:bg-red-500/5 mt-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
