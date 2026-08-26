import type { Meal } from '../types';

export type Diet = 'veg' | 'nonveg';

// Non-veg detection from a dish name. This is a *smart default* — it saves the
// user a tap, not a source of truth — so it errs toward precision: only names
// containing an unambiguous meat/fish/egg word are flagged. Regional names with
// no keyword (Rogan Josh, Nihari's cousins) and ambiguous ones (biryani, kebab,
// tikka — often veg in veg households) stay veg until the user flips the mark.
//
// Covers English AND the Hindi/Urdu meat words this app's families actually type
// (murgh, gosht, keema, macchi, jhinga, anda…). Matching is word-boundary based
// so "egg" flags "Egg Curry" but NOT "eggplant"/"eggless", and "ham" won't trip
// on "graham".
const NONVEG_TOKENS = [
  // English meats
  'chicken', 'mutton', 'lamb', 'goat', 'beef', 'veal', 'pork', 'bacon', 'ham',
  'sausages?', 'steaks?', 'salami', 'pepperoni', 'turkey', 'duck', 'venison',
  'meat', 'meatballs?', 'mince',
  // Seafood
  'fish', 'prawns?', 'shrimps?', 'crabs?', 'lobster', 'squid', 'oysters?',
  'seafood', 'tuna', 'salmon', 'pomfret', 'surmai',
  // Egg
  'eggs?', 'omelette?s?', 'omelet',
  // Hindi / Urdu meat & fish words
  'murghi?', 'murg', 'gh?osht', 'keema', 'kheema', 'qeema', 'macchi', 'machhi',
  'machli', 'macchli', 'jhinga', 'jheenga', 'anda', 'ande', 'tangdi', 'tangri',
  'seekh', 'nihari', 'haleem', 'kheema',
] as const;

const NONVEG_RE = new RegExp(`\\b(?:${NONVEG_TOKENS.join('|')})\\b`, 'i');

/** True when a single dish name reads as non-veg (unambiguously). */
export function isNonVegName(name: string | undefined | null): boolean {
  if (!name) return false;
  return NONVEG_RE.test(name);
}

/** Infer a meal's diet from a set of dish names: non-veg if ANY name is. */
export function inferDietFromNames(names: (string | undefined | null)[]): Diet {
  return names.some((n) => isNonVegName(n)) ? 'nonveg' : 'veg';
}

/**
 * A meal's diet mark. Honors an explicit stored `diet`; otherwise infers from
 * the dish name + any items, so meals logged before this feature still show a
 * sensible mark (and count in insights).
 */
export function mealDiet(meal: Pick<Meal, 'diet' | 'dishName' | 'items'>): Diet {
  if (meal.diet === 'veg' || meal.diet === 'nonveg') return meal.diet;
  const names = [meal.dishName, ...((meal.items ?? []).map((i) => i.name))];
  return inferDietFromNames(names);
}
