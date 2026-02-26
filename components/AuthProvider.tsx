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
const fallbackProfile = (user: User): Profile => ({
  id: user.id,
  full_name: deriveName(user),
  role: 'contador'
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = async (user: User) => {
    const fallback = fallbackProfile(user);

    try {
      const profileResult = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .eq('id', user.id)
        .maybeSingle();

      if (profileResult.error) {
        console.warn('Falha ao buscar profile, aplicando fallback local:', profileResult.error.message);
        setProfile(fallback);
        return;
      }

      let data = profileResult.data as Profile | null;

      if (!data) {
        const createResult = await supabase
          .from('profiles')
          .insert({ id: user.id, full_name: fallback.full_name, role: 'contador' })
          .select('id, full_name, role, created_at')
          .single();

        if (createResult.error) {
          console.warn('Falha ao criar profile automaticamente, aplicando fallback local:', createResult.error.message);
          setProfile(fallback);
          return;
        }

        data = createResult.data as Profile;
      }

      if (!data.full_name && typeof window !== 'undefined') {
        const informedName = window.prompt('Informe seu nome para concluir seu perfil:', deriveName(user))?.trim();
        if (informedName) {
          const updateResult = await supabase
            .from('profiles')
            .update({ full_name: informedName })
            .eq('id', user.id)
            .select('id, full_name, role, created_at')
            .single();

          if (!updateResult.error && updateResult.data) {
            data = updateResult.data as Profile;
          } else {
            data.full_name = informedName;
          }
        }
      }

      setProfile(data);
    } catch (error) {
      console.error('Erro ao garantir profile. Aplicando fallback para não travar app:', error);
      setProfile(fallback);
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
    let isMounted = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const currentSession = data.session;
        if (!isMounted) return;

        setSession(currentSession);
        setLoading(false);

        if (currentSession?.user) {
          void ensureProfile(currentSession.user);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Erro ao inicializar sessão/auth provider:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setLoading(false);

      if (newSession?.user) {
        void ensureProfile(newSession.user);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
