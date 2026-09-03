import { create } from 'zustand';
import { Dish } from '../types';
import {
  getDishes,
  addDish as addDishApi,
  addDishesBatch as addDishesBatchApi,
  updateDish as updateDishApi,
  deleteDish as deleteDishApi,
} from '../services/firestore';

interface DishState {
  dishes: Dish[];
  hydratedFor: string | null; // householdId the in-memory dishes belong to
  isLoading: boolean;
  error: string | null;
  fetchDishes: (householdId: string, force?: boolean) => Promise<void>;
  addDish: (householdId: string, dish: Omit<Dish, 'id'>) => Promise<string>;
  addDishesBatch: (householdId: string, dishes: Omit<Dish, 'id'>[]) => Promise<string[]>;
  updateDish: (householdId: string, dishId: string, data: Partial<Dish>) => Promise<void>;
  deleteDish: (householdId: string, dishId: string) => Promise<void>;
  toggleFavorite: (householdId: string, dishId: string) => Promise<void>;
  searchDishes: (query: string) => Dish[];
  clear: () => void;
}

let dishesInFlight: { householdId: string; promise: Promise<void> } | null = null;

export const useDishStore = create<DishState>((set, get) => ({
  dishes: [],
  hydratedFor: null,
  isLoading: false,
  error: null,

  // Cache-first: reads dishes once per household/session; add/update/favorite
  // update the in-memory list locally, so no re-read is needed after a write.
  // Pull-to-refresh passes force=true for a cross-device catch-up. Concurrent
  // loads (startup preload + first focus) are coalesced into one read.
  fetchDishes: async (householdId, force = false) => {
    if (!householdId) return;
    if (!force && get().hydratedFor === householdId) return;
    if (!force && dishesInFlight && dishesInFlight.householdId === householdId) return dishesInFlight.promise;
    const promise = (async () => {
      set({ isLoading: true, error: null });
      try {
        const dishes = await getDishes(householdId);
        set({ dishes, hydratedFor: householdId, isLoading: false });
      } catch (e: any) {
        set({ error: e.message, isLoading: false });
      } finally {
        dishesInFlight = null;
      }
    })();
    dishesInFlight = { householdId, promise };
    return promise;
  },

  addDish: async (householdId, dish) => {
    set({ isLoading: true, error: null });
    try {
      const id = await addDishApi(householdId, dish);
      set((state) => ({
        dishes: [...state.dishes, { ...dish, id }],
        isLoading: false,
      }));
      return id;
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  // Seed many dishes at once (starter catalog / pack import). De-dupes against
  // dishes already in memory by case-insensitive name so re-running "Explore
  // dishes" never creates duplicates. Returns the ids actually written.
  addDishesBatch: async (householdId, dishes) => {
    const existing = new Set(get().dishes.map((d) => d.name.trim().toLowerCase()));
    const fresh = dishes.filter((d) => {
      const key = d.name.trim().toLowerCase();
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    });
    if (fresh.length === 0) return [];
    set({ isLoading: true, error: null });
    try {
      const ids = await addDishesBatchApi(householdId, fresh);
      set((state) => ({
        dishes: [...state.dishes, ...fresh.map((d, i) => ({ ...d, id: ids[i] }))],
        isLoading: false,
      }));
      return ids;
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  updateDish: async (householdId, dishId, data) => {
    set({ isLoading: true, error: null });
    try {
      await updateDishApi(householdId, dishId, data);
      set((state) => ({
        dishes: state.dishes.map((d) =>
          d.id === dishId ? { ...d, ...data } : d,
        ),
        isLoading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      throw e;
    }
  },

  deleteDish: async (householdId, dishId) => {
    const prev = get().dishes;
    // Optimistic: drop it locally, restore on failure.
    set({ dishes: prev.filter((d) => d.id !== dishId) });
    try {
      await deleteDishApi(householdId, dishId);
    } catch (e: any) {
      set({ dishes: prev, error: e.message });
      throw e;
    }
  },

  toggleFavorite: async (householdId, dishId) => {
    const dish = get().dishes.find((d) => d.id === dishId);
    if (!dish) return;
    const newFav = !dish.isFavorite;
    try {
      await updateDishApi(householdId, dishId, { isFavorite: newFav });
      set((state) => ({
        dishes: state.dishes.map((d) =>
          d.id === dishId ? { ...d, isFavorite: newFav } : d,
        ),
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  searchDishes: (query) => {
    const q = query.toLowerCase();
    return get().dishes.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.cuisineTag.toLowerCase().includes(q) ||
        d.categoryTags.some((t) => t.toLowerCase().includes(q)),
    );
  },

  clear: () => set({ dishes: [], hydratedFor: null, isLoading: false, error: null }),
}));

export default useDishStore;
