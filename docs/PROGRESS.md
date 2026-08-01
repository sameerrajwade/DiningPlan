# Sofra — Progress

## Current State
Family meal-planning app (React Native / Expo + Firebase, TypeScript), rebranded ThaliPlan → Sofra. Pre-launch overhaul near-done: Terracotta & Sage theme (light/dark/auto), Fraunces/Inter, motion, all screens dark-aware. MVP1 includes multi-dish + per-dish ratings, kids-tiffin planning, local notifications (daily/weekly/monthly), Insights charts. 14 Jest tests pass (`npm test`), tsc=0. Active branch `ux-improvements-jul9` → PR #2 (open, unmerged).

## Constraints
- Repo: github.com/sameerrajwade/Sofra. Package id `com.thaliplan.app` must NOT change (Firebase-linked).
- Never handle signing/keystore passwords — Sameer signs. Release APK is debug-signed (template config).
- Motion = built-in RN Animated only (no Reanimated). Paywall/monetization DEFERRED.
- Develop → test → show results → only then build/deliver.

## Open PRs
- **PR #2 (MERGED)** — 14 UX/device-test fixes.
- **PR #3 (MERGED)** — GitHub Pages site: 9-screen gallery + 7-screen guide + status-bar-cropped screenshots.
- **PR #4 (MERGED)** — Firestore read reduction + two meal bug fixes + README.
- **PR #5 (OPEN, 2026-08-01)** — branch `insights-dish-window-fixes` → main. This session's work: "Outside Meals" card, tappable/windowed Most Cooked, meal-derived forgotten dishes, restaurant-name titles, windowed Dish Library counts + param-bleed fix, date-rollover recompute, pure dishStats/insightsRange utils + tests (32 total). README + docs/guide.html updated. Screenshots (home.png/insights.png) NOT yet regenerated — see Next Up.

## Last Session (2026-07-31) — 6 real-use fixes + Firebase data verification (branch reads-cache-first, tsc=0, 22 tests)
Sameer's usage surfaced 6 issues. Fixes:
1. **"Ate Out" card** (was "Dine Outs") = dineout+takeout this month, subtitle "X dine · Y takeout". VERIFIED via Firebase console (household WpoNv4NLFa5ozdAimyNp/meals): July has **10 dineout + 3 takeout = 13**. Old card showed 10 (dineout only, correct but excluded takeout); Restaurants tab showed 13. **No data-loss/dedupe bug** — the 10 was genuinely July's dineout count (all-time dineout=19: 10 Jul, 8 Jun, 1 May). Ate Out now shows 13, matching Restaurants.
2. Takeout **restaurant name STAYS mandatory** — reverted an initial wrong change. Sameer's "description was mandatory" complaint = his OLD installed APK (current code already makes dishes/notes optional; only restaurant name required). Confirm resolved after rebuild.
3. MealCard for outside meals shows **restaurant name as title**, ordered dishes below.
4. Insights "Most Cooked" → ranked **tappable list** (top 5 + "Show all"), each row opens the dish in Dish Library (cross-tab nav Home→DishLibrary).
5. Home "haven't made in a while" now **derived from actual meals** (was stale stored `lastCookedDate`), 30+ day, top 5, "See all" → Dish Library stale filter (new `initialFilter` param).
6. Most-cooked **counts thali sides** (`items`); Dish Library counts sides too so tap-through counts match. insights.test.ts (3 tests) locks it.
7. **Dish Library default sort**: browse views ("this month"/"all") now default to **Most made** (staples on top); the stale deep-link keeps **Last made** (rotation). Set via sortMode initial + initialFilter effect in DishLibraryScreen.
8. **Windowed dish counts**: Dish Library `timesCooked` was ALWAYS all-time — opening "Dishes this month" or tapping a dish from an Insights pill showed the all-time count (Khichdi = 6 vs real July 3). Added optional `window:{start,end,label}` route param; counts only meals in-window, hides 0× dishes, "Counts for <label>" caption. Wired: Home Unique Dishes + Kids Tiffins (this month), Insights openDish (current range; 'all'=all-time). Insights "Most Cooked" was already windowed.
9. **FOLLOW-UP BUG (window bleed)**: Dish Library is revisited without remounting; RN shallow-merges params + local filter state persisted, so the this-month window leaked into the "30+ days" stale view (→ 1 dish instead of dozens of June-only dishes) and state went inconsistent. Fix: reset quickFilter/sortMode from current params on FOCUS (useFocusEffect); every navigate passes fully-explicit params (window/monthDishes/initialFilter incl undefined) so merge can't bleed; "All" chip clears window too. VERIFIED expected sets against live Firestore (100 home meals; many June-only dishes = stale).
10. **Refactor+tests**: extracted dish aggregation → pure `src/utils/dishStats.ts`; new dishStats.test.ts (6 tests) locks window vs all-time, sides, future-exclusion, and the stale-window-bleed regression. Total 28 tests, tsc=0.
11. **DATE-ROLLOVER STALENESS (Insights showed stale month)**: Insights "This month" kept showing July's Khichadi=6 on Aug 1. Cause: compute effect deps were [meals,timeRange] but getRange() reads new Date() (not a dep), and fetchMeals is cache-first (no meals change on focus) → never recomputed after the month rolled over. Fix: `recompute()` runs on FOCUS + a focus-refreshed `today` state threaded into recompute + homePercent + kidsStats memos. Same freeze fixed on HomeScreen (thisMonthStart was useMemo([]) → now keyed on focus-updated `today`). Verified via Firestore: Khichadi all-time=6 (July 3: 07-20/26/30 + June 3), stored dishes/Khichadi timesCooked=6 — that was the stale value.
12. **getRange extracted + tested**: moved Insights `getRange` → pure `src/utils/insightsRange.ts` with injectable `now`. New insightsRange.test.ts (4 tests) pins this-month/last-month windows AND the exact rollover regression (Jul31→Khichadi×3, Aug1→absent). 32 tests total, tsc=0.
13. **Card rename**: Home "Ate Out" → **"Outside Meals"** (pairs with "Outside Spend"); same dineout+takeout count + "X dine · Y takeout" subtitle.
14. **"Khichadi=6" is CORRECT, not a bug** — verified live on device (adb screencap) + Firestore. All 6 Khichadi meals are July (07-02/16/20/26/29/30), zero June. Window filter proven working: on phone, "This month"=Khichadi 6/Poli 6/Anda Masala; "Last month"(June)=Kobi 4/Chicken Wings 3/Palak Paratha 3/Chicken Biryani 3/Veg Biryani 2 (Khichadi ABSENT) — different dishes + different Top Restaurants (July Panera/Hideaway vs June Vanam/Subway) ⇒ not all-time. Earlier "July=3" claim was MY error (read only first 50 of 100 home docs). No code change needed. Device-screenshot verification via `adb exec-out screencap -p` is a reliable check for RN app state.
Built RELEASE APK (assembleRelease) + installed on device 57150DLCH002E1 over **wireless debugging** (adb pair 192.168.86.121 + connect :39741). Latest build 2026-07-31 23:23, 69.8MB. On-device verification by Sameer pending.

