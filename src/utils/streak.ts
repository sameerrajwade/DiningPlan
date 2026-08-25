import { format, subDays } from 'date-fns';

/**
 * Consecutive-day logging streak — the core habit signal on Home.
 *
 * A day counts toward the streak if it has at least one logged meal. The streak
 * stays "alive" through the current day until it ends: if today has no log yet
 * but yesterday did, the streak equals yesterday's run (not broken) and
 * `loggedToday` is false so the UI can nudge before midnight. Missing a full
 * prior day breaks the streak.
 *
 * @param loggedDates any yyyy-MM-dd dates that have a meal (dupes/ordering ok)
 * @param today       today's date as yyyy-MM-dd (injected so it's testable)
 */
export function computeLoggingStreak(
  loggedDates: Iterable<string>,
  today: string,
): { streak: number; loggedToday: boolean } {
  const set = loggedDates instanceof Set ? loggedDates : new Set(loggedDates);
  const loggedToday = set.has(today);

  // Anchor at today if logged, otherwise yesterday (a grace day — you still have
  // until midnight to log without losing the streak).
  const todayDate = new Date(today + 'T00:00:00');
  let cursor = loggedToday ? todayDate : subDays(todayDate, 1);

  let streak = 0;
  while (set.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return { streak, loggedToday };
}
