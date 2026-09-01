import { cookAgainDishes, decideForMe, isLeftovers, LEFTOVERS_NAME } from '../quickActions';
import { Dish, Meal } from '../../types';

const dish = (name: string, over: Partial<Dish> = {}): Dish => ({
  id: name,
  name,
  cuisineTag: 'Indian',
  categoryTags: [],
  isFavorite: false,
  timesCooked: 0,
  lastCookedDate: '',
  householdId: 'h',
  ...over,
});

const meal = (over: Partial<Meal> = {}): Meal => ({
  id: Math.random().toString(36).slice(2),
  date: '2026-08-01',
  mealType: 'dinner',
  sourceType: 'home',
  dishName: 'Dal',
  cuisineTag: 'Indian',
  createdBy: 'u',
  householdId: 'h',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

describe('isLeftovers', () => {
  it('matches the marker regardless of case/space', () => {
    expect(isLeftovers(LEFTOVERS_NAME)).toBe(true);
    expect(isLeftovers('  leftovers ')).toBe(true);
    expect(isLeftovers('LEFTOVERS')).toBe(true);
  });
  it('does not match real dishes or empties', () => {
    expect(isLeftovers('Dal')).toBe(false);
    expect(isLeftovers('')).toBe(false);
    expect(isLeftovers(undefined)).toBe(false);
  });
});

describe('cookAgainDishes', () => {
  const today = '2026-08-31';

  it('returns recent home dishes most-recent first, de-duplicated', () => {
    const meals = [
      meal({ dishName: 'Dal', date: '2026-08-10' }),
      meal({ dishName: 'Paneer', date: '2026-08-20' }),
      meal({ dishName: 'Dal', date: '2026-08-25' }), // Dal cooked again, newer
    ];
    const out = cookAgainDishes(meals, [], today);
    expect(out.map((d) => d.name)).toEqual(['Dal', 'Paneer']);
    expect(out[0].lastCookedDate).toBe('2026-08-25');
  });

  it('excludes outside meals, kids meals, future dates, and leftovers', () => {
    const meals = [
      meal({ dishName: 'Pizza', sourceType: 'takeout', date: '2026-08-28' }),
      meal({ dishName: 'Tiffin', audience: 'kids', date: '2026-08-27' }),
      meal({ dishName: 'FutureDish', date: '2026-09-05' }),
      meal({ dishName: LEFTOVERS_NAME, date: '2026-08-29' }),
      meal({ dishName: 'Khichdi', date: '2026-08-26' }),
    ];
    const out = cookAgainDishes(meals, [], today);
    expect(out.map((d) => d.name)).toEqual(['Khichdi']);
  });

  it('expands thali sides from items[] and surfaces the favorite flag', () => {
    const meals = [
      meal({
        dishName: 'Roti',
        items: [{ name: 'Roti' }, { name: 'Bhindi' }],
        date: '2026-08-15',
      }),
    ];
    const out = cookAgainDishes(meals, [dish('Bhindi', { isFavorite: true })], today);
    const bhindi = out.find((d) => d.name === 'Bhindi');
    expect(bhindi?.isFavorite).toBe(true);
    expect(out.map((d) => d.name).sort()).toEqual(['Bhindi', 'Roti']);
  });

  it('honors the limit', () => {
    const meals = Array.from({ length: 12 }, (_, i) =>
      meal({ dishName: `Dish${i}`, date: `2026-08-${String(i + 1).padStart(2, '0')}` }),
    );
    expect(cookAgainDishes(meals, [], today, 5)).toHaveLength(5);
  });
});

describe('decideForMe', () => {
  const now = new Date('2026-08-31T12:00:00');

  it('returns null when there are no home dishes', () => {
    expect(decideForMe([], [], { now })).toBeNull();
  });

  it('prefers a favorite / staler dish (deterministic top pick)', () => {
    const dishes = [
      dish('Fresh', { lastCookedDate: '2026-08-30' }), // 1 day ago
      dish('Favorite', { isFavorite: true, lastCookedDate: '2026-08-20' }),
    ];
    const out = decideForMe(dishes, [], { now, rng: () => 0 });
    expect(out?.name).toBe('Favorite');
  });

  it('excludes dishes cooked within avoidRepeatDays', () => {
    const dishes = [dish('Recent', { lastCookedDate: '2026-08-30' })];
    const meals = [meal({ dishName: 'Recent', date: '2026-08-30' })];
    const out = decideForMe(dishes, meals, { now, avoidRepeatDays: 5, rng: () => 0 });
    expect(out).toBeNull();
  });

  it('never suggests the leftovers marker', () => {
    const dishes = [dish(LEFTOVERS_NAME), dish('Real')];
    const out = decideForMe(dishes, [], { now, rng: () => 0 });
    expect(out?.name).toBe('Real');
  });

  it('flags a never-cooked dish as new with null days', () => {
    const out = decideForMe([dish('BrandNew')], [], { now, rng: () => 0 });
    expect(out).toMatchObject({ name: 'BrandNew', isNew: true, lastMadeDaysAgo: null });
  });

  it('uses real meal history over a stale stored lastCookedDate', () => {
    // Stored aggregate says long ago, but a meal shows it was cooked yesterday →
    // must be excluded under avoidRepeatDays.
    const dishes = [dish('Dal', { lastCookedDate: '2026-01-01' })];
    const meals = [meal({ dishName: 'Dal', date: '2026-08-30' })];
    const out = decideForMe(dishes, meals, { now, avoidRepeatDays: 5, rng: () => 0 });
    expect(out).toBeNull();
  });
});
