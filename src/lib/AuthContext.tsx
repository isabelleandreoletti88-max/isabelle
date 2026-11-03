import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, type Profile } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function applySession(nextSession: Session | null) {
      setSession(nextSession);
      if (nextSession) {
        await loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
      if (active) setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (active) void applySession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setLoading(true);
      void applySession(nextSession);
    });

    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('id,email,full_name,role').eq('id', userId).maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? 'Identifiants incorrects ou accès indisponible.' : null };
  }
  async function signOut() { await supabase.auth.signOut(); }
  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin/login?reset=1` });
    return { error: error ? 'Impossible d’envoyer le lien pour le moment.' : null };
  }
  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? 'Impossible de modifier le mot de passe.' : null };
  }

  return <AuthContext.Provider value={{ session, profile, loading, signIn, signOut, resetPassword, updatePassword }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider manquant');
  return value;
}
