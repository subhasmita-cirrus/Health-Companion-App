import { create } from 'zustand';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getIdToken,
  updateProfile,
} from '@react-native-firebase/auth';
import { User } from '../types';
import { getMe, updateMe, BackendUser } from '../services/api';

/** Map Firebase Auth error codes to short user-facing messages. */
export function friendlyAuthError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e ?? 'Something went wrong');
  const codeMatch = raw.match(/\[([^\]]+)\]/);
  const code = codeMatch?.[1] ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Incorrect email or password. Sign up if you don’t have an account yet.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return raw.replace(/^\[[^\]]+\]\s*/, '') || 'Sign in failed';
  }
}

function mapBackendUserToUser(b: BackendUser): User {
  return {
    id: b.id,
    email: b.email,
    name: b.displayName ?? b.email?.split('@')[0] ?? 'User',
    profileImage: b.photoUrl ?? undefined,
    dateOfBirth: b.dateOfBirth ?? undefined,
    gender: (b.gender as User['gender']) ?? undefined,
    height: b.height ?? undefined,
    weight: b.weight ?? undefined,
    fitnessLevel: (b.fitnessLevel as User['fitnessLevel']) ?? undefined,
    goals: b.goals ?? undefined,
    createdAt: new Date(b.createdAt),
    updatedAt: new Date(b.updatedAt),
  };
}

function syncUserToBackendInBackground(token: string) {
  const trySync = async (): Promise<boolean> => {
    try {
      const backendUser = await getMe(token);
      useUserStore.setState({ user: mapBackendUserToUser(backendUser) });
      return true;
    } catch {
      return false;
    }
  };
  trySync().then((ok) => {
    if (!ok) {
      setTimeout(() => {
        trySync().then((ok2) => {
          if (!ok2) setTimeout(() => trySync(), 15000);
        });
      }, 8000);
    }
  });
}

function firebaseUserSession(
  token: string,
  fb: { uid: string; email: string | null; displayName: string | null; photoURL: string | null },
  fallbackEmail: string,
  displayName?: string,
) {
  return {
    user: {
      id: fb.uid,
      email: fb.email ?? fallbackEmail,
      name:
        displayName ||
        fb.displayName ||
        fb.email?.split('@')[0] ||
        fallbackEmail.split('@')[0] ||
        'User',
      profileImage: fb.photoURL ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    idToken: token,
    isAuthenticated: true as const,
    isLoading: false as const,
    error: null,
  };
}

interface UserState {
  user: User | null;
  idToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (userData: User) => void;
  loginWithFirebase: (email: string, password: string) => Promise<void>;
  registerWithFirebase: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateProfile: (updates: Partial<User>) => void;
  saveProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  restoreSession: (token: string) => Promise<void>;
  setSessionFromFirebase: (token: string, firebaseUser: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }) => void;
  /** Returns a fresh Firebase ID token (full JWT) for use in Swagger / Postman. */
  getFreshIdToken: () => Promise<string | null>;
  /** Trigger background sync with backend (create/update user in DB). Call when backend may have been unreachable at login. */
  syncWithBackendInBackground: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  idToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: (userData) =>
    set({ user: userData, isAuthenticated: true, isLoading: false, error: null }),

  loginWithFirebase: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const auth = getAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await getIdToken(cred.user);
      set(firebaseUserSession(token, cred.user, email));
      syncUserToBackendInBackground(token);
    } catch (e: unknown) {
      const message = friendlyAuthError(e);
      set({ error: message, isLoading: false, isAuthenticated: false });
      throw new Error(message);
    }
  },

  registerWithFirebase: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const auth = getAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && cred.user) {
        await updateProfile(cred.user, { displayName });
      }
      const token = await getIdToken(cred.user, true);
      set(firebaseUserSession(token, cred.user, email, displayName));
      syncUserToBackendInBackground(token);
    } catch (e: unknown) {
      const message = friendlyAuthError(e);
      set({ error: message, isLoading: false, isAuthenticated: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    try {
      await signOut(getAuth());
    } catch {
      // ignore
    }
    set({ user: null, idToken: null, isAuthenticated: false, isLoading: false, error: null });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  updateProfile: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  saveProfile: async (updates: Partial<User>) => {
    const token = await get().getFreshIdToken();
    get().updateProfile(updates);
    try {
      const auth = getAuth();
      if (updates.name && auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: updates.name });
      }
    } catch {
      // local name still updated
    }
    if (!token) return;
    try {
      const backendUser = await updateMe(token, {
        displayName: updates.name,
        height: updates.height,
        weight: updates.weight,
        fitnessLevel: updates.fitnessLevel,
        gender: updates.gender,
      });
      set({ user: mapBackendUserToUser(backendUser) });
    } catch {
      // keep local updates if backend is unreachable
    }
  },

  refreshUser: async () => {
    const token = get().idToken;
    if (!token) return;
    try {
      const backendUser = await getMe(token);
      set({ user: mapBackendUserToUser(backendUser) });
    } catch {
      // ignore; user can stay with cached data
    }
  },

  restoreSession: async (token) => {
    try {
      const backendUser = await getMe(token);
      set({
        user: mapBackendUserToUser(backendUser),
        idToken: token,
        isAuthenticated: true,
      });
    } catch {
      // leave unauthenticated
    }
  },

  setSessionFromFirebase: (token, firebaseUser) => {
    const user: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email ?? '',
      name: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
      profileImage: firebaseUser.photoURL ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set({ user, idToken: token, isAuthenticated: true });
  },

  getFreshIdToken: async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    const token = await getIdToken(currentUser, true);
    set({ idToken: token });
    return token;
  },

  syncWithBackendInBackground: () => {
    const token = get().idToken;
    if (token) syncUserToBackendInBackground(token);
  },
}));
