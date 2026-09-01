# Sofra — Feature Roadmap (dish catalog, grocery, recipe, sharing, delights)

> Guiding rule: **10-second meal logging always WINS.** Everything below is *additive* —
> catalog, grocery, recipe, and sharing must never gate or slow the core log-a-meal flow.
> Scores: **Value** (H/M/L, user + moat impact) · **Effort** (rough dev-days, content extra) · **Reuse** notes.
> No feature below needs a Firestore migration — all new fields are optional/schemaless.

## Scoreboard

| # | Feature | Phase | Value | Effort | Notes |
|---|---|---|---|---|---|
| 1 | Global dish **catalog** + type-to-match enrichment | 1 | H | 1d + content | Autocomplete fills cuisine/region/diet/ingredients; unknown name still logs |
| 2 | Reusable **curated pick-list** (chips/pills, pre-ticked, groups, expander, "add all N") | 1 | H | 1d | ONE component → onboarding + visible "Explore dishes" on Library + pack import. NO hidden screens (LootBoard lesson) |
| 3 | **Onboarding cold-start** (country→region *if country has regions*→veg pref→pick-list→seed) | 1 | H | 0.5d | Fixes empty-library + planner <3-dish degrade; region step skipped for single-region countries |
| 4 | `addDishesBatch` (single writeBatch) | 1 | M | 0.25d | Seeds 50 in one write, not 50 round-trips |
| 5 | **Planner cold-start tweak** (cap never-cooked score) | 1 | M | 0.25d | Real cooked dishes win once history exists (fixes `daysSinceLast=999` flood) |
| 6 | Dish **ingredients** on Dish + dish-detail sheet | 2 | H | 0.75d | `Dish.ingredients?: string[]`; catalog dishes ship pre-filled |
| 7 | **Grocery list** (one household checklist, dedup, checkboxes, reset, manual add) | 2 | H | 1d | `useShoppingStore` cache-first; populate from Plan/dish/manual |
| 8 | **Recipe on dish** (youtube \| url \| text) | 3 | M | 0.75d | `Dish.recipe?`; view/edit in dish-detail sheet |
| 9 | **Dish-pack sharing** household→household (privacy-scoped) | 4 | M | 1.5d | Reuses pick-list for import; growth loop |
| 10 | **"Cook again"** 1-tap re-log | 5 | H | 0.5d | Common case < 10s; retention |
| 11 | **"Decide for me"** instant single suggestion | 5 | H | 0.5d | One tap answers "what's for dinner?" |
| 12 | **Leftovers** 1-tap | 5 | M | 0.25d | Keeps streaks/insights honest, no fake dish |
| 13 | Home-screen **widget** ("Tonight: X") | 5 | M | 1.5d | Native widget; glanceable payoff |

**Explicitly NOT building (friction traps / off-moat):** nutrition/macros, aisle/quantity grocery,
full recipe database + web-import, community/discovery feed, grocery-delivery integrations.

---

## Phase 1 — Starter Catalog + Smart Cold-Start ✅ BUILT (tsc=0, 85 tests) — pending device test
The base everything else reuses. **Status:** catalog **285 dishes / 63 countries**; `StarterDishPicker` component, onboarding seed step, `addDishesBatch`, planner never-cooked cap, and Add-Meal catalog enrichment all built. Not yet device-tested by Sameer.
The base everything else reuses.
- **`src/data/starterCatalog.ts`** — global catalog: `CatalogEntry{continent,country,region,name,cuisineTag(broad),diet,category,ingredients?,weight}`. Broad `cuisineTag` keeps Insights/planner variety intact; `region` is catalog-only metadata. **Now ~170 dishes / 20 countries** (India 11 regions; China, Italy, Mexico, USA regional; + Japan, Korea, Vietnam, Greece, Spain, Pakistan, Sri Lanka, UK, France, Indonesia, Philippines, Ethiopia, Nigeria, Middle East). **Not a cap — grows continuously by pure array append, no code change.** Type-to-match means unknown dishes still log in 10s, so catalog coverage never gates anyone.
- **`src/utils/starterDishes.ts`** (pure, unit-tested) — `matchCatalogDish(name)` (normalized enrichment for autocomplete), `pickStarterDishes({countries,regions,diet,limit})` (weighted, category-balanced, diet-filtered, deduped, capped ~50).
- **Curated pick-list component** — tap-toggle pills, pre-ticked, ~20 shown + "show more", collapsible groups w/ add-all, running counter, DishSuggestInput to add own, "just add these N" button. **Surfaced in visible places only:** onboarding + a permanent "＋ Explore dishes" action on the Dish Library screen (add a cuisine/region any time) + pack import. Never behind a hidden route.
- **Region is conditional:** onboarding shows the region multi-select only when `regionsForCountry(country).length > 1`; single-region countries skip straight to the pick-list.
- **Onboarding step** in `HouseholdSetupScreen` (skippable). **`addDishesBatch`** in firestore. **Planner tweak** in `planner.ts`.
- Seeded dishes: `timesCooked:0`, `lastCookedDate:''`, region in `categoryTags[]`. NO migration.

## Phase 2 — Dish ingredients + Grocery list
- `Dish.ingredients?: string[]`; dish-detail sheet edits them; catalog dishes pre-fill.
- **Grocery = one household checklist**: `households/{id}/grocery/{itemId}={text,checked,source:'dish'|'manual',dishId?,createdAt}`, `useShoppingStore` (cache-first). **Dedup** (case-insensitive + light singular/plural). Pure checkboxes; **Clear checked + Clear all/Reset**. Populate by user choice: Plan "add this week's ingredients", dish "Add to grocery", or **manual add** (works as a normal list, e.g. dishwashing pods). Never auto, never mandatory.

## Phase 3 — Recipe on dish
- `Dish.recipe?: {type:'youtube'|'url'|'text'; value:string}`. Dish-detail sheet: view (open link / play / read text) + add/edit. Additive to the ingredients sheet.

## Phase 4 — Dish-pack sharing (household → household)
- **Shares ONLY (privacy-scoped, requires owner's explicit tap):**
  - **Unique family dishes** — definitions (name, cuisine, region, diet, ingredients, recipe) for `audience=family`.
  - **Unique kids-tiffin dishes** — distinct dish names logged with `audience='kids'` (enriched from catalog).
  - **Unique restaurant NAMES** (+ cuisineType) — **names only. NOT** their dishes, ratings, spend, or visit counts.
- **Never shares:** meals, per-dish ratings, spend/budget, or any history.
- Mechanism: `dishPacks/{6-char-code}` top-level doc (reuses invite-code style). Import via the **same pick-list UI** → user picks what to bring in → seeded (`timesCooked:0`). Growth loop.

## Phase 5 — Sub-10-second delights
- **Cook again** (1-tap re-log recent/favorite) · **Decide for me** (one instant suggestion) · **Leftovers** (1-tap) · **Widget** (tonight's dinner on home screen).

---

## Parallel / not part of this track
- **Android production access** — applied 2026-08-27, awaiting Google (≤7d); release vc4/1.1.0 on grant.
- **vc5 / v1.1.1 tech-debt** — edge-to-edge, orientation, branded store links (scheduled cloud routine, PR-only).
