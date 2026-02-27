import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

type ProfileRole = 'master' | 'contador';

export interface Profile {
  id: string;
  full_name: string;
  role: ProfileRole;
}

interface AuthContextData {
  loadingAuth: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

const DEFAULT_ROLE: ProfileRole = 'contador';

const normalizeProfile = (userId: string, email: string | null | undefined, rawProfile: Partial<Profile> | null): Profile => {
  const fullName = rawProfile?.full_name?.trim() || email || '';
  const role = rawProfile?.role === 'master' || rawProfile?.role === 'contador' ? rawProfile.role : DEFAULT_ROLE;

  return {
    id: userId,
    full_name: fullName,
    role,
  };
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const latestSyncRef = useRef(0);

  const fetchOrCreateProfile = useCallback(async (currentUser: User): Promise<Profile | null> => {
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (existingProfile) {
        return normalizeProfile(currentUser.id, currentUser.email, existingProfile);
      }

      const fallbackProfile = normalizeProfile(currentUser.id, currentUser.email, null);
      const { data: upsertedProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert(fallbackProfile, { onConflict: 'id' })
        .select('id, full_name, role')
        .single();

      if (upsertError) {
        throw upsertError;
      }

      return normalizeProfile(currentUser.id, currentUser.email, upsertedProfile);
    } catch (error) {
      console.error('Erro ao buscar/criar profile do usuário:', error);
      return null;
    }
  }, []);

  const syncAuthState = useCallback(
    async (nextSession: Session | null) => {
      const syncId = ++latestSyncRef.current;

      try {
        setSession(nextSession);

        if (!nextSession?.user) {
          if (latestSyncRef.current === syncId) {
            setProfile(null);
          }
          return;
        }

        const nextProfile = await fetchOrCreateProfile(nextSession.user);

        if (latestSyncRef.current === syncId) {
          setProfile(nextProfile);
        }
      } catch (error) {
        console.error('Erro ao sincronizar autenticação:', error);
        if (latestSyncRef.current === syncId) {
          setProfile(null);
        }
      } finally {
        if (latestSyncRef.current === syncId) {
          setLoadingAuth(false);
        }
      }
    },
    [fetchOrCreateProfile]
  );

  const refreshProfile = useCallback(async () => {
    const currentUser = session?.user ?? null;

    if (!currentUser) {
      setProfile(null);
      return;
    }

    const refreshedProfile = await fetchOrCreateProfile(currentUser);
    setProfile(refreshedProfile);
  }, [fetchOrCreateProfile, session]);

  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      try {
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!active) {
          return;
        }

        await syncAuthState(currentSession);
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        if (active) {
          setSession(null);
          setProfile(null);
          setLoadingAuth(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) {
        return;
      }

      void syncAuthState(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [syncAuthState]);

  const value = useMemo<AuthContextData>(
    () => ({
      loadingAuth,
      session,
      user: session?.user ?? null,
      profile,
      refreshProfile,
    }),
    [loadingAuth, session, profile, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextData => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }

  return context;
};
