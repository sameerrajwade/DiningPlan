import {
  normalizeIngredient,
  dedupeNewItems,
  ingredientsForDishes,
} from '../grocery';

describe('normalizeIngredient', () => {
  it('lowercases, strips punctuation, collapses whitespace', () => {
    expect(normalizeIngredient('  Ginger-Garlic ')).toBe('ginger garlic');
    expect(normalizeIngredient('Onion')).toBe('onion');
  });
  it('folds common plurals to singular on the last word', () => {
    expect(normalizeIngredient('Onions')).toBe('onion');
    expect(normalizeIngredient('Tomatoes')).toBe('tomato');
    expect(normalizeIngredient('Potatoes')).toBe('potato');
    // ies -> y (so a plural and its singular collapse to one key)
    expect(normalizeIngredient('Curries')).toBe(normalizeIngredient('Curry'));
    expect(normalizeIngredient('Berries')).toBe(normalizeIngredient('Berry'));
  });
  it('leaves short words and double-s words alone', () => {
    expect(normalizeIngredient('oil')).toBe('oil');
    expect(normalizeIngredient('peas')).toBe('pea');
    expect(normalizeIngredient('grass')).toBe('grass');
  });
});

describe('dedupeNewItems', () => {
  it('returns only genuinely new items (case/plural-insensitive)', () => {
    const existing = ['Onion', 'rice'];
    const incoming = ['onions', 'Tomato', 'RICE', 'tomato'];
    expect(dedupeNewItems(existing, incoming)).toEqual(['Tomato']);
  });
  it('drops blanks and preserves incoming display text/order', () => {
    expect(dedupeNewItems([], ['  Paneer ', '', 'Butter'])).toEqual(['Paneer', 'Butter']);
  });
});

describe('ingredientsForDishes', () => {
  it('merges and dedupes ingredients across dishes', () => {
    const result = ingredientsForDishes(
      [['onion', 'garlic', 'noodles'], ['onion', 'garlic', 'paneer'], undefined],
      [],
    );
    expect(result).toEqual(['onion', 'garlic', 'noodles', 'paneer']);
  });
  it('excludes items already on the list', () => {
    const result = ingredientsForDishes([['onion', 'tomato']], ['Onions']);
    expect(result).toEqual(['tomato']);
  });
});
