import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// First-run product tour (interactive coach-marks). Runs once after onboarding;
// replayable from Settings. `seen` is persisted so it never auto-runs twice.
const SEEN_KEY = 'tourSeen_v1';

interface TourState {
  active: boolean;
  step: number;
  seen: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  start: () => void;
  next: () => void;
  back: () => void;
  finish: () => void; // marks seen + closes
}

export const useTourStore = create<TourState>((set) => ({
  active: false,
  step: 0,
  seen: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(SEEN_KEY);
      set({ seen: raw === '1', hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  start: () => set({ active: true, step: 0 }),
  next: () => set((s) => ({ step: s.step + 1 })),
  back: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
  finish: () => {
    AsyncStorage.setItem(SEEN_KEY, '1').catch(() => {});
    set({ active: false, seen: true, step: 0 });
  },
}));

export default useTourStore;