## Prior Session — Firestore read reduction (branch reads-cache-first / PR #4)
Meals + dishes now **cache-first single-source**: load ALL once per household/session, every screen filters in memory, writes update memory locally (same-phone edits show instantly everywhere, 0 reads), re-read only on pull-to-refresh or household change. Removed 20s TTL + write-invalidation; coalesced concurrent loads; App.tsx warms caches at startup. No onSnapshot by design (user OK with cross-device refresh). New useMealStore.test.ts (5 tests) locks it. tsc=0, 19/19 Jest. Effect: ~2-3k reads/day → ~1 getAllMeals+getDishes per launch/refresh, flat. Built RELEASE APK (assembleRelease, standalone) + installed on device 57150DLCH002E1; copied to C:\Users\samee\Downloads\Sofra-beta.apk for Sameer to share with wife via Google Drive (chose private Drive over a public GitHub release). PAUSED: Sameer monitors Firebase read count tomorrow (2026-07-11) to confirm the drop; if good → move to release.

## Bug fixes (2026-07-10, branch reads-cache-first, tsc=0)
- FUTURE-DISH-STAT: DishLibrary "unique dishes" derived `lastCookedDate` as the MAX of ALL meal dates incl. future-planned ones, so an upcoming dish (e.g. Upma next Sunday) beat the real last-cooked date and skewed "Xd ago" + counts. Fixed by skipping meals with `m.date > today` (local yyyy-MM-dd) in DishLibraryScreen allDishes aggregation. (commit 98e6420)
- EXTRA-DISH-DELETE: Removing an added side from a home meal didn't persist — AddMealScreen only wrote `items` when >1 dish, so reducing to a single dish dropped the key and the merge-only Firestore/store update left the stale array; the removed dish reappeared on Home/Calendar. Fixed: home meals always persist `items` (len>0). (commit bdc7370)
- Added top-level README.md (overview, features, stack, architecture, setup/build). (commit 31e7057)
- Built release APK (assembleRelease), installed on device 57150DLCH002E1, merged PR #4 to main.

## Next Up
0. **Regenerate product screenshots** home.png + insights.png (they still show old "Dine Outs" card / 3-card Most Cooked). Pipeline: `adb exec-out screencap -p` (1280x2856) → sharp crop top 150px → 1280x2706 to match existing. Needs a curated app-data state first (current has test junk like "Test" dish). Merge PR #5.
1. **Rebuild release APK** with the 6 fixes (assembleRelease), install on device, verify each fix against real Firebase data — esp. Outside Meals count (dineout+takeout).
2. **Confirm read count dropped** in Firebase console (target: from ~2-3k/day toward a few hundred). If wife's install works + reads look good → green-light release path.
3. Merge PR #3 (site) + PR #4 (reads) to main.
4. Release path: Play **Internal testing** (instant Play install, up to 100 testers) OR closed beta (12 testers/14 days → production); org account w/ D-U-N-S skips the gate. Prep: data-safety form, store listing, signed AAB via EAS.
5. Reads Tier 3 (only before large histories / scaling): denormalized stats docs + optional ~12-mo load cap; enable Firebase App Check.
6. Backlog: NOTIF-DEEPLINK MVP2; icon/splash PNG regen; crash reporting (Sentry vs Crashlytics); deploy+verify Firestore/Storage rules in prod.

## Device-test findings — ALL FIXED (2026-07-09 pt3, phased, tsc=0/14 tests)
- DUPMEAL: Home now runs dedupeMeals on load + picks newest record per slot (matches Calendar/Plan) → no more Home/Calendar divergence.
- COLDBOOT: App.tsx loading gate now shows branded splash (Sofra logo circle + wordmark + tagline).
- LOADFLASH: Home "Today's meals" shows Skeleton placeholders during load instead of "No meal planned" flash.
- SIGNUP-LOGO: AuthScreen resets scroll to top on sign-in↔sign-up toggle (logo was clipped from retained offset).
- COPY-AI: "AI-powered weekly plans" → "Personalized weekly plans from your cooking history".
- DELIGHT: new Celebration.tsx (native-driver confetti burst) fires on Plan accept. (dish-rate omitted — confetti on every star tap = noisy.)
Pending: rebuild+install+device-verify, then commit to PR #2.
