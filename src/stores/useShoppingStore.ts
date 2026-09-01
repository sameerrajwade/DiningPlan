import { create } from 'zustand';
import { GroceryItem } from '../types';
import {
  getGroceryItems,
  addGroceryItems,
  setGroceryChecked,
  deleteGroceryItem,
  deleteGroceryItems,
} from '../services/firestore';
import { dedupeNewItems } from '../utils/grocery';

interface ShoppingState {
  items: GroceryItem[];
  hydratedFor: string | null;
  isLoading: boolean;
  error: string | null;
  fetchItems: (householdId: string, force?: boolean) => Promise<void>;
  // Add names to the list, de-duplicated against what's already there. Returns
  // how many were actually added (0 if all were duplicates).
  addItems: (
    householdId: string,
    names: string[],
    source: 'dish' | 'manual',
    dishId?: string,
  ) => Promise<number>;
  toggleChecked: (householdId: string, itemId: string) => Promise<void>;
  removeItem: (householdId: string, itemId: string) => Promise<void>;
  clearChecked: (householdId: string) => Promise<void>;
  clearAll: (householdId: string) => Promise<void>;
  clear: () => void;
}

let inFlight: { householdId: string; promise: Promise<void> } | null = null;

// Cache-first shared grocery list (mirrors useDishStore). One combined list per
// household; all mutations update the in-memory copy so no re-read is needed.
export const useShoppingStore = create<ShoppingState>((set, get) => ({
  items: [],
  hydratedFor: null,
  isLoading: false,
  error: null,

  fetchItems: async (householdId, force = false) => {
    if (!householdId) return;
    if (!force && get().hydratedFor === householdId) return;
    if (!force && inFlight && inFlight.householdId === householdId) return inFlight.promise;
    const promise = (async () => {
      set({ isLoading: true, error: null });
      try {
        const items = await getGroceryItems(householdId);
        set({ items, hydratedFor: householdId, isLoading: false });
      } catch (e: any) {
        set({ error: e.message, isLoading: false });
      } finally {
        inFlight = null;
      }
    })();
    inFlight = { householdId, promise };
    return promise;
  },

  addItems: async (householdId, names, source, dishId) => {
    const existingTexts = get().items.map((i) => i.text);
    const fresh = dedupeNewItems(existingTexts, names);
    if (fresh.length === 0) return 0;
    set({ isLoading: true, error: null });
    try {
      const created = await addGroceryItems(
        householdId,
        fresh.map((text) => ({ text, source, dishId })),
      );
      set((state) => ({ items: [...state.items, ...created], isLoading: false }));
      return created.length;
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  toggleChecked: async (householdId, itemId) => {
    const item = get().items.find((i) => i.id === itemId);
    if (!item) return;
    const checked = !item.checked;
    // Optimistic — flip locally, persist in the background.
    set((state) => ({
      items: state.items.map((i) => (i.id === itemId ? { ...i, checked } : i)),
    }));
    try {
      await setGroceryChecked(householdId, itemId, checked);
    } catch (e: any) {
      // Revert on failure
      set((state) => ({
        items: state.items.map((i) => (i.id === itemId ? { ...i, checked: !checked } : i)),
        error: e.message,
      }));
    }
  },

  removeItem: async (householdId, itemId) => {
    const prev = get().items;
    set({ items: prev.filter((i) => i.id !== itemId) });
    try {
      await deleteGroceryItem(householdId, itemId);
    } catch (e: any) {
      set({ items: prev, error: e.message });
    }
  },

  clearChecked: async (householdId) => {
    const prev = get().items;
    const ids = prev.filter((i) => i.checked).map((i) => i.id);
    if (ids.length === 0) return;
    set({ items: prev.filter((i) => !i.checked) });
    try {
      await deleteGroceryItems(householdId, ids);
    } catch (e: any) {
      set({ items: prev, error: e.message });
    }
  },

  clearAll: async (householdId) => {
    const prev = get().items;
    if (prev.length === 0) return;
    set({ items: [] });
    try {
      await deleteGroceryItems(householdId, prev.map((i) => i.id));
    } catch (e: any) {
      set({ items: prev, error: e.message });
    }
  },

  clear: () => set({ items: [], hydratedFor: null, isLoading: false, error: null }),
}));

export default useShoppingStore;
