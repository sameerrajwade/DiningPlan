import { parseRecipeInput, youtubeId, recipeActionLabel, recipeIcon } from '../recipe';

describe('parseRecipeInput', () => {
  it('returns null for empty / whitespace', () => {
    expect(parseRecipeInput('')).toBeNull();
    expect(parseRecipeInput('   ')).toBeNull();
    expect(parseRecipeInput(null)).toBeNull();
    expect(parseRecipeInput(undefined)).toBeNull();
  });

  it('classifies YouTube links (watch, youtu.be, shorts)', () => {
    expect(parseRecipeInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
      type: 'youtube',
      value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
    expect(parseRecipeInput('https://youtu.be/dQw4w9WgXcQ')?.type).toBe('youtube');
    expect(parseRecipeInput('https://youtube.com/shorts/abc123XY')?.type).toBe('youtube');
  });

  it('classifies generic URLs and adds a scheme when missing', () => {
    expect(parseRecipeInput('https://cooking.nyt.com/recipes/123')).toEqual({
      type: 'url',
      value: 'https://cooking.nyt.com/recipes/123',
    });
    expect(parseRecipeInput('example.com/dal-recipe')).toEqual({
      type: 'url',
      value: 'https://example.com/dal-recipe',
    });
    expect(parseRecipeInput('www.allrecipes.com/x')).toEqual({
      type: 'url',
      value: 'https://www.allrecipes.com/x',
    });
  });

  it('treats multi-word input as text even if it contains a link', () => {
    const r = parseRecipeInput('Boil dal 20 min, see https://x.com/y for tadka');
    expect(r?.type).toBe('text');
    expect(r?.value).toContain('Boil dal');
  });

  it('treats a single non-URL word as text', () => {
    expect(parseRecipeInput('mom')).toEqual({ type: 'text', value: 'mom' });
  });

  it('preserves multi-line typed steps verbatim (trimmed)', () => {
    const steps = '1. Soak rice\n2. Fry onions\n3. Layer and dum';
    expect(parseRecipeInput('  ' + steps + '  ')).toEqual({ type: 'text', value: steps });
  });
});

describe('youtubeId', () => {
  it('extracts ids from several shapes', () => {
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5s')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://cooking.nyt.com/x')).toBeNull();
  });
});

describe('recipeActionLabel / recipeIcon', () => {
  it('labels external links, not text', () => {
    expect(recipeActionLabel({ type: 'youtube', value: 'x' })).toBe('Watch on YouTube');
    expect(recipeActionLabel({ type: 'url', value: 'x' })).toBe('Open recipe link');
    expect(recipeActionLabel({ type: 'text', value: 'x' })).toBeNull();
    expect(recipeActionLabel(null)).toBeNull();
  });
  it('maps types to icons', () => {
    expect(recipeIcon('youtube')).toBe('youtube');
    expect(recipeIcon('url')).toBe('link-variant');
    expect(recipeIcon('text')).toBe('text-box-outline');
  });
});
