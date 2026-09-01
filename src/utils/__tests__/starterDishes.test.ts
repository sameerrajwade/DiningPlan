import {
  catalogEntriesToDishes,
  matchCatalogDish,
  normalizeName,
  pickStarterDishes,
  suggestCatalogDishes,
  toSeedDish,
} from '../starterDishes';
import { STARTER_CATALOG } from '../../data/starterCatalog';

describe('normalizeName', () => {
  it('lowercases, strips punctuation and filler, collapses whitespace', () => {
    expect(normalizeName('Rajma  Chawal')).toBe('rajma chawal');
    expect(normalizeName('Rajma-Chawal')).toBe('rajma chawal');
    expect(normalizeName('Rice and Beans')).toBe('rice beans');
  });
});

describe('matchCatalogDish', () => {
  it('matches a known dish regardless of case/spacing', () => {
    expect(matchCatalogDish('rajma chawal')?.name).toBe('Rajma Chawal');
    expect(matchCatalogDish('  Butter   Chicken ')?.name).toBe('Butter Chicken');
  });
  it('returns null for an unknown dish (logging is never gated)', () => {
    expect(matchCatalogDish('grandmas secret stew')).toBeNull();
    expect(matchCatalogDish('')).toBeNull();
  });
  it('enriches with cuisine, region, diet and ingredients', () => {
    const m = matchCatalogDish('Palak Paneer');
    expect(m?.cuisineTag).toBe('Indian');
    expect(m?.region).toBe('Punjabi');
    expect(m?.diet).toBe('veg');
    expect(m?.ingredients).toContain('paneer');
  });
});

describe('suggestCatalogDishes', () => {
  it('prefix matches rank ahead of substring matches', () => {
    const s = suggestCatalogDishes('dal');
    expect(s[0].name.toLowerCase().startsWith('dal')).toBe(true);
  });
  it('is capped and empty for blank query', () => {
    expect(suggestCatalogDishes('')).toEqual([]);
    expect(suggestCatalogDishes('a', 5).length).toBeLessThanOrEqual(5);
  });
});

describe('pickStarterDishes', () => {
  it('returns up to the requested limit, de-duplicated', () => {
    const picks = pickStarterDishes({ limit: 50 });
    expect(picks.length).toBeLessThanOrEqual(50);
    const names = picks.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('veg preference excludes every non-veg dish', () => {
    const picks = pickStarterDishes({ diet: 'veg', limit: 50 });
    expect(picks.every((p) => p.diet === 'veg')).toBe(true);
  });

  it('restricts to the selected regions', () => {
    const picks = pickStarterDishes({ regions: ['Gujarati'], limit: 50 });
    expect(picks.length).toBeGreaterThan(0);
    expect(picks.every((p) => p.region === 'Gujarati')).toBe(true);
  });

  it('restricts to the selected country', () => {
    const picks = pickStarterDishes({ countries: ['India'], limit: 50 });
    expect(picks.every((p) => p.country === 'India')).toBe(true);
  });

  it('is balanced — not entirely mains when categories are available', () => {
    const picks = pickStarterDishes({ countries: ['India'], limit: 40 });
    const cats = new Set(picks.map((p) => p.category));
    expect(cats.size).toBeGreaterThan(2);
    const mains = picks.filter((p) => p.category === 'main').length;
    expect(mains).toBeLessThan(picks.length); // not 100% mains
  });

  it('is deterministic (same input → same output order)', () => {
    const a = pickStarterDishes({ countries: ['India'], limit: 30 });
    const b = pickStarterDishes({ countries: ['India'], limit: 30 });
    expect(a.map((x) => x.name)).toEqual(b.map((x) => x.name));
  });
});

describe('catalogEntriesToDishes', () => {
  it('shapes entries into zero-history Dish inputs with the given householdId', () => {
    const picks = pickStarterDishes({ countries: ['India'], limit: 6 });
    const dishes = catalogEntriesToDishes(picks, 'h123');
    expect(dishes.length).toBe(picks.length);
    for (const d of dishes) {
      expect(d.householdId).toBe('h123');
      expect(d.timesCooked).toBe(0);
      expect(d.lastCookedDate).toBe('');
      expect(d.isFavorite).toBe(false);
      expect(d.categoryTags.length).toBe(1); // region tag
    }
  });

  it('carries ingredients when present and omits the field otherwise', () => {
    const withIng = catalogEntriesToDishes(
      [{ continent: 'Asia', country: 'India', region: 'Punjabi', name: 'X', cuisineTag: 'Indian', diet: 'veg', category: 'main', ingredients: ['a', 'b'] }],
      'h',
    )[0];
    expect(withIng.ingredients).toEqual(['a', 'b']);
    const noIng = catalogEntriesToDishes(
      [{ continent: 'Asia', country: 'India', region: 'Punjabi', name: 'Y', cuisineTag: 'Indian', diet: 'veg', category: 'main' }],
      'h',
    )[0];
    expect(noIng.ingredients).toBeUndefined();
  });
});

describe('toSeedDish', () => {
  it('shapes a catalog entry into a zero-history seed dish with region tag', () => {
    const entry = STARTER_CATALOG.find((e) => e.name === 'Poha')!;
    const seed = toSeedDish(entry);
    expect(seed.timesCooked).toBe(0);
    expect(seed.lastCookedDate).toBe('');
    expect(seed.isFavorite).toBe(false);
    expect(seed.categoryTags).toContain('Maharashtrian');
    expect(seed.cuisineTag).toBe('Indian');
  });
});
