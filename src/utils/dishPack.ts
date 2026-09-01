import { Dish, DishPack, DishPackDish, DishPackRestaurant, Meal, Restaurant } from '../types';

// ── Dish-pack sharing (Phase 4), pure logic ─────────────────────────────────
// Building the shareable pack and merging an imported one. Kept pure + tested so
// the privacy contract (definitions only, never meals/ratings/spend/history) is
// verifiable and the code generation is deterministic under test.

// Unambiguous alphabet for share codes — no 0/O/1/I/L so codes are easy to read
// aloud and type. Matches the friendly-code style used for invite codes.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

/** A short, human-friendly share code. Inject `rng` for deterministic tests. */
export function generatePackCode(rng: () => number = Math.random): string {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(rng() * CODE_ALPHABET.length) % CODE_ALPHABET.length];
  }
  return out;
}

/** Normalize a code the way lookups do (trim + uppercase). */
export function normalizePackCode(code: string): string {
  return (code ?? '').trim().toUpperCase();
}

function dishToPackDish(d: Pick<Dish, 'name' | 'cuisineTag' | 'categoryTags' | 'ingredients' | 'recipe'>): DishPackDish {
  return {
    name: d.name,
    cuisineTag: d.cuisineTag,
    ...(d.categoryTags?.length ? { categoryTags: d.categoryTags } : {}),
    ...(d.ingredients?.length ? { ingredients: d.ingredients } : {}),
    ...(d.recipe ? { recipe: d.recipe } : {}),
  };
}

/**
 * Build the shareable pack from a household's data. Family dishes come from the
 * dish library; kids-tiffin dishes are the DISTINCT dish names ever logged with
 * audience 'kids' (enriched from the library when known, else name+cuisine only);
 * restaurants are NAME + cuisine only. Meals, ratings, spend, visits, and budgets
 * are never included.
 */
export function buildDishPack(input: {
  code: string;
  userId: string;
  householdName: string;
  dishes: Dish[];
  meals: Meal[];
  restaurants: Restaurant[];
}): Omit<DishPack, 'createdAt'> {
  const { code, userId, householdName, dishes, meals, restaurants } = input;

  // Family dishes — dedupe by lowercased name.
  const seenDish = new Set<string>();
  const packDishes: DishPackDish[] = [];
  for (const d of dishes) {
    const key = d.name.trim().toLowerCase();
    if (!key || seenDish.has(key)) continue;
    seenDish.add(key);
    packDishes.push(dishToPackDish(d));
  }

  // Kids-tiffin dishes — distinct names from kids meals, enriched from the
  // library where we know the dish; otherwise carry name + cuisine only.
  const byName = new Map(dishes.map((d) => [d.name.toLowerCase(), d]));
  const seenKid = new Set<string>();
  const kidsDishes: DishPackDish[] = [];
  for (const m of meals) {
    if (m.audience !== 'kids' || !m.dishName) continue;
    const key = m.dishName.trim().toLowerCase();
    if (!key || seenKid.has(key)) continue;
    seenKid.add(key);
    const known = byName.get(key);
    kidsDishes.push(
      known
        ? dishToPackDish(known)
        : { name: m.dishName, cuisineTag: m.cuisineTag || 'Other' },
    );
  }

  // Restaurants — NAME + cuisine only (no visits/spend/ratings).
  const seenRest = new Set<string>();
  const packRestaurants: DishPackRestaurant[] = [];
  for (const r of restaurants) {
    const key = r.name.trim().toLowerCase();
    if (!key || seenRest.has(key)) continue;
    seenRest.add(key);
    packRestaurants.push({ name: r.name, cuisineType: r.cuisineType || '' });
  }

  return {
    code,
    createdBy: userId,
    householdName,
    dishes: packDishes,
    kidsDishes,
    restaurants: packRestaurants,
  };
}

/**
 * Given a pack's dishes and the importer's existing dish names, return the pack
 * dishes NOT already in the library (case-insensitive) — the ones worth importing.
 */
export function newPackDishes(
  packDishes: DishPackDish[],
  existingNames: string[],
): DishPackDish[] {
  const have = new Set(existingNames.map((n) => n.trim().toLowerCase()));
  const seen = new Set<string>();
  const out: DishPackDish[] = [];
  for (const d of packDishes) {
    const key = d.name.trim().toLowerCase();
    if (!key || have.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(d);
  }
  return out;
}

/** Convert selected pack dishes into new Dish docs for addDishesBatch. */
export function packDishesToDishes(
  packDishes: DishPackDish[],
  householdId: string,
): Omit<Dish, 'id'>[] {
  return packDishes.map((d) => ({
    name: d.name,
    cuisineTag: d.cuisineTag,
    categoryTags: d.categoryTags ?? [],
    isFavorite: false,
    timesCooked: 0,
    lastCookedDate: '',
    householdId,
    ...(d.ingredients?.length ? { ingredients: d.ingredients } : {}),
    ...(d.recipe ? { recipe: d.recipe } : {}),
  }));
}
