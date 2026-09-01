import { generateMealPlan } from '../planner';
import { Dish, Meal, UserPreferences } from '../../types';

const prefs = (over: Partial<UserPreferences> = {}): UserPreferences => ({
  defaultMeals: ['lunch', 'dinner'],
  monthlyDineOutBudget: 5000,
  dishRotationDays: 7,
  currency: 'INR',
  maxDineOutsPerWeek: 0, // disable dine-out randomness for deterministic asserts
  avoidRepeatDays: 3,
  includeNewDishes: true,
  ...over,
});

const dish = (name: string, over: Partial<Dish> = {}): Dish => ({
  id: name,
  name,
  cuisineTag: 'Indian',
  categoryTags: [],
  isFavorite: false,
  timesCooked: 1,
  lastCookedDate: '2000-01-01',
  householdId: 'h1',
  ...over,
});

const meal = (name: string, date: string, over: Partial<Meal> = {}): Meal => ({
  id: `${name}-${date}`,
  date,
  mealType: 'lunch',
  sourceType: 'home',
  dishName: name,
  cuisineTag: 'Indian',
  createdBy: 'u1',
  householdId: 'h1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

const dishes = [dish('Chole'), dish('Dosa'), dish('Pulao'), dish('Rajma')];

describe('generateMealPlan', () => {
  it('produces one entry per requested day with filled slots', () => {
    const plan = generateMealPlan(dishes, [], prefs(), '2026-07-06', 3);
    expect(plan).toHaveLength(3);
    for (const day of plan) {
      expect(day.lunch.dishName.length).toBeGreaterThan(0);
      expect(day.dinner.dishName.length).toBeGreaterThan(0);
    }
  });

  it('omits the kids track when planKidsTiffin is off', () => {
    const plan = generateMealPlan(dishes, [], prefs({ planKidsTiffin: false }), '2026-07-06', 3);
    expect(plan.every((d) => d.kids === undefined)).toBe(true);
  });

  it('adds a kids tiffin on weekdays from kids history when enabled', () => {
    // 2026-07-06..08 = Mon..Wed (all weekdays)
    const kidHistory = [meal('Veg Sandwich', '2026-07-01', { audience: 'kids' })];
    const plan = generateMealPlan(dishes, kidHistory, prefs({ planKidsTiffin: true }), '2026-07-06', 3);
    expect(plan.every((d) => d.kids?.dishName === 'Veg Sandwich')).toBe(true);
  });

  it('does not auto-plan kids tiffin on weekends', () => {
    // 2026-07-06 is a Monday, so a 7-day plan spans Mon..Sun with
    // Sat 2026-07-11 and Sun 2026-07-12 as the weekend.
    const kidHistory = [meal('Veg Sandwich', '2026-07-01', { audience: 'kids' })];
    const plan = generateMealPlan(dishes, kidHistory, prefs({ planKidsTiffin: true }), '2026-07-06', 7);
    const byDate = Object.fromEntries(plan.map((d) => [d.date, d]));
    expect(byDate['2026-07-11'].kids).toBeUndefined(); // Saturday
    expect(byDate['2026-07-12'].kids).toBeUndefined(); // Sunday
    // Weekdays still receive a kids tiffin
    expect(byDate['2026-07-06'].kids?.dishName).toBe('Veg Sandwich'); // Monday
    expect(byDate['2026-07-10'].kids?.dishName).toBe('Veg Sandwich'); // Friday
  });

  it('does not let never-cooked dishes permanently bury a real rotation dish', () => {
    // Seeded starter catalogs create many never-cooked dishes. With the old
    // score (999 for never-cooked) they would always outrank a dish you actually
    // cook, so your real rotation never surfaces. Cap makes a genuinely-stale
    // cooked dish competitive again.
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0); // always pick top-scored
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const oldFav = dish('MyStapleCurry', {
        lastCookedDate: ninetyDaysAgo.toISOString().slice(0, 10),
        timesCooked: 12,
      });
      // Five never-cooked seeded dishes — more than the 4 slots in a 2-day plan,
      // so under the old behavior the staple would be crowded out entirely.
      const seeded = ['Seed1', 'Seed2', 'Seed3', 'Seed4', 'Seed5'].map((n) =>
        dish(n, { lastCookedDate: '', timesCooked: 0 }),
      );
      const today = new Date().toISOString().slice(0, 10);
      const plan = generateMealPlan([oldFav, ...seeded], [], prefs(), today, 2);
      const names = plan.flatMap((d) => [d.lunch.dishName, d.dinner.dishName]);
      expect(names).toContain('MyStapleCurry');
    } finally {
      spy.mockRestore();
    }
  });

  it('avoids dishes cooked within avoidRepeatDays', () => {
    const today = new Date().toISOString().slice(0, 10);
    const recent = [meal('Chole', today)];
    const plan = generateMealPlan(dishes, recent, prefs({ avoidRepeatDays: 30 }), today, 2);
    const names = plan.flatMap((d) => [d.lunch.dishName, d.dinner.dishName]);
    expect(names).not.toContain('Chole');
  });

  // A small deterministic PRNG so variety asserts don't depend on Math.random.
  const seeded = (seed: number) => () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const bigLibrary = Array.from({ length: 40 }, (_, i) =>
    dish(`Dish${i}`, {
      cuisineTag: ['Indian', 'Chinese', 'Italian', 'Thai'][i % 4],
      lastCookedDate: '',
      timesCooked: 0,
    }),
  );

  it('draws on many distinct dishes across a week from a large library', () => {
    // 7 days × 2 slots = 14 picks; with 40 dishes we expect near-14 distinct,
    // not the same handful. (Old top-3 logic capped effective variety.)
    const plan = generateMealPlan(bigLibrary, [], prefs(), '2026-07-06', 7, seeded(1));
    const names = plan.flatMap((d) => [d.lunch.dishName, d.dinner.dishName]);
    const distinct = new Set(names);
    expect(distinct.size).toBeGreaterThanOrEqual(12);
  });

  it('produces different plans on regenerate (different rng state)', () => {
    const a = generateMealPlan(bigLibrary, [], prefs(), '2026-07-06', 3, seeded(1));
    const b = generateMealPlan(bigLibrary, [], prefs(), '2026-07-06', 3, seeded(999));
    const namesA = a.flatMap((d) => [d.lunch.dishName, d.dinner.dishName]).join(',');
    const namesB = b.flatMap((d) => [d.lunch.dishName, d.dinner.dishName]).join(',');
    expect(namesA).not.toEqual(namesB);
  });
});
