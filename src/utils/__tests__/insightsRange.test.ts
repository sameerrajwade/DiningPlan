import { getRange } from '../insightsRange';
import { computeInsights } from '../../services/insights';
import type { Meal } from '../../types';

// Local noon to stay timezone-safe (month/day math won't slip across a boundary).
const AUG_1 = new Date(2026, 7, 1, 12); // month is 0-indexed: 7 = August
const JUL_31 = new Date(2026, 6, 31, 12);
const JUL_15 = new Date(2026, 6, 15, 12);

function meal(date: string, dishName: string): Meal {
  return {
    id: `${date}-${dishName}`,
    date,
    mealType: 'dinner',
    sourceType: 'home',
    dishName,
    cuisineTag: 'Indian',
    createdBy: 'u1',
    householdId: 'h1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('getRange — window follows the current date', () => {
  it('"this month" (30d) is the calendar month of `now`', () => {
    expect(getRange('30d', AUG_1)).toEqual({
      start: '2026-08-01',
      end: '2026-08-01',
      prevStart: '2026-07-01',
      prevEnd: '2026-07-31',
    });
    expect(getRange('30d', JUL_15)).toEqual({
      start: '2026-07-01',
      end: '2026-07-15',
      prevStart: '2026-06-01',
      prevEnd: '2026-06-30',
    });
  });

  it('"last month" is the fully-closed prior month', () => {
    expect(getRange('lastMonth', AUG_1)).toEqual({
      start: '2026-07-01',
      end: '2026-07-31',
      prevStart: '2026-06-01',
      prevEnd: '2026-06-30',
    });
  });
});

describe('date rollover — most-cooked respects the current window', () => {
  // Khichadi cooked 3× in July + once in June (4 all-time). None in August.
  const meals: Meal[] = [
    meal('2026-07-20', 'Khichadi'),
    meal('2026-07-26', 'Khichadi'),
    meal('2026-07-30', 'Khichadi'),
    meal('2026-06-05', 'Khichadi'),
  ];

  const thisMonthMostCooked = (now: Date) => {
    const { start, end } = getRange('30d', now);
    const cur = meals.filter((m) => m.date >= start && m.date <= end && m.audience !== 'kids');
    return computeInsights(cur, []).mostCookedDishes;
  };

  it('on Jul 31, "this month" shows Khichadi ×3 (not the all-time 4)', () => {
    const k = thisMonthMostCooked(JUL_31).find((d) => d.name === 'Khichadi');
    expect(k?.count).toBe(3);
  });

  it('on Aug 1, "this month" no longer shows Khichadi (the stale-count bug)', () => {
    // The exact regression the user hit: after the month rolled over, Khichadi
    // must NOT appear under "this month" — August has none.
    const cooked = thisMonthMostCooked(AUG_1);
    expect(cooked.find((d) => d.name === 'Khichadi')).toBeUndefined();
    expect(cooked).toHaveLength(0);
  });
});
