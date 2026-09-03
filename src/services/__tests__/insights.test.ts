import { computeInsights } from '../insights';
import type { Meal, MealItem } from '../../types';

// Minimal Meal factory — only the fields computeInsights reads matter here.
function meal(partial: Partial<Meal>): Meal {
  return {
    id: Math.random().toString(36).slice(2),
    date: '2026-07-01',
    mealType: 'dinner',
    sourceType: 'home',
    dishName: '',
    cuisineTag: 'Indian',
    createdBy: 'u1',
    householdId: 'h1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

describe('computeInsights — most cooked dishes', () => {
  it('counts thali sides (items), not just the primary dish', () => {
    // Poli appears only as a side (items[1..]) across three home meals. It must
    // still surface in most-cooked (regression: sides were being ignored).
    const items = (names: string[]): MealItem[] => names.map((name) => ({ name }));
    const meals: Meal[] = [
      meal({ dishName: 'Bhaji', items: items(['Bhaji', 'Poli']) }),
      meal({ dishName: 'Dal', items: items(['Dal', 'Poli', 'Rice']) }),
      meal({ dishName: 'Bhaji', items: items(['Bhaji', 'Poli']) }),
    ];

    const { mostCookedDishes } = computeInsights(meals, []);
    const poli = mostCookedDishes.find((d) => d.name === 'Poli');
    const bhaji = mostCookedDishes.find((d) => d.name === 'Bhaji');

    expect(poli?.count).toBe(3);
    expect(bhaji?.count).toBe(2);
  });

  it('falls back to dishName when a home meal has no items array', () => {
    const meals: Meal[] = [
      meal({ dishName: 'Khichdi' }),
      meal({ dishName: 'Khichdi' }),
    ];
    const { mostCookedDishes } = computeInsights(meals, []);
    expect(mostCookedDishes[0]).toEqual({ name: 'Khichdi', count: 2 });
  });

  it('excludes outside (dine-out / takeout) dishes from most cooked', () => {
    const meals: Meal[] = [
      meal({ sourceType: 'dineout', dishName: 'Paneer Tikka', restaurantName: 'Spice Hub' }),
      meal({ sourceType: 'takeout', dishName: 'Noodles', restaurantName: 'Wok In' }),
      meal({ sourceType: 'home', dishName: 'Poha' }),
    ];
    const { mostCookedDishes } = computeInsights(meals, []);
    expect(mostCookedDishes.map((d) => d.name)).toEqual(['Poha']);
  });

  it('never lists Leftovers as a cooked dish', () => {
    const meals: Meal[] = [
      meal({ dishName: 'Poha' }),
      meal({ dishName: 'Leftovers', items: [] }),
      meal({ dishName: 'Leftovers', items: [] }),
    ];
    const { mostCookedDishes } = computeInsights(meals, []);
    expect(mostCookedDishes.map((d) => d.name)).toEqual(['Poha']);
  });
});

describe('computeInsights — leftovers are never counted', () => {
  it('excludes leftovers from unique dishes and cuisine variety', () => {
    const meals: Meal[] = [
      meal({ dishName: 'Poha', cuisineTag: 'Indian' }),
      meal({ dishName: 'Pasta', cuisineTag: 'Italian' }),
      meal({ dishName: 'Leftovers', items: [], cuisineTag: '' as any }), // would show as "Other"
    ];
    const { uniqueDishes, cuisineBreakdown } = computeInsights(meals, []);
    expect(uniqueDishes).toBe(2); // Poha + Pasta, not Leftovers
    expect(cuisineBreakdown.map((c) => c.cuisine).sort()).toEqual(['Indian', 'Italian']); // no "Other"
    // Percentages use the non-leftover denominator (2), so each real cuisine is 50%.
    expect(cuisineBreakdown.every((c) => c.percent === 50)).toBe(true);
  });
});

describe('computeInsights — home-cooked trend', () => {
  // Regression: a first-month user with no previous-period meals falsely saw
  // "Last period was 0% home". Trend must be 0 (suppressed) when there's no prior data.
  it('reports no trend when the previous period is empty', () => {
    const meals: Meal[] = [meal({ sourceType: 'home' }), meal({ sourceType: 'home' })];
    const { homeCookedTrend } = computeInsights(meals, []);
    expect(homeCookedTrend).toBe(0);
  });

  it('reports a real trend when the previous period has data', () => {
    const cur: Meal[] = [meal({ sourceType: 'home' }), meal({ sourceType: 'home' })]; // 100% home
    const prev: Meal[] = [meal({ sourceType: 'home' }), meal({ sourceType: 'dineout' })]; // 50% home
    const { homeCookedTrend } = computeInsights(cur, prev);
    expect(homeCookedTrend).toBe(50);
  });
});

describe('computeInsights — cuisine breakdown', () => {
  it('buckets a missing cuisineTag as "Other" (no undefined key)', () => {
    const meals: Meal[] = [meal({ cuisineTag: undefined as any }), meal({ cuisineTag: 'Italian' })];
    const { cuisineBreakdown } = computeInsights(meals, []);
    expect(cuisineBreakdown.map((c) => c.cuisine).sort()).toEqual(['Italian', 'Other']);
  });
});
