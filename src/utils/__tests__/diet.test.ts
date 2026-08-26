import { isNonVegName, inferDietFromNames, mealDiet } from '../diet';
import type { Meal } from '../../types';

describe('isNonVegName', () => {
  it('flags common English non-veg dishes', () => {
    ['Butter Chicken', 'Mutton Rogan', 'Fish Fry', 'Prawn Masala', 'Egg Curry', 'Pork Ribs', 'Grilled Steak']
      .forEach((n) => expect(isNonVegName(n)).toBe(true));
  });

  it('flags Hindi/Urdu meat & fish words', () => {
    ['Murgh Makhani', 'Gosht Biryani', 'Keema Pav', 'Macchi Curry', 'Jhinga Masala', 'Anda Bhurji', 'Tangdi Kabab']
      .forEach((n) => expect(isNonVegName(n)).toBe(true));
  });

  it('does NOT flag veg dishes', () => {
    ['Aloo Gobi', 'Dal Tadka', 'Paneer Butter Masala', 'Veg Biryani', 'Chole', 'Rajma Chawal', 'Poha']
      .forEach((n) => expect(isNonVegName(n)).toBe(false));
  });

  it('avoids false positives via word boundaries', () => {
    // "eggplant"/"eggless" contain "egg"; "graham" contains "ham" — none should flag.
    ['Eggplant Parmesan', 'Eggless Cake', 'Graham Crackers', 'Baingan Bharta']
      .forEach((n) => expect(isNonVegName(n)).toBe(false));
  });

  it('leaves ambiguous names veg (user can flip)', () => {
    // Plain kebab/biryani carry no meat keyword, so they stay veg by default.
    ['Veg Kebab', 'Paneer Tikka', 'Hyderabadi Biryani']
      .forEach((n) => expect(isNonVegName(n)).toBe(false));
  });

  it('known limitation: a meat keyword flags even in a negation phrase', () => {
    // "chicken-free" still contains "chicken" — a keyword matcher can't parse the
    // negation, so it flags non-veg. The tappable mark lets the user correct it.
    expect(isNonVegName('Chicken-free Kebab')).toBe(true);
  });

  it('handles empty/undefined', () => {
    expect(isNonVegName('')).toBe(false);
    expect(isNonVegName(undefined)).toBe(false);
    expect(isNonVegName(null)).toBe(false);
  });
});

describe('inferDietFromNames', () => {
  it('is non-veg if ANY name is non-veg', () => {
    expect(inferDietFromNames(['Roti', 'Dal', 'Chicken Curry'])).toBe('nonveg');
  });
  it('is veg when all names are veg', () => {
    expect(inferDietFromNames(['Roti', 'Dal', 'Sabzi'])).toBe('veg');
  });
  it('defaults veg for empty input', () => {
    expect(inferDietFromNames([])).toBe('veg');
  });
});

describe('mealDiet', () => {
  const base = { dishName: 'Aloo Paratha', items: undefined } as Pick<Meal, 'diet' | 'dishName' | 'items'>;

  it('honors an explicit stored diet', () => {
    expect(mealDiet({ ...base, diet: 'nonveg' })).toBe('nonveg');
    expect(mealDiet({ ...base, dishName: 'Chicken', diet: 'veg' })).toBe('veg');
  });

  it('infers from names when diet is absent (old meals)', () => {
    expect(mealDiet({ dishName: 'Fish Curry' })).toBe('nonveg');
    expect(mealDiet({ dishName: 'Dal Rice' })).toBe('veg');
  });

  it('inspects items too', () => {
    expect(mealDiet({ dishName: 'Thali', items: [{ name: 'Roti' }, { name: 'Mutton' }] })).toBe('nonveg');
  });
});
