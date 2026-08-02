import { aggregateDishes } from '../dishStats';
import type { Dish, Meal, MealItem } from '../../types';

const TODAY = '2026-07-31';
const THIS_MONTH = { start: '2026-07-01', end: '2026-07-31' };

function meal(date: string, dishName: string, items?: string[]): Meal {
  return {
    id: `${date}-${dishName}-${Math.random().toString(36).slice(2)}`,
    date,
    mealType: 'dinner',
    sourceType: 'home',
    dishName,
    items: items ? (items.map((name) => ({ name })) as MealItem[]) : undefined,
    cuisineTag: 'Indian',
    createdBy: 'u1',
    householdId: 'h1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const find = (list: Dish[], name: string) => list.find((d) => d.name.toLowerCase() === name.toLowerCase());
// Mirrors the screen's stale rule: getDaysSince(lastCookedDate) >= 30.
const daysSince = (d: string) =>
  Math.floor((new Date(TODAY + 'T00:00:00').getTime() - new Date(d + 'T00:00:00').getTime()) / 86400000);

describe('aggregateDishes', () => {
  // Mirrors the real household: Khichadi cooked 3× in July + Sabudana in July;
  // Palak Paneer only in June; Poli as a side.
  const meals: Meal[] = [
    meal('2026-07-20', 'Khichadi'),
    meal('2026-07-26', 'Khichadi'),
    meal('2026-07-30', 'Khichadi'),
    meal('2026-06-05', 'Khichadi'), // older Khichadi (last month)
    meal('2026-06-01', 'Palak Paneer'), // June only → stale
    meal('2026-06-15', 'Schezwan Rice'), // June only → stale
    meal('2026-07-13', 'Masoor', ['Masoor', 'Poli']),
    meal('2026-07-28', 'Poli', ['Poli', 'Bhendi']),
    meal('2026-08-02', 'Future Dish'), // after today → ignored
  ];

  it('all-time (no window) counts every occurrence including older months', () => {
    const all = aggregateDishes([], meals, { today: TODAY });
    expect(find(all, 'Khichadi')?.timesCooked).toBe(4); // 3 July + 1 June
    expect(find(all, 'Palak Paneer')?.timesCooked).toBe(1);
  });

  it('windowed to this month counts only in-window meals', () => {
    const july = aggregateDishes([], meals, { today: TODAY, window: THIS_MONTH });
    expect(find(july, 'Khichadi')?.timesCooked).toBe(3); // the 4th (June) excluded
    // A dish never cooked in July is absent from the windowed set entirely.
    expect(find(july, 'Palak Paneer')).toBeUndefined();
    expect(find(july, 'Schezwan Rice')).toBeUndefined();
  });

  it('counts thali sides (items), not just the primary dish', () => {
    const all = aggregateDishes([], meals, { today: TODAY });
    // Poli is a side in Masoor (07-13) and primary+side in the Poli meal (07-28).
    expect(find(all, 'Poli')?.timesCooked).toBe(2);
  });

  it('ignores future-dated (planned) meals', () => {
    const all = aggregateDishes([], meals, { today: TODAY });
    expect(find(all, 'Future Dish')).toBeUndefined();
  });

  it('counts HOME meals only — outside (dine-out/takeout) dishes are excluded', () => {
    const withOutside: Meal[] = [
      meal('2026-07-20', 'Khichadi'), // home
      { ...meal('2026-07-21', 'Paneer Tikka'), sourceType: 'dineout', restaurantName: 'Spice Hub' },
      { ...meal('2026-07-22', 'Noodles'), sourceType: 'takeout', restaurantName: 'Wok In' },
    ];
    const all = aggregateDishes([], withOutside, { today: TODAY });
    expect(find(all, 'Khichadi')?.timesCooked).toBe(1);
    // Ordered-out dishes are NOT part of the dish library.
    expect(find(all, 'Paneer Tikka')).toBeUndefined();
    expect(find(all, 'Noodles')).toBeUndefined();
  });

  it('supports the stale list all-time but NOT under a month window (the bug)', () => {
    // All-time: June-only dishes are present with a 30+ day-old lastCookedDate,
    // so the "not made 30+ days" filter surfaces them.
    const all = aggregateDishes([], meals, { today: TODAY });
    const stale = all.filter((d) => d.lastCookedDate && daysSince(d.lastCookedDate) >= 30);
    expect(stale.map((d) => d.name).sort()).toEqual(['Palak Paneer', 'Schezwan Rice']);

    // If a this-month window were (wrongly) applied to the stale view, those
    // June dishes vanish — which was exactly the "only one dish" regression.
    const windowed = aggregateDishes([], meals, { today: TODAY, window: THIS_MONTH });
    const staleWindowed = windowed.filter((d) => d.lastCookedDate && daysSince(d.lastCookedDate) >= 30);
    expect(staleWindowed).toHaveLength(0);
  });

  it('seeds saved dishes at 0 and derives their real counts from meals', () => {
    const saved: Dish[] = [
      { id: 's1', name: 'Khichadi', cuisineTag: 'Indian', categoryTags: [], isFavorite: true, timesCooked: 99, lastCookedDate: '2020-01-01', householdId: 'h1' },
      { id: 's2', name: 'Never Cooked', cuisineTag: 'Indian', categoryTags: [], isFavorite: false, timesCooked: 5, lastCookedDate: '2019-01-01', householdId: 'h1' },
    ];
    const all = aggregateDishes(saved, meals, { today: TODAY });
    // Stored 99 is reset; real derived count wins.
    expect(find(all, 'Khichadi')?.timesCooked).toBe(4);
    // A saved dish never appearing in meals stays at 0 (favorite flag preserved).
    const never = find(all, 'Never Cooked');
    expect(never?.timesCooked).toBe(0);
    expect(never?.isFavorite).toBe(false);
  });
});
