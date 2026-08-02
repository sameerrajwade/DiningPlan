import { Dish, Meal } from '../types';

export interface DishWindow {
  start: string; // yyyy-MM-dd, inclusive
  end: string; // yyyy-MM-dd, inclusive
}

export interface AggregateOpts {
  today: string; // local yyyy-MM-dd; meals dated after this are ignored (not cooked yet)
  window?: DishWindow; // when set, count only meals inside [start, end]
}

// Derive per-dish stats (timesCooked + lastCookedDate) from the household's
// meals. Pure so it can be unit-tested — the Dish Library screen renders this.
//
// Rules:
//  - Seeds from saved dishes but resets their counts; timesCooked/lastCooked are
//    DERIVED from meals (avoids double counting stored + derived).
//  - HOME meals only. Outside meals (dine-out/takeout) carry a dishName/items
//    too, but those are "ordered", not "cooked" — counting them inflated the
//    Dish Library + the Home "Unique Dishes" metric. Restaurant dishes live in
//    the restaurant detail screen instead. (Insights "most cooked" is already
//    home-only, so this keeps all three consistent.)
//  - Counts EVERY dish in a meal, including thali sides in `items` (a meal with
//    items counts each item once; otherwise the single `dishName`).
//  - Skips future-dated meals (date > today) — planned, not cooked.
//  - When `window` is given, counts only meals inside it, so a scoped view shows
//    window counts instead of the all-time total.
export function aggregateDishes(
  savedDishes: Dish[],
  meals: Meal[],
  opts: AggregateOpts,
): Dish[] {
  const { today, window } = opts;
  const dishMap = new Map<string, Dish>();

  savedDishes.forEach((d) =>
    dishMap.set(d.name.toLowerCase(), { ...d, timesCooked: 0, lastCookedDate: '' }),
  );

  meals.forEach((m) => {
    if (m.date > today) return;
    if (m.sourceType !== 'home') return; // dishes you cooked, not ordered out
    if (window && (m.date < window.start || m.date > window.end)) return;

    const names = m.items?.length ? m.items.map((it) => it.name) : m.dishName ? [m.dishName] : [];
    names.forEach((rawName) => {
      if (!rawName) return;
      const key = rawName.toLowerCase();
      const existing = dishMap.get(key);
      if (existing) {
        dishMap.set(key, {
          ...existing,
          timesCooked: existing.timesCooked + 1,
          lastCookedDate: m.date > (existing.lastCookedDate || '') ? m.date : existing.lastCookedDate,
        });
      } else {
        dishMap.set(key, {
          id: rawName,
          name: rawName,
          cuisineTag: m.cuisineTag || 'Other',
          categoryTags: [],
          isFavorite: false,
          timesCooked: 1,
          lastCookedDate: m.date,
          householdId: m.householdId,
        });
      }
    });
  });

  return Array.from(dishMap.values());
}
