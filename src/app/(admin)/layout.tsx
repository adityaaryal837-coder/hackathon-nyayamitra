'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Clock, ShieldAlert } from 'lucide-react';

/**
 * Admin Layout — guards all /admin-panel routes.
 * Only users with role === 'admin' can access these pages.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-legal-bone-light dark:bg-legal-navy-dark text-legal-gold">
        <div className="text-center space-y-4">
          <Clock className="h-10 w-10 animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wider font-sans uppercase">Loading Admin Portal...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex h-screen items-center justify-center bg-legal-bone-light dark:bg-legal-navy-dark text-legal-gold">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-10 w-10 mx-auto" />
          <p className="text-sm font-semibold tracking-wider font-sans uppercase">Access Denied</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
