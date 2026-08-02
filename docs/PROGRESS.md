# Sofra — Progress

> Thorough restart reference. If resuming a new session, read this first.

## Current State (facts)
- **App:** Sofra — family meal-planning app. React Native / Expo + Firebase (Firestore/Auth/Storage) + TypeScript. Zustand state, React Navigation, React Native Paper. Rebranded ThaliPlan → Sofra.
- **Design:** Terracotta & Sage theme (light/dark/auto), Fraunces (display) + Inter (body), RN Animated motion. All screens dark-aware.
- **MVP1 features:** multi-dish meals + per-dish ratings, kids-tiffin planning, weekly auto-planner, local notifications, Insights charts, restaurants + dish library, in-app account deletion.
- **Health:** `tsc=0`, **46/46 Jest tests pass**. Latest RELEASE APK on Pixel 10 Pro (device-verified, no crashes).
- **Website:** `sofra.savvylabs.dev` (GitHub Pages) — fully branded with 7 SVG feature icons, dark-mode aware, 9-screen gallery. Live.
- **Firebase:** project `thaliplan`. Firestore + Storage rules deployed. Android Firebase config verified (SHA-1 ready).
- **Deployment:** Android path documented + ready (Play verification → `eas build` → internal testing). **iOS path FULLY documented** (4 guides: checklist, Firebase setup, App Store submission, quick-ref). Code is iOS-ready (no changes needed).

## Last Session (2026-08-01, latest)
- **Website icon refresh:** feature-card emoji (🍲✨📊…) → 7 branded SVG icons. Live on `sofra.savvylabs.dev`.
- **iOS deployment research & guides:** Created 4 comprehensive guides (deploy checklist, Firebase setup, App Store submission, quick-ref). Key findings: iOS differs from Android (URL schemes instead of SHA-1, stricter privacy label, silent failures documented).
- **iOS testing strategy:** Appetize.io cloud simulator (free tier: 30 min/month, 3 min/session) for pre-testing before giving builds to friends. No Mac/iPhone/Apple account needed for initial testing.
- **Model decision:** Opus 4.8 Medium effort chosen for iOS work (better reasoning on multi-step config, catches silent failures, worth cost vs. wasted Appetize sessions).
- **Launch readiness:** Android path ready. iOS path fully documented + testing strategy confirmed.

## Next Up (Sameer's launch path)
**Android (priority):**
1. Verify Google Play Developer account.
2. `eas build -p android --profile production` → Play Console → internal testing.
3. Compliance + store listing + smoke test.

**iOS (when ready — pre-enrollment testing):**
1. Use Expo Go on friend's iPhone for quick testing (free, no account).
2. OR: Build preview iOS app → test on Appetize.io cloud simulator (free tier available).
3. When confident → enroll Apple Developer ($99/year) → follow `ios-deploy-checklist.md`.
4. TestFlight internal testing before App Store submission.
- Guides ready: `ios-deploy-checklist.md`, `ios-firebase-setup.md`, `ios-appstore-submission.md`, `ios-quick-ref.md`.

**Post-launch:** Update `#get` button href (line 120) to live Play URL.

## Constraints
- Repo: github.com/sameerrajwade/Sofra. Package id `com.thaliplan.app` must NOT change (Firebase-linked).
- **Never handle signing/keystore passwords — Sameer signs.** Signing path = **EAS managed** (cloud build, EAS-stored upload key, Play App Signing).
- Motion = built-in RN Animated only (no Reanimated). Paywall/monetization DEFERRED to post-launch.
- Develop → test → show results → only then build/deliver. Verify on device via `adb exec-out screencap -p`.
- Firebase project = `thaliplan`. Prod rule deploys: `firebase deploy --only firestore:rules` / `--only storage`.

