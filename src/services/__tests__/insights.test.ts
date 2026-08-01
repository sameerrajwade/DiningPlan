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
});
