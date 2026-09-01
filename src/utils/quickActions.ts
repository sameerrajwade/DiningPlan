import { differenceInDays, parseISO } from 'date-fns';
import { Dish, Meal } from '../types';

// ── Sub-10-second delights: Cook again · Decide for me · Leftovers ──────────
// All pure logic, unit-tested. These reinforce the core promise (log a meal in
// ~10 seconds) by collapsing the common cases to a single tap. Nothing here
// gates logging — every helper is additive and returns plain data the screen
// turns into a meal via the existing addMeal path.

// A never-cooked dish is treated as this many days "stale" for suggestions —
// enough to be introduced, not so high it buries dishes actually cooked. Mirrors
// the planner's NEW_DISH_NOVELTY so "Decide for me" and the weekly plan agree.
const NEW_DISH_NOVELTY = 21;
const FAVORITE_BONUS = 20;

// Canonical label for a "we ate leftovers" entry. Deliberately kept OUT of the
// dish library, unique-dish counts, "haven't made in a while", and the planner /
// suggestion pools (see isLeftovers users) so it never pollutes rotation or
// insights. It exists only so a leftovers night still counts for the logging
// streak — an honest record without inventing a fake dish.
export const LEFTOVERS_NAME = 'Leftovers';

/** True when a dish/meal name is a leftovers marker (case/space-insensitive). */
export function isLeftovers(name: string | undefined | null): boolean {
  return (name ?? '').trim().toLowerCase() === LEFTOVERS_NAME.toLowerCase();
}

export interface CookAgainDish {
  name: string;
  cuisineTag: string;
  lastCookedDate: string; // YYYY-MM-DD of the most recent home cook
  isFavorite: boolean;
}

/**
 * "Cook again" — recently cooked home dishes, most-recent first, de-duplicated,
 * for the 1-tap re-log row. Derived from actual meals (incl. thali sides in
 * `items`) so it reflects what was really cooked, not a possibly-stale aggregate.
 * Excludes outside meals and the leftovers marker. `dishes` is used only to
 * surface the favorite flag; a dish with no library entry still appears.
 */
export function cookAgainDishes(
  meals: Meal[],
  dishes: Dish[],
  today: string,
  limit = 8,
): CookAgainDish[] {
  const favByName = new Map<string, boolean>();
  const cuisineByName = new Map<string, string>();
  dishes.forEach((d) => {
    favByName.set(d.name.toLowerCase(), d.isFavorite);
    cuisineByName.set(d.name.toLowerCase(), d.cuisineTag);
  });

  // name(lowercased) → { display, cuisine, lastDate }
  const latest = new Map<string, { name: string; cuisine: string; date: string }>();
  for (const m of meals) {
    if (m.sourceType !== 'home') continue;
    if (m.date > today) continue; // ignore future-dated (planned) meals
    if (m.audience === 'kids') continue; // family "cook again" only
    const names = m.items?.length ? m.items.map((it) => it.name) : [m.dishName];
    for (const raw of names) {
      const name = (raw ?? '').trim();
      if (!name || isLeftovers(name)) continue;
      const key = name.toLowerCase();
      const prev = latest.get(key);
      if (!prev || m.date > prev.date) {
        latest.set(key, {
          name,
          cuisine: cuisineByName.get(key) ?? m.cuisineTag ?? '',
          date: m.date,
        });
      }
    }
  }

  return Array.from(latest.entries())
    .map(([key, v]) => ({
      name: v.name,
      cuisineTag: v.cuisine,
      lastCookedDate: v.date,
      isFavorite: favByName.get(key) ?? false,
    }))
    .sort((a, b) => (a.lastCookedDate < b.lastCookedDate ? 1 : a.lastCookedDate > b.lastCookedDate ? -1 : 0))
    .slice(0, limit);
}

export interface Suggestion {
  name: string;
  cuisineTag: string;
  isNew: boolean;
  lastMadeDaysAgo: number | null; // null = never cooked
}

/**
 * "Decide for me" — one instant answer to "what should I cook tonight?". Scores
 * the home dish library the same way the weekly planner does (staleness +
 * favorite bonus, bounded novelty for never-cooked), skips anything cooked within
 * `avoidRepeatDays`, and skips the leftovers marker. Picks from the top few with
 * light randomness so repeated taps vary; inject `rng`/`now` for deterministic
 * tests. Returns null when there are no home dishes to suggest.
 */
export function decideForMe(
  dishes: Dish[],
  meals: Meal[],
  opts: {
    avoidRepeatDays?: number;
    topN?: number;
    rng?: () => number;
    now?: Date;
  } = {},
): Suggestion | null {
  const avoidRepeatDays = opts.avoidRepeatDays ?? 0;
  const topN = opts.topN ?? 3;
  const rng = opts.rng ?? Math.random;
  const now = opts.now ?? new Date();
  const todayStr = fmt(now);

  // Real last-cooked per dish name, from meals (incl. thali sides). More honest
  // than the stored aggregate, which the planner has seen go stale.
  const lastCooked = new Map<string, string>();
  for (const m of meals) {
    if (m.sourceType !== 'home' || m.date > todayStr || m.audience === 'kids') continue;
    const names = m.items?.length ? m.items.map((it) => it.name) : [m.dishName];
    for (const raw of names) {
      const name = (raw ?? '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const prev = lastCooked.get(key);
      if (!prev || m.date > prev) lastCooked.set(key, m.date);
    }
  }

  const candidates = dishes
    .filter((d) => d.name && !isLeftovers(d.name))
    .map((d) => {
      const last = lastCooked.get(d.name.toLowerCase()) ?? (d.lastCookedDate || '');
      const cooked = !!last;
      const daysSince = cooked ? differenceInDays(now, parseISO(last + 'T00:00:00')) : null;
      return { dish: d, cooked, daysSince };
    })
    // Don't suggest something cooked too recently.
    .filter((c) => c.daysSince == null || c.daysSince >= avoidRepeatDays);

  if (candidates.length === 0) return null;

  const scored = candidates.map((c) => {
    const staleness = c.cooked ? (c.daysSince as number) : NEW_DISH_NOVELTY;
    const score = staleness + (c.dish.isFavorite ? FAVORITE_BONUS : 0);
    return { ...c, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const pickFrom = Math.min(topN, scored.length);
  const idx = Math.floor(rng() * pickFrom) % pickFrom;
  const chosen = scored[idx];
  return {
    name: chosen.dish.name,
    cuisineTag: chosen.dish.cuisineTag,
    isNew: !chosen.cooked,
    lastMadeDaysAgo: chosen.daysSince,
  };
}

function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
