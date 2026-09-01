export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type SourceType = 'home' | 'takeout' | 'dineout';
export type CuisineTag =
  | 'Indian'
  | 'Chinese'
  | 'Italian'
  | 'Mexican'
  | 'American'
  | 'Thai'
  | 'Japanese'
  | string;

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  householdId: string | null;
  createdAt: Date;
}

export interface Household {
  id: string;
  name: string;
  memberIds: string[];
  adminId: string;
  inviteCode: string;
  createdAt: Date;
}

// One dish within a meal, with an optional 1–5 star rating (used mainly for
// dine-out / takeout where multiple dishes are ordered).
export interface MealItem {
  name: string;
  rating?: number;
}

// Who the meal is for. 'kids' powers the Lean kids-tiffin track; absent = family.
export type MealAudience = 'family' | 'kids';

// Vegetarian / non-vegetarian mark for a meal. Auto-inferred from the dish
// names at save time, user-overridable. Absent on meals logged before this
// feature — read via mealDiet() which falls back to inference.
export type Diet = 'veg' | 'nonveg';

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  sourceType: SourceType;
  dishName: string; // primary/summary dish (items[0] when multiple)
  items?: MealItem[]; // multiple dishes ordered, each with an optional rating
  audience?: MealAudience; // 'kids' = kids tiffin track; undefined = family
  diet?: Diet; // 'veg' | 'nonveg'; auto-set from dish names, user-overridable
  cuisineTag: CuisineTag;
  restaurantName?: string;
  cost?: number;
  notes?: string;
  createdBy: string;
  householdId: string;
  createdAt: Date;
  updatedAt: Date;
}

// How a dish's recipe is stored: a YouTube link, any web URL, or free text the
// household typed ("how I make it"). Kept on the DISH so logging stays 10s.
export type RecipeType = 'youtube' | 'url' | 'text';
export interface Recipe {
  type: RecipeType;
  value: string; // normalized URL for youtube/url; raw text for 'text'
}

export interface Dish {
  id: string;
  name: string;
  cuisineTag: CuisineTag;
  categoryTags: string[];
  isFavorite: boolean;
  timesCooked: number;
  lastCookedDate: string;
  householdId: string;
  // Optional shopping staples for this dish (schemaless, no migration). Seeded
  // from the starter catalog and used by the grocery list (Phase 2).
  ingredients?: string[];
  // Optional recipe (Phase 3): a link or typed steps, editable in the dish
  // detail sheet. Schemaless/optional — no migration.
  recipe?: Recipe;
}

// ── Dish-pack sharing (Phase 4) ─────────────────────────────────────────────
// A household can share a "pack" of its dish DEFINITIONS with another household
// via a short code. Privacy-scoped: only names/cuisine/diet/ingredients/recipe
// for dishes, distinct kids-tiffin dish names, and restaurant NAMES — NEVER
// meals, ratings, spend, budget, or any history.
export interface DishPackDish {
  name: string;
  cuisineTag: CuisineTag;
  categoryTags?: string[];
  ingredients?: string[];
  recipe?: Recipe;
}
export interface DishPackRestaurant {
  name: string;
  cuisineType: string;
}
export interface DishPack {
  code: string; // 6-char share code (doc id)
  createdBy: string; // uid of the sharer
  householdName: string; // for display on import ("from the Rajwade Family")
  dishes: DishPackDish[]; // family dishes
  kidsDishes: DishPackDish[]; // distinct kids-tiffin dishes
  restaurants: DishPackRestaurant[]; // names + cuisine only
  createdAt: Date;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisineType: string;
  totalVisits: number;
  totalSpend: number;
  lastVisitDate: string;
  householdId: string;
  // Per-dish star ratings (1–5) the household assigns for this restaurant.
  dishRatings?: Record<string, number>;
}

// One line on the household's single shared grocery/shopping checklist. Items
// come from dish ingredients ("Add to grocery") or are typed manually (e.g.
// dishwashing pods). One combined, de-duplicated list — never per-dish.
export interface GroceryItem {
  id: string;
  text: string;
  checked: boolean;
  source: 'dish' | 'manual';
  dishId?: string; // when source==='dish', the dish it came from (best-effort)
  createdAt: Date;
  householdId: string;
}

export interface MealPlanSlot {
  dishName: string;
  sourceType: SourceType;
  lastMadeDaysAgo: number;
  isNew: boolean;
  restaurantName?: string; // set for saved outside (dine-out/takeout) slots
}

export interface MealPlan {
  date: string;
  lunch: MealPlanSlot;
  dinner: MealPlanSlot;
  kids?: MealPlanSlot; // Lean kids-tiffin track (only when planKidsTiffin is on)
}

export interface UserPreferences {
  defaultMeals: MealType[];
  monthlyDineOutBudget: number;
  dishRotationDays: number;
  currency: string;
  maxDineOutsPerWeek: number;
  avoidRepeatDays: number;
  includeNewDishes: boolean;
  planKidsTiffin?: boolean; // include a kids tiffin track when generating plans
}

export interface InsightData {
  homeCookedPercent: number;
  homeCookedTrend: number;
  dineOutCount: number;
  dineOutCountLastMonth: number;
  uniqueDishes: number;
  outsideSpending: number;
  outsideSpendingTrend: number;
  topRestaurants: { name: string; visits: number; spend: number }[];
  cuisineBreakdown: { cuisine: string; percent: number }[];
  mostCookedDishes: { name: string; count: number }[];
  monthlySpending: { month: string; amount: number }[];
}
