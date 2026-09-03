import {
  generatePackCode,
  normalizePackCode,
  buildDishPack,
  newPackDishes,
  packDishesToDishes,
} from '../dishPack';
import { Dish, Meal, Restaurant } from '../../types';

const dish = (name: string, over: Partial<Dish> = {}): Dish => ({
  id: name,
  name,
  cuisineTag: 'Indian',
  categoryTags: [],
  isFavorite: false,
  timesCooked: 3,
  lastCookedDate: '2026-08-01',
  householdId: 'h',
  ...over,
});

const meal = (over: Partial<Meal> = {}): Meal => ({
  id: Math.random().toString(36).slice(2),
  date: '2026-08-01',
  mealType: 'lunch',
  sourceType: 'home',
  dishName: 'Dal',
  cuisineTag: 'Indian',
  createdBy: 'u',
  householdId: 'h',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

const restaurant = (name: string, over: Partial<Restaurant> = {}): Restaurant => ({
  id: name,
  name,
  cuisineType: 'Indian',
  totalVisits: 9,
  totalSpend: 4200,
  lastVisitDate: '2026-08-01',
  householdId: 'h',
  ...over,
});

describe('generatePackCode', () => {
  it('is 6 chars from the unambiguous alphabet', () => {
    const code = generatePackCode(() => 0.5);
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });
  it('is deterministic under a seeded rng', () => {
    const seq = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
    let i = 0;
    const rng = () => seq[i++ % seq.length];
    let j = 0;
    const rng2 = () => seq[j++ % seq.length];
    expect(generatePackCode(rng)).toBe(generatePackCode(rng2));
  });
});

describe('normalizePackCode', () => {
  it('trims and uppercases', () => {
    expect(normalizePackCode('  ab2xy9 ')).toBe('AB2XY9');
  });
});

describe('buildDishPack', () => {
  const base = {
    code: 'ABC234',
    userId: 'u1',
    householdName: 'Rajwade Family',
  };

  it('includes cooked-dish definitions but never meals/ratings/spend', () => {
    const pack = buildDishPack({
      ...base,
      dishes: [dish('Paneer', { ingredients: ['paneer', 'onion'], recipe: { type: 'youtube', value: 'https://youtu.be/x' } })],
      meals: [meal({ dishName: 'Paneer' })],
      restaurants: [restaurant('Curry House')],
    });
    expect(pack.dishes).toEqual([
      {
        name: 'Paneer',
        cuisineTag: 'Indian',
        ingredients: ['paneer', 'onion'],
        recipe: { type: 'youtube', value: 'https://youtu.be/x' },
      },
    ]);
    // No leaked fields
    const serialized = JSON.stringify(pack);
    expect(serialized).not.toContain('timesCooked');
    expect(serialized).not.toContain('totalSpend');
    expect(serialized).not.toContain('totalVisits');
    expect(serialized).not.toContain('lastCookedDate');
  });

  it('shares only what was COOKED — a saved-but-uncooked dish is excluded, a cooked-but-unsaved dish is included', () => {
    const pack = buildDishPack({
      ...base,
      // Library has Paneer (never cooked) + Dal; meals cooked Dal + Poha (Poha not saved).
      dishes: [dish('Paneer'), dish('Dal', { ingredients: ['dal', 'onion'] })],
      meals: [meal({ dishName: 'Dal' }), meal({ dishName: 'Poha', cuisineTag: 'Indian' })],
      restaurants: [],
    });
    const names = pack.dishes.map((d) => d.name).sort();
    expect(names).toEqual(['Dal', 'Poha']); // Paneer (uncooked) excluded, Poha (unsaved) included
    expect(pack.dishes.find((d) => d.name === 'Dal')?.ingredients).toEqual(['dal', 'onion']); // enriched from library
  });

  it('reads thali sides in items[] and excludes the leftovers marker', () => {
    const pack = buildDishPack({
      ...base,
      dishes: [],
      meals: [
        meal({ dishName: 'Thali', items: [{ name: 'Dal' }, { name: 'Rice' }, { name: 'Sabzi' }] }),
        meal({ dishName: 'Leftovers', items: [] }),
      ],
      restaurants: [],
    });
    expect(pack.dishes.map((d) => d.name).sort()).toEqual(['Dal', 'Rice', 'Sabzi']);
  });

  it('dedupes cooked family dishes case-insensitively', () => {
    const pack = buildDishPack({
      ...base,
      dishes: [],
      meals: [meal({ dishName: 'Dal' }), meal({ dishName: 'dal' }), meal({ dishName: 'Rice' })],
      restaurants: [],
    });
    expect(pack.dishes.map((d) => d.name)).toEqual(['Dal', 'Rice']);
  });

  it('excludes outside meals from family dishes', () => {
    const pack = buildDishPack({
      ...base,
      dishes: [],
      meals: [
        meal({ dishName: 'Home Dal' }),
        meal({ dishName: 'Ordered Biryani', sourceType: 'takeout', restaurantName: 'Biryani House' }),
      ],
      restaurants: [],
    });
    expect(pack.dishes.map((d) => d.name)).toEqual(['Home Dal']); // takeout dish not "cooked"
  });

  it('extracts distinct kids-tiffin dishes only from kids meals', () => {
    const pack = buildDishPack({
      ...base,
      dishes: [dish('Veg Sandwich', { cuisineTag: 'American' })],
      meals: [
        meal({ dishName: 'Veg Sandwich', audience: 'kids' }),
        meal({ dishName: 'Veg Sandwich', audience: 'kids' }), // dupe
        meal({ dishName: 'Poha', audience: 'kids' }), // not in library → name+cuisine
        meal({ dishName: 'Dal', audience: 'family' }), // family, excluded from kids
      ],
      restaurants: [],
    });
    expect(pack.kidsDishes.map((d) => d.name).sort()).toEqual(['Poha', 'Veg Sandwich']);
    const sandwich = pack.kidsDishes.find((d) => d.name === 'Veg Sandwich');
    expect(sandwich?.cuisineTag).toBe('American'); // enriched from library
  });

  it('shares restaurants actually EATEN AT (meal-derived), NAME + cuisine only', () => {
    const pack = buildDishPack({
      ...base,
      dishes: [],
      meals: [
        meal({ sourceType: 'dineout', dishName: 'Dosa', restaurantName: 'Curry House', cuisineTag: 'Indian' }),
        meal({ sourceType: 'takeout', dishName: 'Dosa', restaurantName: 'curry house', cuisineTag: 'Indian' }), // dupe name
      ],
      // A restaurant DOC that was never actually eaten at (e.g. rated / imported)
      // must NOT appear — membership is meal-derived, not doc-derived.
      restaurants: [
        restaurant('Curry House', { totalSpend: 9999, totalVisits: 12 }),
        restaurant('Ghost Diner', { totalVisits: 0 }),
      ],
    });
    expect(pack.restaurants).toEqual([{ name: 'Curry House', cuisineType: 'Indian' }]);
  });
});

describe('newPackDishes', () => {
  it('drops dishes already in the importer library', () => {
    const packDishes = [
      { name: 'Dal', cuisineTag: 'Indian' as const },
      { name: 'Paneer', cuisineTag: 'Indian' as const },
    ];
    expect(newPackDishes(packDishes, ['dal']).map((d) => d.name)).toEqual(['Paneer']);
  });
});

describe('packDishesToDishes', () => {
  it('seeds fresh dishes (timesCooked 0) carrying ingredients + recipe', () => {
    const out = packDishesToDishes(
      [{ name: 'Paneer', cuisineTag: 'Indian', ingredients: ['paneer'], recipe: { type: 'text', value: 'steps' } }],
      'h2',
    );
    expect(out[0]).toMatchObject({
      name: 'Paneer',
      timesCooked: 0,
      lastCookedDate: '',
      householdId: 'h2',
      ingredients: ['paneer'],
      recipe: { type: 'text', value: 'steps' },
    });
  });
});
