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
const deriveRole = (user: User): UserRole => {
  const metadataRole = user.user_metadata?.role;
  if (metadataRole === 'master' || metadataRole === 'contador') return metadataRole;
  return user.email?.toLowerCase().includes('master') ? 'master' : 'contador';
};

const fallbackProfile = (user: User): Profile => ({
  id: user.id,
  full_name: deriveName(user),
  role: deriveRole(user)
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = async (user: User) => {
    const payload = fallbackProfile(user);

    try {
      const upsertResult = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
      if (upsertResult.error) {
        console.warn('Falha no upsert de profiles, seguindo com fallback local:', upsertResult.error.message);
        setProfile(payload);
        return;
      }

      const profileResult = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .eq('id', user.id)
        .single();

      if (profileResult.error || !profileResult.data) {
        console.warn('Falha ao buscar profile, seguindo com fallback local:', profileResult.error?.message);
        setProfile(payload);
        return;
      }

      const data = profileResult.data as Profile;

      if (!data.full_name && typeof window !== 'undefined') {
        const informedName = window.prompt('Informe seu nome para concluir seu perfil:', deriveName(user))?.trim();
        if (informedName) {
          await supabase.from('profiles').upsert({ id: user.id, full_name: informedName, role: data.role || payload.role }, { onConflict: 'id' });
          data.full_name = informedName;
        }
      }

      setProfile(data);
    } catch (error) {
      console.error('Erro ao garantir profile. Aplicando fallback para não travar app:', error);
      setProfile(payload);
    }
  };

  const refreshProfile = async () => {
    const currentUser = session?.user;
    if (!currentUser) {
      setProfile(null);
      return;
    }

    await ensureProfile(currentUser);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const currentSession = data.session;
        setSession(currentSession);

        if (currentSession?.user) {
          await ensureProfile(currentSession.user);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Erro ao inicializar sessão/auth provider:', error);
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        await ensureProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
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
