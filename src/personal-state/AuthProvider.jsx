import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { clearPersonalSession, flushPersonalState, setPersonalSession } from './sync';

const AuthContext = createContext(null);
const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const configured = Boolean(url && publishableKey);
let clientPromise = null;

function getClient() {
  if (!configured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(
      url,
      publishableKey,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
    ));
  }
  return clientPromise;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(configured ? 'loading' : 'local');
  const [syncError, setSyncError] = useState(null);
  const userRef = useRef(null);

  const adoptSession = useCallback(async (session, activeClient) => {
    const nextUser = session?.user ?? null;
    userRef.current = nextUser;
    setUser(nextUser);
    setSyncError(null);
    if (!nextUser) {
      clearPersonalSession();
      setStatus(configured ? 'signed-out' : 'local');
      return;
    }
    setStatus('syncing');
    try {
      await setPersonalSession(activeClient, nextUser);
      setStatus('ready');
    } catch (error) {
      console.error('personal state sync failed', error);
      setSyncError(error);
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    if (!configured) return undefined;
    let active = true;
    let subscription = null;
    let activeClient = null;
    getClient().then((loadedClient) => {
      if (!active) return;
      activeClient = loadedClient;
      loadedClient.auth.getSession().then(({ data }) => adoptSession(data.session, loadedClient));
      const { data } = loadedClient.auth.onAuthStateChange((_event, session) => {
        // Defer database work until the auth callback has released its internal lock.
        window.setTimeout(() => adoptSession(session, loadedClient), 0);
      });
      subscription = data.subscription;
    });
    const onOnline = () => {
      const activeUser = userRef.current;
      if (!activeUser || !activeClient) return;
      setStatus('syncing');
      flushPersonalState()
        .then(() => setPersonalSession(activeClient, activeUser))
        .then(() => setStatus('ready'))
        .catch((error) => { setSyncError(error); setStatus('offline'); });
    };
    window.addEventListener('online', onOnline);
    return () => {
      active = false;
      subscription?.unsubscribe();
      window.removeEventListener('online', onOnline);
    };
  }, [adoptSession]);

  const signIn = useCallback(async () => {
    const activeClient = await getClient();
    if (!activeClient) return;
    setSyncError(null);
    try {
      const { error } = await activeClient.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: window.location.href },
      });
      if (error) throw error;
    } catch (error) {
      setSyncError(error);
      setStatus('offline');
    }
  }, []);

  const signOut = useCallback(async () => {
    const activeClient = await getClient();
    if (!activeClient) return;
    await flushPersonalState().catch(() => {});
    await activeClient.auth.signOut();
  }, []);

  const value = useMemo(() => ({
    configured,
    signedIn: Boolean(user),
    status,
    syncError,
    signIn,
    signOut,
  }), [user, status, syncError, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
