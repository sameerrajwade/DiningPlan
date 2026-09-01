import { Recipe } from '../types';

// ── Recipe-on-dish (Phase 3) ────────────────────────────────────────────────
// A dish's recipe is whatever the household finds useful: a YouTube link, any
// web URL, or typed steps. This module is the pure classifier + link helpers so
// the UI (and tests) agree on what a pasted string means. Kept dependency-free.

// A YouTube video id inside common URL shapes (watch, youtu.be, shorts, embed,
// live). Ids are 11 chars in practice; allow 6+ to be lenient.
const YT_RE =
  /(?:youtube\.com\/(?:watch\?(?:[^ &]*&)*v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)([\w-]{6,})/i;

/** Extract a YouTube video id from a URL, or null if it isn't a YouTube link. */
export function youtubeId(url: string): string | null {
  const m = (url ?? '').match(YT_RE);
  return m ? m[1] : null;
}

// A single token that reads as a web address: explicit scheme, www., or a
// bare domain like "example.com/x". Deliberately conservative so a sentence of
// typed steps is never mistaken for a link.
function looksLikeUrl(token: string): boolean {
  return (
    /^https?:\/\/\S+$/i.test(token) ||
    /^www\.\S+$/i.test(token) ||
    /^[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(token)
  );
}

function normalizeUrl(token: string): string {
  return /^https?:\/\//i.test(token) ? token : `https://${token}`;
}

/**
 * Turn raw user input into a Recipe (or null when empty). A single URL-like
 * token becomes a youtube/url link (scheme added if missing); anything with
 * spaces, or that doesn't parse as a URL, is stored verbatim as text.
 */
export function parseRecipeInput(raw: string | null | undefined): Recipe | null {
  const value = (raw ?? '').trim();
  if (!value) return null;
  const isSingleToken = !/\s/.test(value);
  if (isSingleToken && looksLikeUrl(value)) {
    const url = normalizeUrl(value);
    return { type: youtubeId(url) ? 'youtube' : 'url', value: url };
  }
  return { type: 'text', value };
}

/** Label for the primary action on a saved recipe (null for plain text). */
export function recipeActionLabel(recipe: Recipe | null | undefined): string | null {
  if (!recipe) return null;
  if (recipe.type === 'youtube') return 'Watch on YouTube';
  if (recipe.type === 'url') return 'Open recipe link';
  return null;
}

/** Icon (MaterialCommunityIcons name) representing a recipe type. */
export function recipeIcon(type: RecipeTypeLike): string {
  if (type === 'youtube') return 'youtube';
  if (type === 'url') return 'link-variant';
  return 'text-box-outline';
}

type RecipeTypeLike = Recipe['type'];
