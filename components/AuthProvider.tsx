import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export type UserRole = 'master' | 'contador';

interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at?: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  isMaster: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const deriveName = (user: User) => user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário';
const deriveRole = (user: User): UserRole => (user.email?.toLowerCase().includes('master') ? 'master' : 'contador');

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = async (user: User) => {
    const payload = {
      id: user.id,
      full_name: deriveName(user),
      role: deriveRole(user)
    };

    await supabase.from('profiles').upsert(payload, { onConflict: 'id' });

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .eq('id', user.id)
      .single();

    if (data) {
      if (!data.full_name && typeof window !== 'undefined') {
        const informedName = window.prompt('Informe seu nome para concluir seu perfil:', deriveName(user))?.trim();
        if (informedName) {
          await supabase.from('profiles').upsert({ id: user.id, full_name: informedName, role: data.role || payload.role }, { onConflict: 'id' });
          data.full_name = informedName;
        }
      }
      setProfile(data as Profile);
    }
  };

  const refreshProfile = async () => {
    const user = session?.user;
    if (!user) {
      setProfile(null);
      return;
    }
    await ensureProfile(user);
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;
      setSession(currentSession);
      if (currentSession?.user) await ensureProfile(currentSession.user);
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await ensureProfile(newSession.user);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    refreshProfile,
    isMaster: profile?.role === 'master'
  }), [session, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
