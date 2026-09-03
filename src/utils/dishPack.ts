import { Dish, DishPack, DishPackDish, DishPackRestaurant, Meal, Restaurant } from '../types';
import { isLeftovers } from './quickActions';

// ── Dish-pack sharing (Phase 4), pure logic ─────────────────────────────────
// Building the shareable pack and merging an imported one. Kept pure + tested so
// the privacy contract (definitions only, never meals/ratings/spend/history) is
// verifiable and the code generation is deterministic under test.
//
// FOOTPRINT RULE (Sameer, locked): the pack shares what the family has actually
// COOKED / EATEN — derived from MEALS, not from the library or the restaurants
// doc collection. A dish saved to the library but never cooked is NOT shared; a
// dish cooked but never explicitly saved IS. Restaurants come from real outside
// meals (matching the Restaurants tab), NOT the `restaurants/{id}` docs, which
// silt up with rated-but-unvisited places and 0-visit import placeholders. The
// library + restaurant docs are used ONLY to ENRICH cooked items (ingredients /
// recipe / cuisine), never to decide membership.

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
 * Build the shareable pack from a household's data — MEAL-DERIVED (see the
 * FOOTPRINT RULE above). Family dishes are the distinct dishes actually cooked at
 * home (incl. thali sides in `items[]`, excl. the leftovers marker); kids-tiffin
 * dishes are the distinct dishes cooked on the kids track; restaurants are the
 * distinct places actually eaten at (dine-out / takeout). Each is enriched from
 * the library / restaurant docs where a match exists (ingredients, recipe,
 * cuisine) but membership comes only from meals. Meals, ratings, spend, visits,
 * and budgets are never included.
 *
 * `dishes` and `restaurants` are enrichment sources ONLY — they never add members.
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

  const libByName = new Map(dishes.map((d) => [d.name.trim().toLowerCase(), d]));
  const restByName = new Map(restaurants.map((r) => [r.name.trim().toLowerCase(), r]));

  // Distinct dishes actually cooked in the meals matching `predicate`, in first-
  // cooked order. Reads thali sides in `items[]`; skips the leftovers marker and
  // empties; enriches from the library when the dish is saved there.
  const collectCookedDishes = (predicate: (m: Meal) => boolean): DishPackDish[] => {
    const seen = new Set<string>();
    const out: DishPackDish[] = [];
    for (const m of meals) {
      if (!predicate(m)) continue;
      const names = m.items?.length ? m.items.map((it) => it.name) : [m.dishName];
      for (const raw of names) {
        const name = (raw ?? '').trim();
        if (!name || isLeftovers(name) || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        const known = libByName.get(name.toLowerCase());
        out.push(known ? dishToPackDish(known) : { name, cuisineTag: m.cuisineTag || 'Other' });
      }
    }
    return out;
  };

  // Family dishes — cooked at home, excluding the kids track.
  const packDishes = collectCookedDishes((m) => m.sourceType === 'home' && m.audience !== 'kids');
  // Kids-tiffin dishes — cooked on the kids track.
  const kidsDishes = collectCookedDishes((m) => m.audience === 'kids');

  // Restaurants — distinct places actually eaten at (dine-out / takeout), the
  // same meal-derived list the Restaurants tab shows. Enrich cuisine from the
  // restaurant doc when present, else the meal's cuisine.
  const seenRest = new Set<string>();
  const packRestaurants: DishPackRestaurant[] = [];
  for (const m of meals) {
    if (m.sourceType !== 'dineout' && m.sourceType !== 'takeout') continue;
    const name = (m.restaurantName ?? '').trim();
    if (!name || seenRest.has(name.toLowerCase())) continue;
    seenRest.add(name.toLowerCase());
    const known = restByName.get(name.toLowerCase());
    packRestaurants.push({ name, cuisineType: known?.cuisineType || m.cuisineTag || '' });
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
