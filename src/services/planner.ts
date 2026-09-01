import { addDays, differenceInDays, format, getDay, parseISO } from 'date-fns';
import { Dish, Meal, MealPlan, UserPreferences } from '../types';

// A never-cooked dish is scored as if it were this many days "stale" — enough to
// be introduced into rotation, but not so high it permanently buries dishes the
// household actually cooks. MAX_STALENESS_SCORE is a safety ceiling.
const NEW_DISH_NOVELTY = 21;
const MAX_STALENESS_SCORE = 45;

export function generateMealPlan(
  dishes: Dish[],
  recentMeals: Meal[],
  preferences: UserPreferences,
  startDate: string,
  days: number,
  rng: () => number = Math.random,
): MealPlan[] {
  const start = parseISO(startDate);
  const today = new Date();

  // Kids-tiffin dish pool: prefer dishes previously packed as kids tiffins,
  // else fall back to favorites / simplest home dishes.
  const includeKids = !!preferences.planKidsTiffin;
  // Kids tiffins are planned ONLY from dishes previously logged as kids tiffins —
  // never the household's general dishes. If there's no kids history yet, the
  // kids slots stay empty (the user fills them, which seeds future plans).
  const kidPool = Array.from(
    new Set(recentMeals.filter((m) => m.audience === 'kids' && m.dishName).map((m) => m.dishName)),
  );
  let kidCursor = 0;
  const nextKidDish = (avoid: string): string => {
    if (kidPool.length === 0) return '';
    for (let k = 0; k < kidPool.length; k++) {
      const cand = kidPool[(kidCursor + k) % kidPool.length];
      if (cand !== avoid) {
        kidCursor = (kidCursor + k + 1) % kidPool.length;
        return cand;
      }
    }
    return kidPool[kidCursor % kidPool.length];
  };
  let lastKidDish = '';

  // Step 1: Filter out dishes made within avoidRepeatDays
  const recentDishNames = new Set(
    recentMeals
      .filter(
        (m) =>
          differenceInDays(today, parseISO(m.date)) < preferences.avoidRepeatDays,
      )
      .map((m) => m.dishName),
  );

  const eligible = dishes.filter((d) => !recentDishNames.has(d.name));
  const fallback = eligible.length > 0 ? eligible : dishes;

  // Step 2: Score remaining dishes
  const scored = fallback.map((dish) => {
    const cooked = !!dish.lastCookedDate;
    const daysSinceLast = cooked
      ? differenceInDays(today, parseISO(dish.lastCookedDate))
      : 999;
    const favoriteBonus = dish.isFavorite ? 20 : 0;
    // Never-cooked dishes get a BOUNDED novelty score (not 999). Otherwise every
    // untried dish would permanently outrank everything you actually cook — after
    // seeding ~50 starter dishes the planner would flood the long tail of dishes
    // you've never made and never surface your real rotation. Capping novelty at
    // ~3 weeks means new dishes are still attractive enough to get introduced, but
    // a dish you genuinely haven't cooked in a while wins once history exists.
    const stalenessScore = cooked
      ? daysSinceLast
      : Math.min(NEW_DISH_NOVELTY, MAX_STALENESS_SCORE);
    const score = stalenessScore + favoriteBonus;
    return { dish, score, daysSinceLast };
  });

  scored.sort((a, b) => b.score - a.score);

  // Step 3: Select dishes ensuring cuisine variety
  const plan: MealPlan[] = [];
  const usedDishes: string[] = [];
  const usedCuisinesInRow: string[] = [];
  let dineOutCount = 0;

  for (let i = 0; i < days; i++) {
    const currentDate = addDays(start, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayOfWeek = getDay(currentDate); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Only assign dine-out on weekends and within the user's maxDineOutsPerWeek limit
    const dineOutDinner = isWeekend && dineOutCount < preferences.maxDineOutsPerWeek && rng() < 0.6;
    if (dineOutDinner) dineOutCount++;

    // Pick lunch dish
    const lunchDish = pickDish(scored, usedDishes, usedCuisinesInRow, rng);
    usedDishes.push(lunchDish.dish.name);
    usedCuisinesInRow.push(lunchDish.dish.cuisineTag);
    if (usedCuisinesInRow.length > 3) usedCuisinesInRow.shift();

    // Pick dinner dish or dine-out
    let dinnerEntry: MealPlan['dinner'];
    if (dineOutDinner) {
      dinnerEntry = {
        dishName: 'Dine Out',
        sourceType: 'dineout',
        lastMadeDaysAgo: 0,
        isNew: false,
      };
    } else {
      const dinnerDish = pickDish(scored, usedDishes, usedCuisinesInRow, rng);
      usedDishes.push(dinnerDish.dish.name);
      usedCuisinesInRow.push(dinnerDish.dish.cuisineTag);
      if (usedCuisinesInRow.length > 3) usedCuisinesInRow.shift();

      dinnerEntry = {
        dishName: dinnerDish.dish.name,
        sourceType: 'home',
        lastMadeDaysAgo: dinnerDish.daysSinceLast,
        isNew: dinnerDish.dish.timesCooked === 0,
      };
    }

    // Kids tiffins are school-day meals — never auto-plan them on weekends.
    // Sat/Sun kids tiffins can still be added explicitly by the user.
    let kidsEntry: MealPlan['kids'];
    if (includeKids && !isWeekend) {
      const kidName = nextKidDish(lastKidDish);
      lastKidDish = kidName;
      kidsEntry = { dishName: kidName, sourceType: 'home', lastMadeDaysAgo: 0, isNew: false };
    }

    plan.push({
      date: dateStr,
      lunch: {
        dishName: lunchDish.dish.name,
        sourceType: 'home',
        lastMadeDaysAgo: lunchDish.daysSinceLast,
        isNew: lunchDish.dish.timesCooked === 0,
      },
      dinner: dinnerEntry,
      ...(kidsEntry ? { kids: kidsEntry } : {}),
    });
  }

  return plan;
}

interface ScoredDish {
  dish: Dish;
  score: number;
  daysSinceLast: number;
}

function pickDish(
  scored: ScoredDish[],
  usedDishes: string[],
  recentCuisines: string[],
  rng: () => number = Math.random,
): ScoredDish {
  // Prefer dishes not yet used this plan; fall back to the full set only if the
  // library is smaller than the plan (so every slot still fills).
  const available = scored.filter((s) => !usedDishes.includes(s.dish.name));
  const pool = available.length > 0 ? available : scored;

  // WEIGHTED RANDOM over the WHOLE pool (not just the top 3). The old code sorted
  // by score and picked among the top 3 — with a seeded library where most dishes
  // tie (never-cooked all score the same), the stable sort produced the SAME top 3
  // every regenerate, so hitting "regenerate" just reshuffled the same handful.
  // Weighting by score keeps stale/favorite dishes more likely while giving all
  // 100+ dishes a real chance, so the plan genuinely varies each time.
  const weighted = pool.map((s) => {
    const cuisinePenalty =
      recentCuisines.filter((c) => c === s.dish.cuisineTag).length * 8;
    // Floor at 1 so even a heavily-penalized dish can still be drawn.
    return { s, w: Math.max(1, s.score - cuisinePenalty) };
  });

  const total = weighted.reduce((sum, x) => sum + x.w, 0);
  let r = rng() * total;
  for (const x of weighted) {
    r -= x.w;
    if (r <= 0) return x.s;
  }
  return weighted[weighted.length - 1].s;
}
