import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const GUEST_STORAGE_KEY = 'sentitrack_guest_user';

export const GUEST_USER: User = {
  id: 'guest-user-001',
  app_metadata: {},
  user_metadata: { display_name: 'Guest Analyst' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'analyst@sentitrack.local',
  phone: '',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signInAsGuest: () => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user previously logged in as Guest
    const hasGuest = localStorage.getItem(GUEST_STORAGE_KEY) === 'true';
    if (hasGuest) {
      setUser(GUEST_USER);
      setIsGuest(true);
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Safety timeout: ensure loading finishes within 1.5s even if Supabase is unreachable
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
      }
    }, 1500);

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        setIsGuest(false);
        setLoading(false);
      });

      supabase.auth.getSession()
        .then(({ data: { session } }) => {
          if (!isMounted) return;
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        })
        .catch((err) => {
          console.warn('Failed to get Supabase session:', err);
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
        subscription.unsubscribe();
      };
    } catch (e) {
      console.warn('Supabase auth init exception:', e);
      setLoading(false);
    }
  }, []);

  const signInAsGuest = () => {
    localStorage.setItem(GUEST_STORAGE_KEY, 'true');
    setUser(GUEST_USER);
    setIsGuest(true);
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    setIsGuest(false);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    setIsGuest(false);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split('@')[0] },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signOut = async () => {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    setIsGuest(false);
    setUser(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isGuest, signInAsGuest, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

