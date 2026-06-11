'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './db';
import type { Profile } from './db';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      // No Supabase configured — not authenticated
      setLoading(false);
      return;
    }

    // Safety: never block UI for more than 8 seconds
    const timeout = setTimeout(() => setLoading(false), 8000);

    // 1. Initial session check on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await resolveProfile(session.user.id, session.user.email ?? '', session.user.user_metadata);
      } else {
        setUser(null);
      }
      setLoading(false);
      clearTimeout(timeout);
    }).catch((err) => {
      console.error('Initial session check failed:', err);
      setUser(null);
      setLoading(false);
      clearTimeout(timeout);
    });

    // 2. Subscribe to live auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await resolveProfile(session.user.id, session.user.email ?? '', session.user.user_metadata);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Helper: fetch the profile row, fallback to metadata, auto-create if missing
  const resolveProfile = async (
    id: string,
    email: string,
    metadata: Record<string, unknown>
  ) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setUser(data as Profile);
        return;
      }

      // Profile row doesn't exist yet — try to insert it (trigger may have been slow)
      if (error?.code === 'PGRST116') {
        const { data: inserted } = await supabase
          .from('profiles')
          .insert({
            id,
            email,
            full_name: (metadata?.full_name as string) || 'New Member',
            role: 'user',
          })
          .select()
          .single();

        if (inserted) {
          setUser(inserted as Profile);
          return;
        }
      }

      // Final fallback: use metadata directly
      setUser({
        id,
        email,
        full_name: (metadata?.full_name as string) || 'User',
        role: 'user',
        created_at: new Date().toISOString(),
      });
    } catch {
      setUser({
        id,
        email,
        full_name: (metadata?.full_name as string) || 'User',
        role: 'user',
        created_at: new Date().toISOString(),
      });
    }
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  return useContext(AuthContext);
}
