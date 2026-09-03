import { STARTER_CATALOG } from '../starterCatalog';

// Guards the Indian-first catalog strategy (locked with Sameer): the core Indian
// regions must stay DEEP so a family searching their own cuisine always finds
// their everyday repertoire — never the "7 Maharashtrian dishes" regression.
// If a future edit thins a region below its floor, this fails loudly.

const FLOOR = 80;
const PRIORITY_REGIONS = ['Maharashtrian', 'Gujarati', 'Punjabi', 'South Indian', 'Bengali'];

const countRegion = (region: string) =>
  STARTER_CATALOG.filter((e) => e.cuisineTag === 'Indian' && e.region === region).length;

describe('catalog coverage — Indian-first depth floor', () => {
  it.each(PRIORITY_REGIONS)('has at least %d dishes for region "%s"', (region) => {
    expect(countRegion(region as string)).toBeGreaterThanOrEqual(FLOOR);
  });

  it('keeps a healthy overall Indian catalog', () => {
    const indian = STARTER_CATALOG.filter((e) => e.cuisineTag === 'Indian').length;
    expect(indian).toBeGreaterThanOrEqual(600);
  });
});

describe('catalog hygiene', () => {
  it('has no duplicate dish names across the whole catalog', () => {
    const seen = new Map<string, number>();
    for (const e of STARTER_CATALOG) {
      const key = e.name.trim().toLowerCase();
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    const dupes = Array.from(seen.entries()).filter(([, n]) => n > 1).map(([name]) => name);
    expect(dupes).toEqual([]);
  });

  it('every entry has the required fields and a valid diet/category', () => {
    const cats = new Set(['main', 'side', 'bread', 'rice', 'breakfast', 'snack', 'sweet']);
    for (const e of STARTER_CATALOG) {
      expect(e.name && e.region && e.country && e.continent).toBeTruthy();
      expect(e.diet === 'veg' || e.diet === 'nonveg').toBe(true);
      expect(cats.has(e.category)).toBe(true);
    }
  });
});
