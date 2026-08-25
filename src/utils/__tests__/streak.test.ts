import { computeLoggingStreak } from '../streak';

describe('computeLoggingStreak', () => {
  const today = '2026-08-24';

  it('counts consecutive days ending today', () => {
    const dates = ['2026-08-22', '2026-08-23', '2026-08-24'];
    expect(computeLoggingStreak(dates, today)).toEqual({ streak: 3, loggedToday: true });
  });

  it('keeps the streak alive on a grace day (today not yet logged)', () => {
    // Logged through yesterday but not today — streak intact, nudge-able.
    const dates = ['2026-08-22', '2026-08-23'];
    expect(computeLoggingStreak(dates, today)).toEqual({ streak: 2, loggedToday: false });
  });

  it('breaks when a full prior day is missed', () => {
    // Gap on 2026-08-23 → only today counts.
    const dates = ['2026-08-21', '2026-08-24'];
    expect(computeLoggingStreak(dates, today)).toEqual({ streak: 1, loggedToday: true });
  });

  it('is zero with no logs and nothing today', () => {
    expect(computeLoggingStreak([], today)).toEqual({ streak: 0, loggedToday: false });
  });

  it('is zero when the last log was two+ days ago', () => {
    const dates = ['2026-08-21', '2026-08-22'];
    expect(computeLoggingStreak(dates, today)).toEqual({ streak: 0, loggedToday: false });
  });

  it('ignores duplicate dates', () => {
    const dates = ['2026-08-24', '2026-08-24', '2026-08-23'];
    expect(computeLoggingStreak(dates, today)).toEqual({ streak: 2, loggedToday: true });
  });
});
