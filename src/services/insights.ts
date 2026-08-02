import { Meal, InsightData } from '../types';

export function computeInsights(
  meals: Meal[],
  previousPeriodMeals: Meal[],
): InsightData {
  const total = meals.length;
  const prevTotal = previousPeriodMeals.length;

  // Home cooked %
  const homeCooked = meals.filter((m) => m.sourceType === 'home').length;
  const homeCookedPercent = total > 0 ? Math.round((homeCooked / total) * 100) : 0;
  const prevHomeCooked = previousPeriodMeals.filter((m) => m.sourceType === 'home').length;
  const prevHomeCookedPercent =
    prevTotal > 0 ? Math.round((prevHomeCooked / prevTotal) * 100) : 0;
  // Only report a trend when there IS a previous period to compare against —
  // otherwise a first-month user falsely sees "Last period was 0% home".
  const homeCookedTrend = prevTotal > 0 ? homeCookedPercent - prevHomeCookedPercent : 0;

  // Dine out count
  const dineOutCount = meals.filter((m) => m.sourceType === 'dineout').length;
  const dineOutCountLastMonth = previousPeriodMeals.filter(
    (m) => m.sourceType === 'dineout',
  ).length;

  // Unique dishes
  const uniqueDishes = new Set(meals.map((m) => m.dishName)).size;

  // Outside spending (dineout + takeout)
  const outsideMeals = meals.filter((m) => m.sourceType !== 'home');
  const outsideSpending = outsideMeals.reduce((sum, m) => sum + (m.cost || 0), 0);
  const prevOutsideMeals = previousPeriodMeals.filter((m) => m.sourceType !== 'home');
  const prevOutsideSpending = prevOutsideMeals.reduce(
    (sum, m) => sum + (m.cost || 0),
    0,
  );
  const outsideSpendingTrend =
    prevOutsideSpending > 0
      ? Math.round(
          ((outsideSpending - prevOutsideSpending) / prevOutsideSpending) * 100,
        )
      : 0;

  // Top restaurants
  const restMap = new Map<string, { visits: number; spend: number }>();
  for (const m of meals) {
    if (m.restaurantName) {
      const entry = restMap.get(m.restaurantName) || { visits: 0, spend: 0 };
      entry.visits++;
      entry.spend += m.cost || 0;
      restMap.set(m.restaurantName, entry);
    }
  }
  const topRestaurants = Array.from(restMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  // Cuisine breakdown
  const cuisineMap = new Map<string, number>();
  for (const m of meals) {
    const tag = m.cuisineTag || 'Other';
    cuisineMap.set(tag, (cuisineMap.get(tag) || 0) + 1);
  }
  const cuisineBreakdown = Array.from(cuisineMap.entries())
    .map(([cuisine, count]) => ({
      cuisine,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.percent - a.percent);

  // Most cooked dishes (home only). Count EVERY dish in the meal, not just the
  // primary — a thali's sides (Poli, Rice, Dal) live in `items` and were being
  // ignored, so frequent breads/sides never surfaced here.
  const dishMap = new Map<string, number>();
  for (const m of meals.filter((m) => m.sourceType === 'home')) {
    const names = m.items && m.items.length ? m.items.map((it) => it.name) : [m.dishName];
    for (const name of names) {
      if (!name) continue;
      dishMap.set(name, (dishMap.get(name) || 0) + 1);
    }
  }
  const mostCookedDishes = Array.from(dishMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Monthly spending
  const monthMap = new Map<string, number>();
  for (const m of [...meals, ...previousPeriodMeals]) {
    if (m.sourceType !== 'home' && m.cost) {
      // Bucket by the local date string directly — `new Date('yyyy-MM-dd')` is
      // UTC midnight and buckets into the wrong month in negative-offset zones.
      const monthKey = m.date.slice(0, 7);
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + m.cost);
    }
  }
  const monthlySpending = Array.from(monthMap.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    homeCookedPercent,
    homeCookedTrend,
    dineOutCount,
    dineOutCountLastMonth,
    uniqueDishes,
    outsideSpending,
    outsideSpendingTrend,
    topRestaurants,
    cuisineBreakdown,
    mostCookedDishes,
    monthlySpending,
  };
}
