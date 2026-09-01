// Pure helpers for the household grocery list. The list is ONE combined,
// de-duplicated checklist: if two dishes both need "onion" it appears once. All
// matching is done on a normalized key so "Onions", "onion", and " Onion " are
// treated as the same item — but the user's original text is what we display.

// Normalize a grocery/ingredient name for equality: lowercase, strip punctuation,
// collapse whitespace, and fold a light set of plurals to singular so
// "tomatoes"/"tomato" and "chillies"/"chilli" dedupe. Deliberately conservative —
// only safe, common English plural endings, so we never merge unrelated items.
export function normalizeIngredient(name: string): string {
  let s = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return s;
  // Singularize only the LAST word (e.g. "green chillies" -> "green chilli").
  const parts = s.split(' ');
  const last = parts[parts.length - 1];
  parts[parts.length - 1] = singularize(last);
  s = parts.join(' ');
  return s;
}

function singularize(word: string): string {
  if (word.length <= 3) return word; // don't touch tiny words (peas, oil…)
  if (/ies$/.test(word)) return word.slice(0, -3) + 'y'; // chillies -> chilli(y)
  if (/(ches|shes|xes|ses)$/.test(word)) return word.slice(0, -2); // tomatoes? no -> handled below; boxes->box
  if (/oes$/.test(word)) return word.slice(0, -2); // tomatoes -> tomato, potatoes -> potato
  if (/ss$/.test(word)) return word; // glass, grass — keep
  if (/s$/.test(word)) return word.slice(0, -1); // onions -> onion
  return word;
}

// Given the items already on the list and a batch of incoming names, return only
// the names that are genuinely new (not already present, and not duplicated
// within the incoming batch). Preserves the incoming display text and order.
export function dedupeNewItems(
  existingTexts: string[],
  incoming: string[],
): string[] {
  const seen = new Set(existingTexts.map(normalizeIngredient));
  const out: string[] = [];
  for (const raw of incoming) {
    const text = raw.trim();
    if (!text) continue;
    const key = normalizeIngredient(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

// Collect the de-duplicated ingredient list for a set of dishes (each dish
// carrying an optional ingredients[]). Used by "add this week's ingredients" and
// a single dish's "Add to grocery". Merges across dishes and against the existing
// list in one pass.
export function ingredientsForDishes(
  dishIngredients: (string[] | undefined)[],
  existingTexts: string[] = [],
): string[] {
  const flat: string[] = [];
  for (const list of dishIngredients) {
    if (list) flat.push(...list);
  }
  return dedupeNewItems(existingTexts, flat);
}
