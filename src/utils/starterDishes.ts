import { Diet, Dish } from '../types';
import {
  CatalogEntry,
  DishCategory,
  STARTER_CATALOG,
} from '../data/starterCatalog';

// Diet preference chosen at onboarding. 'veg' hides non-veg dishes entirely;
// 'both' keeps everything. (A future 'mostly-veg' can weight veg higher.)
export type DietPreference = 'veg' | 'both';

// Normalize a dish name for matching: lowercase, strip filler words and
// punctuation, collapse whitespace. Mirrors the intent of utils/diet.ts so
// "Rajma  Chawal" / "rajma chawal" / "Rajma-Chawal" all match one entry.
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(the|a|an|with|and|of|my|our)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const BY_NORMALIZED: Map<string, CatalogEntry> = (() => {
  const m = new Map<string, CatalogEntry>();
  for (const e of STARTER_CATALOG) {
    const key = normalizeName(e.name);
    if (!m.has(key)) m.set(key, e); // first entry wins on duplicate names
  }
  return m;
})();

// Enrich a typed dish name from the catalog, if we recognize it. Returns null
// for unknown names — the caller still logs the meal (10-second logging is
// never gated); enrichment only pre-fills cuisine/region/diet/ingredients.
export function matchCatalogDish(name: string): CatalogEntry | null {
  if (!name) return null;
  return BY_NORMALIZED.get(normalizeName(name)) ?? null;
}

// Autocomplete suggestions for a partial name (prefix matches first, then
// substring), capped. Used by the type-to-match dish input.
export function suggestCatalogDishes(query: string, limit = 8): CatalogEntry[] {
  const q = normalizeName(query);
  if (!q) return [];
  const prefix: CatalogEntry[] = [];
  const contains: CatalogEntry[] = [];
  for (const e of STARTER_CATALOG) {
    const n = normalizeName(e.name);
    if (n.startsWith(q)) prefix.push(e);
    else if (n.includes(q)) contains.push(e);
  }
  const rank = (a: CatalogEntry, b: CatalogEntry) =>
    (b.weight ?? 2) - (a.weight ?? 2) || a.name.localeCompare(b.name);
  return [...prefix.sort(rank), ...contains.sort(rank)].slice(0, limit);
}

// Target share of a balanced starter set by category, so a seeded kitchen is
// not 50 mains. Applied proportionally to the requested limit; any shortfall in
// one category is back-filled from the highest-weight leftovers.
const CATEGORY_SHARE: Record<DishCategory, number> = {
  main: 0.44,
  side: 0.16,
  rice: 0.1,
  bread: 0.06,
  breakfast: 0.14,
  snack: 0.07,
  sweet: 0.03,
};

export interface PickOptions {
  countries?: string[]; // restrict to these countries (default: all)
  regions?: string[]; // restrict to these regions (default: all in-country)
  diet?: DietPreference; // 'veg' hides non-veg (default 'both')
  limit?: number; // how many dishes to return (default 50)
}

const rank = (a: CatalogEntry, b: CatalogEntry) =>
  (b.weight ?? 2) - (a.weight ?? 2) || a.name.localeCompare(b.name);

// Pure, deterministic starter picker: filter by country/region/diet, then take a
// category-balanced, weight-ranked, de-duplicated set capped at `limit`.
export function pickStarterDishes(opts: PickOptions = {}): CatalogEntry[] {
  const { countries, regions, diet = 'both', limit = 50 } = opts;

  let pool = STARTER_CATALOG.slice();
  if (countries && countries.length) {
    pool = pool.filter((e) => countries.includes(e.country));
  }
  if (regions && regions.length) {
    pool = pool.filter((e) => regions.includes(e.region));
  }
  if (diet === 'veg') {
    pool = pool.filter((e) => e.diet === 'veg');
  }

  // De-dupe by normalized name, keeping the highest-weight entry.
  const dedup = new Map<string, CatalogEntry>();
  for (const e of pool) {
    const key = normalizeName(e.name);
    const cur = dedup.get(key);
    if (!cur || (e.weight ?? 2) > (cur.weight ?? 2)) dedup.set(key, e);
  }
  const unique = Array.from(dedup.values());

  // Bucket by category, each ranked by weight.
  const buckets = new Map<DishCategory, CatalogEntry[]>();
  for (const e of unique) {
    const arr = buckets.get(e.category) ?? [];
    arr.push(e);
    buckets.set(e.category, arr);
  }
  buckets.forEach((arr) => arr.sort(rank));

  const chosen: CatalogEntry[] = [];
  const takenKeys = new Set<string>();
  const take = (e: CatalogEntry) => {
    const key = normalizeName(e.name);
    if (takenKeys.has(key)) return;
    takenKeys.add(key);
    chosen.push(e);
  };

  // Pass 1: fill each category up to its proportional quota.
  (Object.keys(CATEGORY_SHARE) as DishCategory[]).forEach((cat) => {
    const quota = Math.round(CATEGORY_SHARE[cat] * limit);
    const arr = buckets.get(cat) ?? [];
    arr.slice(0, quota).forEach(take);
  });

  // Pass 2: back-fill any remaining slots from the highest-weight leftovers.
  if (chosen.length < limit) {
    unique
      .filter((e) => !takenKeys.has(normalizeName(e.name)))
      .sort(rank)
      .forEach((e) => {
        if (chosen.length < limit) take(e);
      });
  }

  // Final ranked order, capped.
  return chosen.sort(rank).slice(0, limit);
}

// Shape a catalog entry into the fields needed to seed a Dish document. Region
// is carried in categoryTags[] (no schema change); timesCooked starts at 0.
export interface SeedDish {
  name: string;
  cuisineTag: CatalogEntry['cuisineTag'];
  diet: Diet;
  categoryTags: string[];
  ingredients?: string[];
  isFavorite: boolean;
  timesCooked: number;
  lastCookedDate: string;
}

export function toSeedDish(e: CatalogEntry): SeedDish {
  return {
    name: e.name,
    cuisineTag: e.cuisineTag,
    diet: e.diet,
    categoryTags: [e.region],
    ingredients: e.ingredients,
    isFavorite: false,
    timesCooked: 0,
    lastCookedDate: '',
  };
}

// Shape catalog entries into Firestore Dish inputs (no id) ready for
// addDishesBatch. Region rides in categoryTags[]; ingredients are carried for the
// grocery list (Phase 2). timesCooked:0 / lastCookedDate:'' so the planner treats
// them as never-cooked (bounded novelty score, see planner.ts).
export function catalogEntriesToDishes(
  entries: CatalogEntry[],
  householdId: string,
): Omit<Dish, 'id'>[] {
  return entries.map((e) => ({
    name: e.name,
    cuisineTag: e.cuisineTag,
    categoryTags: [e.region],
    isFavorite: false,
    timesCooked: 0,
    lastCookedDate: '',
    householdId,
    ...(e.ingredients && e.ingredients.length ? { ingredients: e.ingredients } : {}),
  }));
}
