import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import * as api from '@/lib/api';
import { deleteToken, setToken } from '@/lib/token-storage';

type AuthState = {
  user: api.User | null;
  /** true tant qu'on n'a pas fini de charger la session au démarrage */
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  /** Envoie l'email de réinitialisation. */
  requestPasswordReset: (email: string) => Promise<void>;
  /** Réinitialise le mot de passe via le token reçu par email et connecte l'utilisateur. */
  resetPassword: (token: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<api.User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Au démarrage : si un token est stocké, on réhydrate l'utilisateur via /me
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { user } = await api.me();
        if (active) setUser(user);
      } catch {
        // token absent/expiré/invalide → on reste déconnecté
        if (active) setUser(null);
      } finally {
        if (active) setInitializing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { token, user } = await api.login(email, password);
    await setToken(token);
    setUser(user);
  }

  async function signUp(input: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    // Payload ne renvoie pas de token à la création → on crée puis on se connecte
    await api.register(input);
    await signIn(input.email, input.password);
  }

  async function requestPasswordReset(email: string) {
    await api.forgotPassword(email);
  }

  async function resetPassword(token: string, password: string) {
    const { token: jwt, user } = await api.resetPassword(token, password);
    await setToken(jwt);
    setUser(user);
  }

  async function signOut() {
    try {
      await api.logout();
    } catch {
      // on ignore l'erreur réseau : l'important est d'effacer la session locale
    }
    await deleteToken();
    setUser(null);
  }

  const value = useMemo<AuthState>(
    () => ({ user, initializing, signIn, signUp, signOut, requestPasswordReset, resetPassword }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un <AuthProvider>');
  return ctx;
}
