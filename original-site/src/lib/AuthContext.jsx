import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { neonAuth } from '@/lib/neonAuthClient';

const Context = createContext(null);

// Server-validated Neon Auth session, never a hardcoded preview admin.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setLoading] = useState(true);
  const [authChecked, setChecked] = useState(false);
  const [authError, setError] = useState(null);

  const checkUserAuth = useCallback(async () => {
    if (!neonAuth) {
      setUser(null);
      setError({ type: 'unconfigured', message: 'Kimlik doğrulama bağlantısı yapılandırılmamış.' });
      setLoading(false);
      setChecked(true);
      return null;
    }
    setLoading(true);
    try {
      const result = await neonAuth.getSession();
      if (result?.error) throw new Error(result.error.message || 'Oturum doğrulanamadı.');
      const candidate = result?.data?.user || result?.user || null;
      if (!candidate?.id) {
        setUser(null);
        setError(null);
        return null;
      }
      // Authorization: no admin grant based only on client-side user fields.
      // The independent API will determine any elevated role server-side.
      const member = {
        id: candidate.id,
        email: candidate.email || '',
        full_name: candidate.name || candidate.email || 'Atlas üyesi',
        role: 'member',
      };
      setUser(member);
      setError(null);
      return member;
    } catch (err) {
      setUser(null);
      setError({ type: 'temporary_failure', message: 'Oturum doğrulanamadı. Bağlantıyı kontrol edin.' });
      return null;
    } finally {
      setLoading(false);
      setChecked(true);
    }
  }, []);

  useEffect(() => { void checkUserAuth(); }, [checkUserAuth]);
  const logout = useCallback(async () => {
    try { if (neonAuth) await neonAuth.signOut(); }
    finally { setUser(null); window.location.hash = '#/login'; }
  }, []);
  const navigateToLogin = useCallback(() => { window.location.hash = '#/login'; }, []);
  return <Context.Provider value={{
    user, isAuthenticated: Boolean(user), isLoadingAuth,
    isLoadingPublicSettings: false, authChecked, authError,
    appPublicSettings: {}, checkUserAuth, checkAppState: checkUserAuth,
    logout, navigateToLogin,
  }}>{children}</Context.Provider>;
}

export const useAuth = () => useContext(Context);
