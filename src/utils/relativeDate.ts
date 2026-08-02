// Human-friendly "when did this last happen" label from a whole-day count.
// 0 → Today, 1 → Yesterday, otherwise a day count. `compact` uses the short
// "3d ago" form for tight UI (dish rows); full uses "3 days ago".
export function formatDaysAgo(days: number, opts?: { compact?: boolean }): string {
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return opts?.compact ? `${days}d ago` : `${days} days ago`;
}
