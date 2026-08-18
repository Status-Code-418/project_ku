import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  type User,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously as fbSignInAnonymously,
  signOut as fbSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { ref, update, get } from 'firebase/database';
import { auth, db } from '../lib/firebase';

// ─── types ───────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── helpers ─────────────────────────────────────────────
async function upsertProfile(user: User) {
  const profileRef = ref(db, `Users/${user.uid}/profile`);
  const snap = await get(profileRef);

  const provider =
    user.providerData[0]?.providerId === 'google.com' ? 'google' : 'anonymous';

  const updates: Record<string, unknown> = {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    provider,
    lastLoginAt: Date.now(),
  };

  // createdAt은 최초 1회만 기록
  if (!snap.exists()) {
    updates.createdAt = Date.now();
  }

  await update(profileRef, updates);
}

// ─── provider ────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await upsertProfile(result.user);
  };

  const signInAnonymously = async () => {
    const result = await fbSignInAnonymously(auth);
    await upsertProfile(result.user);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    await upsertProfile(result.user);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await upsertProfile(result.user);
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogle, signInAnonymously, signUpWithEmail, signInWithEmail, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── hook ────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