## Key file & asset locations
- **Video prompts:** `docs/video-prompts.md` — 10× 20-second brand-commercial briefs (real-people shoots): cast, setting, timecoded beats, which app screen to feature, on-screen line, + production notes. End-card = logo lockup + Google Play badge.
- **Branding / marketing assets:** `assets/brand/marketing/` (has its own `README.md`). Master logo source: `assets/brand/icon_full.svg` (terracotta tile) + `assets/brand/mark_cream.svg` (bowl only). Palette: terracotta `#C0532E`, sage `#5E8B6A`, warm paper `#FBF7F2`. Render pipeline = Chrome headless @2× → sharp downscale; icon via sharp-from-SVG. Editable `.html` source sits next to every `.png`. Exports:
  - `sofra_icon_512.png` 512×512 — **Play Store app icon** (full-bleed)
  - `sofra_feature.png` 1024×500 — **Play feature graphic** (subtle URL)
  - `sofra_shot_home/plan/insights.png` 1080×1920 — **Play phone screenshots** (branded frames; embed the GENERIC mockups — store-ready, no test data)
  - `sofra_reel.png` 1080×1920 — YouTube Shorts / Instagram Reels (+ Play pill)
  - `sofra_square.png` 1080×1080 — Instagram feed
  - `sofra_og.png` 1200×630 — website Open Graph / link-preview image
  - `sofra_lockup.png` 900×280 — transparent horizontal logo lockup (site header/press)
- **Generic app-screen mockups:** `assets/brand/marketing/screens/*.html` → rendered PNGs. All 9 screens (login, household, home, addmeal, plan, celebration, insights, share, calendar) rebuilt with GENERIC global data — "The Rivera Family"; dishes Veggie Stir-Fry / Grilled Salmon / Spaghetti Bolognese / Beef Tacos / Roast Chicken; restaurants Nonna's Kitchen / Green Bowl; cuisines Italian/American/Mexican/Asian; USD. **Copied into `docs/assets/screens/*.png` — the live site gallery (index.html) is now fully generic.**
- **Store listing copy:** `docs/store-listing.md` (title, short/full description, category, URLs).
- **Android deploy checklist:** `docs/android-deploy-checklist.md` (signing/build, Firebase, Play compliance, listing, rollout, launch sequence).
- **MVP2 backlog:** `docs/MVP2.md`.
- **NotebookLM ad brief PDF:** `C:\Users\samee\Downloads\Sofra_Ad_Brief_for_NotebookLM.pdf` (12pp). NOTE: embeds PRE-rename screenshots ("Dine Outs") — regenerate if visuals must match current UI.
- **Website:** GitHub Pages from `docs/`, custom domain `sofra.savvylabs.dev` (via `docs/CNAME`). Pages: index.html, guide.html, features.html, security.html, architecture.html, privacy.html, terms.html.

## LAUNCH STATUS

### DONE (code / infra / assets — all verified)
- **Launch-blocker bug fixed:** Dine Out/Takeout with an unrated dish wrote `items:[{name, rating:undefined}]` → Firestore "Unsupported field value: undefined". Fixed at source + deep recursive `stripUndefined` (`src/utils/sanitize.ts`) now wraps EVERY Firestore write. Device-verified: dine-out saves cleanly.
- **5-agent audit → 20+ fixes** (meal / planner / insights / restaurants / auth). Incl. **P0 account-deletion data-loss** (now deletes Auth user FIRST), planner kids-tiffin leak + data-loss, insights false "0% home" / range headline / empty-window / TZ bucketing, restaurant future-visit counts + TZ dates, avatar 1MB cap (512px), atomic arrayUnion/arrayRemove membership, signup household-name sync.
- **Unique Dishes = home-only** (was double-counting outside meals); Dish Library + Insights consistent. **Relative dates** Today/Yesterday/N-days-ago (`src/utils/relativeDate.ts`).
- **Plan↔Calendar synced:** planner suggests HOME dishes only; saved outside meals show restaurant name + dish; day header font + TODAY highlight box match Calendar.
- **Firestore + Storage rules deployed to prod** (leave-household branch added; both match repo).
- **eas.json** wired: `submit.production.android` (internal track, draft), production `autoIncrement` + `appVersionSource: remote`. Hermes on. AAB config in place.
- **Brand kit + store copy + privacy/terms** ready. In-app account deletion live.

