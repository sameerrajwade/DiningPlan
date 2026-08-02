import { formatDaysAgo } from '../relativeDate';

describe('formatDaysAgo', () => {
  it('labels today and yesterday by name', () => {
    expect(formatDaysAgo(0)).toBe('Today');
    expect(formatDaysAgo(1)).toBe('Yesterday');
  });

  it('uses a day count from two days back', () => {
    expect(formatDaysAgo(2)).toBe('2 days ago');
    expect(formatDaysAgo(41)).toBe('41 days ago');
  });

  it('supports a compact form', () => {
    expect(formatDaysAgo(0, { compact: true })).toBe('Today');
    expect(formatDaysAgo(1, { compact: true })).toBe('Yesterday');
    expect(formatDaysAgo(5, { compact: true })).toBe('5d ago');
  });

  it('treats negative (clock skew) as Today', () => {
    expect(formatDaysAgo(-1)).toBe('Today');
  });
});
