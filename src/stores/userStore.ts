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
import { getMe, BackendUser } from '../services/api';

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

let backendGetMeWarned = false;
function resetBackendGetMeWarning() {
  backendGetMeWarned = false;
}

function syncUserToBackendInBackground(token: string) {
  const trySync = async (): Promise<boolean> => {
    try {
      const backendUser = await getMe(token);
      resetBackendGetMeWarning();
      useUserStore.setState({ user: mapBackendUserToUser(backendUser) });
      return true;
    } catch {
      return false;
    }
  };
  // Retry at 3s, 10s, 30s so backend has time to be reachable (e.g. device on same WiFi)
  setTimeout(() => {
    trySync().then((ok) => {
      if (!ok) setTimeout(() => trySync().then((ok2) => { if (!ok2) setTimeout(() => trySync(), 20000); }), 7000);
    });
  }, 3000);
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
      try {
        const backendUser = await getMe(token);
        const user = mapBackendUserToUser(backendUser);
        resetBackendGetMeWarning();
        set({
          user,
          idToken: token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (apiErr) {
        try {
          await new Promise(r => setTimeout(r, 2000));
          const backendUser = await getMe(token);
          resetBackendGetMeWarning();
          set({
            user: mapBackendUserToUser(backendUser),
            idToken: token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (retryErr) {
          if (!backendGetMeWarned) {
            backendGetMeWarned = true;
            console.warn('[Auth] Backend getMe failed (will sync in background):', retryErr instanceof Error ? retryErr.message : retryErr, '- Check: same WiFi, backend running, firewall allows port 3000.');
          }
          const fbUser = cred.user;
          set({
            user: {
              id: fbUser.uid,
              email: fbUser.email ?? email,
              name: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? email.split('@')[0] ?? 'User',
              profileImage: fbUser.photoURL ?? undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            idToken: token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          syncUserToBackendInBackground(token);
        }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Sign in failed';
      set({ error: message, isLoading: false, isAuthenticated: false });
      throw e;
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
      try {
        const backendUser = await getMe(token);
        const user = mapBackendUserToUser(backendUser);
        resetBackendGetMeWarning();
        set({
          user,
          idToken: token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (apiErr) {
        try {
          await new Promise(r => setTimeout(r, 2000));
          const backendUser = await getMe(token);
          resetBackendGetMeWarning();
          set({
            user: mapBackendUserToUser(backendUser),
            idToken: token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (retryErr) {
          if (!backendGetMeWarned) {
            backendGetMeWarned = true;
            console.warn('[Auth] Backend getMe failed (will sync in background):', retryErr instanceof Error ? retryErr.message : retryErr, '- Check: same WiFi, backend running, firewall allows port 3000.');
          }
          const fbUser = cred.user;
          set({
            user: {
              id: fbUser.uid,
              email: fbUser.email ?? email,
              name: displayName || (fbUser.displayName ?? fbUser.email?.split('@')[0] ?? email.split('@')[0] ?? 'User'),
              profileImage: fbUser.photoURL ?? undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            idToken: token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          syncUserToBackendInBackground(token);
        }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Sign up failed';
      set({ error: message, isLoading: false, isAuthenticated: false });
      throw e;
    }
  },

  logout: async () => {
    try {
      await signOut(getAuth());
    } catch {
      // ignore
    }
    resetBackendGetMeWarning();
    set({ user: null, idToken: null, isAuthenticated: false, isLoading: false, error: null });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  updateProfile: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

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
