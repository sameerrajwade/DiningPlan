import { create } from 'zustand';
import { User, UserPreferences } from '../types';
import * as authService from '../services/auth';
import { createUserProfile, getUserProfile, getUserPreferences } from '../services/firestore';
import { useHouseholdStore } from './useHouseholdStore';
import { useMealStore } from './useMealStore';
import { useDishStore } from './useDishStore';
import { mapAuthError } from '../utils/authErrors';

interface AuthState {
  user: User | null;
  preferences: UserPreferences | null;
  isAuthenticated: boolean;
  // Whether the signed-in user's email is verified. Google accounts are always
  // verified; new email/password accounts are gated until they confirm.
  emailVerified: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setEmailVerified: (verified: boolean) => void;
  fetchUser: (userId: string) => Promise<void>;
  fetchPreferences: (userId: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshEmailVerified: () => Promise<boolean>;
  clearError: () => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  preferences: null,
  isAuthenticated: false,
  emailVerified: false,
  isLoading: false,
  error: null,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user }),

  setEmailVerified: (verified) => set({ emailVerified: verified }),

  fetchUser: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await getUserProfile(userId);
      set({ user, isAuthenticated: !!user, isLoading: false });
    } catch (e: any) {
      set({ error: mapAuthError(e), isLoading: false });
    }
  },

  fetchPreferences: async (userId: string) => {
    try {
      const preferences = await getUserPreferences(userId);
      set({ preferences });
    } catch (e: any) {
      set({ error: mapAuthError(e) });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const firebaseUser = await authService.signInWithEmail(email, password);
      let profile = await getUserProfile(firebaseUser.uid);
      if (!profile) {
        profile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          avatarUrl: firebaseUser.photoURL || null,
          householdId: null,
          createdAt: new Date(),
        };
        await createUserProfile(profile);
      }
      set({
        user: profile,
        isAuthenticated: !!profile,
        emailVerified: firebaseUser.emailVerified,
        isLoading: false,
      });
    } catch (e: any) {
      set({ error: mapAuthError(e), isLoading: false });
    }
  },

  signUp: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const firebaseUser = await authService.signUpWithEmail(email, password, name);
      const newUser: User = {
        id: firebaseUser.uid,
        name,
        email,
        avatarUrl: null,
        householdId: null,
        createdAt: new Date(),
      };
      await createUserProfile(newUser);
      // New email/password account starts unverified — the verification link was
      // sent in signUpWithEmail; the app routes to VerifyEmailScreen until confirmed.
      set({ user: newUser, isAuthenticated: true, emailVerified: false, isLoading: false });
    } catch (e: any) {
      set({ error: mapAuthError(e), isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.signOut();
      useHouseholdStore.getState().clear();
      useMealStore.getState().clear();
      useDishStore.getState().clear();
      set({ user: null, preferences: null, isAuthenticated: false, isLoading: false });
    } catch (e: any) {
      set({ error: mapAuthError(e), isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const firebaseUser = await authService.signInWithGoogle();
      let profile = await getUserProfile(firebaseUser.uid);
      if (!profile) {
        profile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          avatarUrl: firebaseUser.photoURL,
          householdId: null,
          createdAt: new Date(),
        };
        await createUserProfile(profile);
      }
      set({ user: profile, isAuthenticated: true, emailVerified: firebaseUser.emailVerified, isLoading: false });
    } catch (e: any) {
      set({ error: mapAuthError(e), isLoading: false });
    }
  },

  resetPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await authService.resetPassword(email);
      set({ isLoading: false });
    } catch (e: any) {
      set({ error: mapAuthError(e), isLoading: false });
    }
  },

  resendVerification: async () => {
    await authService.resendVerificationEmail();
  },

  refreshEmailVerified: async () => {
    const verified = await authService.refreshEmailVerified();
    set({ emailVerified: verified });
    return verified;
  },

  clearError: () => set({ error: null }),

  clear: () => set({ user: null, preferences: null, isAuthenticated: false, emailVerified: false, isLoading: false, error: null }),
}));

export default useAuthStore;
