import { stripUndefined } from '../sanitize';

describe('stripUndefined — Firestore write guard', () => {
  it('drops top-level undefined fields', () => {
    expect(stripUndefined({ a: 1, b: undefined, c: 'x' })).toEqual({ a: 1, c: 'x' });
  });

  // THE launch bug: a dine-out/takeout meal whose ordered dish has no star rating
  // produced items: [{ name, rating: undefined }] → Firestore rejected the write.
  it('drops undefined nested inside array elements (meal.items rating)', () => {
    const meal = {
      date: '2026-08-01',
      sourceType: 'dineout',
      restaurantName: 'Nonna\'s Kitchen',
      items: [
        { name: 'Margherita Pizza', rating: undefined },
        { name: 'Tiramisu', rating: 5 },
      ],
    };
    expect(stripUndefined(meal)).toEqual({
      date: '2026-08-01',
      sourceType: 'dineout',
      restaurantName: 'Nonna\'s Kitchen',
      items: [{ name: 'Margherita Pizza' }, { name: 'Tiramisu', rating: 5 }],
    });
  });

  it('drops undefined in nested maps', () => {
    expect(stripUndefined({ a: { b: undefined, c: 2 } })).toEqual({ a: { c: 2 } });
  });

  it('preserves Date and other non-plain instances verbatim', () => {
    const d = new Date('2026-01-01');
    const out = stripUndefined({ when: d, n: 1 });
    expect(out.when).toBe(d);
  });

  it('preserves falsy-but-defined values (0, "", false, null)', () => {
    expect(stripUndefined({ a: 0, b: '', c: false, d: null })).toEqual({
      a: 0, b: '', c: false, d: null,
    });
  });

  it('handles arrays of primitives and empty structures', () => {
    expect(stripUndefined({ tags: ['a', 'b'], items: [] })).toEqual({ tags: ['a', 'b'], items: [] });
  });
});