### REMAINING FOR LAUNCH — Sameer console tasks (NOT code)
1. `npm i -g eas-cli` → `eas login` → `eas build -p android --profile production` → accept "generate keystore" → download the **.aab**.
2. Play Console: create app "Sofra" → **Internal testing** track → upload the .aab (or `eas submit -p android` after placing `play-service-account.json` at repo root — it's gitignored).
3. **CRITICAL:** after first upload, copy the **Play App Signing key SHA-1** (Play Console → App integrity) AND the upload-key SHA-1 → add BOTH to Firebase console (project settings → Android app). Then **verify Google Sign-in on the internal-testing build** — it silently fails if SHA-1 is missing.
4. Play compliance: **Data Safety form** (collects: email, name, user content/meals, avatar photo; encrypted in transit; user-deletable), **content rating** (IARC → Food & Drink, likely Everyone), **target audience** (not child-directed), **privacy URL** https://sofra.savvylabs.dev/privacy.html, category Food & Drink.
5. Store listing: paste copy from `docs/store-listing.md`; upload `sofra_icon_512.png` (512×512), `sofra_feature.png` (1024×500), and ≥2 of `sofra_shot_*.png` (1080×1920).
6. Rollout gate: **personal Play account** ⇒ 12-tester/14-day closed testing before production; **internal testing is instant** (up to 100 testers) — start there.
7. Pre-submit smoke test on the STORE artifact: sign-in → household → log meal (incl. dine-out) → generate+accept plan → insights → avatar upload → delete account.

## WEBSITE — REVAMPED (done this session)
`sofra.savvylabs.dev` (GitHub Pages from `docs/`). Consumer launch pass DONE:
- **Screens fully generic + live** — all 9 `docs/assets/screens/*.png` (Rivera Family, global dishes) power BOTH the index gallery AND `guide.html`. The old numbered `docs/screens/*.png` are ORPHANED (referenced by nothing) — safe to delete later.
- **Nav de-dev'd** on index + guide: `Features · Guide · FAQ · Get the app` (Architecture/Security demoted to footer).
- **Open Graph / Twitter meta** added to index + guide (image = `docs/assets/og.png` = the 1200×630 brand OG). `docs/assets/lockup.png` also copied in for future header use.
- **FAQ section** added (recipe app? shared account? cost? privacy? platforms? planning?).
- **"Get Sofra"** section → launch/**"Coming soon on Google Play"** state (removed the dead `CHANGE-ME` GitHub link). ⚠️ ONE TODO left in `index.html` (HTML comment at #get): after Play launch, set the button href to the live listing URL + relabel "Get it on Google Play".
- theme-color + canonical added. Static, GitHub Pages, dark-aware.

## Verified on device (Pixel 10 Pro, this session)
Dine-out save works (no crash) · Home "Unique Dishes" = 1 (home-only) · Dish Library "Palak Paratha · Today · 1 dish" · Plan shows Saturday TODAY box + "Honest"→"Dosa" dine-out + home-only generated dishes + Calendar-matching fonts.

## Backlog / non-blocking / later
- **MVP2** (`docs/MVP2.md`): relative-date larger units (weeks/months), optional combined home+outside dish view, notification deep-linking.
- **Non-blocking watch-items:** orphaned Storage avatar bytes on account delete (rule-safe); spending-trend chart with exactly 2 equal data points (low-confidence react-native-chart-kit).
- **Post-launch:** crash reporting (Sentry vs Crashlytics — needs DSN), Firebase App Check (Play Integrity), reads Tier 3 (denormalized stats only before large histories), icon/splash PNG regen if desired, i18n.
- Regenerate the NotebookLM PDF screenshots if it'll be shared (currently pre-rename).

## History (condensed — earlier sessions)
- **PRs #2–#5 all MERGED** to `main`: #2 (14 UX/device fixes), #3 (GitHub Pages site), #4 (Firestore reads cache-first single-source — ~2-3k reads/day → ~1 load/launch), #5 (Insights/Dish window fixes, "Outside Meals" card, tappable Most Cooked, windowed dish counts, date-rollover recompute, pure dishStats/insightsRange utils).
- Cache-first store: all meals/dishes loaded once per session, screens filter in memory, writes update memory locally, re-read only on pull-to-refresh/household change (no onSnapshot by design). `useMealStore.test.ts` locks it.
- Prior verified-correct behaviors (not bugs): dish counts include thali sides (`items`); windowed vs all-time counts; kids excluded from family metrics.
