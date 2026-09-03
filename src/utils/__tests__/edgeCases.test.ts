import { buildDishPack } from '../dishPack';
import { aggregateDishes } from '../dishStats';
import { dedupeNewItems, ingredientsForDishes, normalizeIngredient } from '../grocery';
import { decideForMe, cookAgainDishes, isLeftovers } from '../quickActions';
import { parseRecipeInput } from '../recipe';
import { computeInsights } from '../../services/insights';
import type { Dish, Meal } from '../../types';

// ── Negative & boundary scenarios ────────────────────────────────────────────
// Deliberately hostile / empty / degenerate inputs. These guard the "nothing
// there yet", "only leftovers", "all dupes", "future only" cases that a real
// household hits on day one or after clearing data — the paths most likely to
// crash or produce nonsense if a refactor slips.

const dish = (name: string, over: Partial<Dish> = {}): Dish => ({
  id: name, name, cuisineTag: 'Indian', categoryTags: [], isFavorite: false,
  timesCooked: 0, lastCookedDate: '', householdId: 'h', ...over,
});
const meal = (over: Partial<Meal> = {}): Meal => ({
  id: Math.random().toString(36).slice(2), date: '2026-08-01', mealType: 'lunch',
  sourceType: 'home', dishName: 'Dal', cuisineTag: 'Indian', createdBy: 'u',
  householdId: 'h', createdAt: new Date(), updatedAt: new Date(), ...over,
});
const base = { code: 'ABC234', userId: 'u', householdName: 'Test Family' };

describe('buildDishPack — degenerate inputs', () => {
  it('returns an empty pack when there is nothing at all', () => {
    const p = buildDishPack({ ...base, dishes: [], meals: [], restaurants: [] });
    expect(p.dishes).toEqual([]);
    expect(p.kidsDishes).toEqual([]);
    expect(p.restaurants).toEqual([]);
  });
  it('shares nothing when the only meal is leftovers', () => {
    const p = buildDishPack({ ...base, dishes: [], meals: [meal({ dishName: 'Leftovers', items: [] })], restaurants: [] });
    expect(p.dishes).toEqual([]);
  });
  it('ignores empty / whitespace dish names', () => {
    const p = buildDishPack({ ...base, dishes: [], meals: [meal({ dishName: '' }), meal({ dishName: '   ' })], restaurants: [] });
    // '' is skipped; '   ' trims to empty and is skipped too.
    expect(p.dishes.filter((d) => d.name.trim() === '')).toEqual([]);
  });
});

describe('aggregateDishes — degenerate inputs', () => {
  const TODAY = '2026-08-15';
  it('empty meals + empty saved → empty', () => {
    expect(aggregateDishes([], [], { today: TODAY })).toEqual([]);
  });
  it('future-only meals are all ignored', () => {
    const out = aggregateDishes([], [meal({ date: '2026-12-01', dishName: 'Future' })], { today: TODAY });
    expect(out).toEqual([]);
  });
  it('outside-only meals never become dishes', () => {
    const out = aggregateDishes([], [meal({ sourceType: 'dineout', dishName: 'Biryani', restaurantName: 'X' })], { today: TODAY });
    expect(out).toEqual([]);
  });
});

describe('computeInsights — empty & leftovers-only', () => {
  it('empty meals produce zeros, no crash', () => {
    const r = computeInsights([], []);
    expect(r.homeCookedPercent).toBe(0);
    expect(r.uniqueDishes).toBe(0);
    expect(r.cuisineBreakdown).toEqual([]);
    expect(r.mostCookedDishes).toEqual([]);
    expect(r.outsideSpending).toBe(0);
  });
  it('a leftovers-only month yields no dishes and no cuisine', () => {
    const r = computeInsights([meal({ dishName: 'Leftovers', items: [] })], []);
    expect(r.uniqueDishes).toBe(0);
    expect(r.cuisineBreakdown).toEqual([]);
    expect(r.mostCookedDishes).toEqual([]);
  });
});

describe('grocery helpers — degenerate inputs', () => {
  it('dedupeNewItems drops empties, whitespace, and case/plural dupes', () => {
    expect(dedupeNewItems(['onion'], ['', '   ', 'Onion', 'onions', 'ONION'])).toEqual([]);
    expect(dedupeNewItems([], ['', '  ', 'Salt'])).toEqual(['Salt']);
  });
  it('ingredientsForDishes tolerates undefined / empty lists', () => {
    expect(ingredientsForDishes([undefined, [], undefined], [])).toEqual([]);
    expect(ingredientsForDishes([undefined, ['salt'], []], [])).toEqual(['salt']);
  });
  it('normalizeIngredient never throws on empty', () => {
    expect(normalizeIngredient('')).toBe('');
    expect(normalizeIngredient('   ')).toBe('');
  });
});

describe('quickActions — nothing to suggest', () => {
  it('decideForMe returns null with no dishes', () => {
    expect(decideForMe([], [])).toBeNull();
  });
  it('decideForMe skips a library that is only the leftovers marker', () => {
    expect(decideForMe([dish('Leftovers')], [])).toBeNull();
  });
  it('cookAgainDishes returns [] with no meals', () => {
    expect(cookAgainDishes([], [], '2026-08-15')).toEqual([]);
  });
  it('isLeftovers is space/case-insensitive and null-safe', () => {
    expect(isLeftovers(undefined)).toBe(false);
    expect(isLeftovers('  leftovers ')).toBe(true);
    expect(isLeftovers('LEFTOVERS')).toBe(true);
  });
});

describe('parseRecipeInput — empty / junk', () => {
  it('empty and whitespace → null', () => {
    expect(parseRecipeInput('')).toBeNull();
    expect(parseRecipeInput('    ')).toBeNull();
  });
});
