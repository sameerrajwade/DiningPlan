import { format, startOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export type TimeRange = '7d' | '30d' | 'lastMonth' | '90d' | 'all';

export interface DateRange {
  start: string;
  end: string;
  prevStart: string;
  prevEnd: string;
}

// Each range is a closed [start, end] window plus the equivalent prior window
// (for trend comparison). "lastMonth" is a fully closed past month; "all" spans
// all history with no prior window (trend suppressed).
//
// `now` is injectable so the window is computed against the CURRENT date — this
// is what makes "this month" follow a day/month rollover (and lets tests pin a
// date). Passing it also documents that the result is date-dependent.
export function getRange(range: TimeRange, now: Date = new Date()): DateRange {
  const today = format(now, 'yyyy-MM-dd');
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
  const dayBefore = (d: Date) => fmt(new Date(d.getTime() - 86400000));
  switch (range) {
    case '7d': {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const prevStart = new Date(start.getTime() - 7 * 86400000);
      return { start: fmt(start), end: today, prevStart: fmt(prevStart), prevEnd: dayBefore(start) };
    }
    case '30d': {
      const start = startOfMonth(now);
      return { start: fmt(start), end: today, prevStart: fmt(startOfMonth(subMonths(now, 1))), prevEnd: dayBefore(start) };
    }
    case 'lastMonth': {
      const lm = subMonths(now, 1);
      return {
        start: fmt(startOfMonth(lm)),
        end: fmt(endOfMonth(lm)),
        prevStart: fmt(startOfMonth(subMonths(now, 2))),
        prevEnd: fmt(endOfMonth(subMonths(now, 2))),
      };
    }
    case '90d': {
      const start = subMonths(now, 3);
      return { start: fmt(start), end: today, prevStart: fmt(subMonths(now, 6)), prevEnd: dayBefore(start) };
    }
    case 'all': {
      // No prior window for all-time; use an empty past range so trend = 0.
      return { start: '1970-01-01', end: today, prevStart: '1970-01-01', prevEnd: '1970-01-01' };
    }
  }
}
