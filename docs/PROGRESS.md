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

## Last Session (2026-08-02, latest — pre-launch auth fixes, branch `ios-setup`)
- **DECISION: block launch to fix auth first** (Path A = Firebase link-based, no backend/no billing). Code-only + Firebase-console; ZERO Android-config diff (no app.json/eas.json/package.json touched — lock holds). tsc=0, **50/50 tests pass**. ALL changes are shared RN/Firebase-JS code → apply to BOTH iOS + Android (no platform branch).
- **#SECURITY Firebase errors no longer leaked:** new `src/utils/authErrors.ts` maps codes → generic copy; wrong-password / unknown-account / invalid-credential ALL say "Incorrect email or password." (no DB/SDK leak, no account-enumeration). Wired into every `useAuthStore` catch. Locked by `authErrors.test.ts` (4 tests).
- **Sender name:** Sameer owns savvylabs.dev NOT sofra.com; only wants inbox to read "Sofra" (not app.thaliplan). Path A sender-name="Sofra" console field fully covers it — no domain/backend. From-address stays firebase domain (he doesn't care).
- **#4 reset email OPEN:** Sameer confirms NOTHING arrives (inbox+spam). Most likely = tested a Google-only account (no password → Firebase silently sends nothing). NEXT: check Auth→Users Providers col for that email; if only-Google, expected. Else create fresh email/pw account + retest; if still nothing → project email-config dig.
- **BUILD STRATEGY (Sameer's call): Android = LOCAL, iOS = EAS.** Committed `e0bd110` on `ios-setup`. Cancelled an unneeded EAS Android build; free tier = 1 concurrent. Android release APK built LOCALLY via `npx expo run:android --variant release` (device connected over wireless adb; release signs w/ debug keystore SHA1 5E:8F:16:...:F6:25 = the stable one already in Firebase → Google Sign-in works). Build = 3m11s (NORMAL; the "slow"/hang was expo run:android idling on Metro:8081 after BUILD SUCCESSFUL — next time use `cd android && ./gradlew assembleRelease` to build+exit). APK `android/app/build/outputs/apk/release/app-release.apk` (67MB); INSTALLED on Pixel (com.thaliplan.app v1.0.0, 14:48). AWAITING Sameer device test of the 4 fixes. iOS sim build on EAS (`--profile preview`) for Appetize DONE = build `620270a7`, artifact https://expo.dev/artifacts/eas/Mhwupxa54G8EnSKzpGJuecYiyDruK3QJyg72ruuG4aw.tar.gz — REPLACES stale `e7a0f565` (predates these fixes). Local toolchain confirmed: SDK, adb, gradle, JDK17 all present.
- **Google Sign-in caveat on local/debug-signed APK:** debug-keystore SHA-1 must be in Firebase or Google sign-in silently fails; email/password + new features test fine regardless.
- **VERIFICATION EMAIL CONFIRMED WORKING** (Sameer received it). **Level A branding DONE by Claude via browser automation in Sameer's Chrome** (Firebase console has no CLI/API for these): Public-facing name → "Sofra" (Project Settings); Email-verification + Password-reset templates Sender name → "Sofra" (both saved OK). %APP_NAME% now renders "Sofra" in all subjects/bodies. NO rebuild (server-side, both platforms). Project is on BLAZE (Level B feasible w/o plan change). Level B (custom domain noreply@savvylabs.dev + full HTML via Cloud Fn+Resend) DEFERRED. NOT done: visible do-not-reply footer in body (reply-to already =noreply; offered, awaiting Sameer OK to edit body HTML).
- **Forgot-pw copy fixed (code):** removed the "just use Continue with Google" nudge — a user may register abc@gmail.com w/ email+password on purpose; don't steer to Google. Now neutral "if an account exists, a link is on its way." tsc=0, 50/50.
- **#1 Email verification (NEW):** `signUpWithEmail` now sends a verification link; auth store tracks `emailVerified`; new gate screen `VerifyEmailScreen` sits between auth and app ("I've verified"/"Resend"). Google accounts arrive verified → skip gate. Wired in `App.tsx` + `AppNavigator`.
- **#2 Forgot password:** code path was already correct (`sendPasswordResetEmail`) — real cause of "no email" = tested a Google-only account (no password) or spam. Hardened the success copy to say so.
- **#3 Branding:** Path A can only set sender NAME=Sofra + subject/body + no-reply footer (From-address stays Firebase domain; custom sender needs Path B). Exact paste-in copy → `docs/firebase-email-templates.md` (SAMEER console task).
- **#4 Meal-type bug FIXED:** tapping Dinner on Home now pre-selects Dinner in AddMeal (passed `mealType` nav param) instead of defaulting to Lunch and falsely reporting a conflict.
- **NEEDS DEVICE TEST before Android build:** verify-email gate + resend + reset copy + meal-type slot. Not yet run on device (RN — not browser-previewable).

## Prior Session (2026-08-02 — Appetize walkthrough)
- Reviewed `ios-appetize-runbook.md`; iOS sim build #2 (`e7a0f565`) is the artifact to test. FLAGGED: EAS artifact URLs expire ~30d — if the .tar.gz 404s, `npx eas-cli build:view e7a0f565` or fresh `eas build -p ios --profile preview`.

## Prior Session (2026-08-02 — iOS wiring on branch `ios-setup`)
- **Android LOCK established:** backup `C:\Users\samee\DiningPlanner-Android` (repo minus node_modules); work on branch `ios-setup`; hard constraint added (see Constraints). Verified Android config byte-for-byte untouched in every edit.
- **Registered iOS app in Firebase** (`thaliplan` project, bundle `com.thaliplan.app`, nickname "ThaliPlan iOS") → additive, Android app untouched. Got iOS OAuth client.
- **Wired iOS Google Sign-in (JS-SDK-correct, no plist in repo):** `app.json` plugins → google-signin `iosUrlScheme` (proven iOS-Info.plist-only, no Android branch); `auth.ts` → added `iosClientId` (Android ignores); `eas.json` preview → `ios.simulator:true` (Appetize path, no Apple acct needed). iOS OAuth values: client `349329204088-nmihufdrn14vsqikc5tpotqf37otvaui`.
- **EAS linked:** project `sofrasavvylabsdev` (owner `savvylabs`, id f4ddb333-3bef-4b83-a470-a98b046a86a8); app.json slug → `sofrasavvylabsdev` (approved; Expo-internal only, Android package id unchanged). Added `ios.infoPlist.ITSAppUsesNonExemptEncryption:false`.
- **DISCOVERED + FIXED pre-existing EAS-build blocker (affects Android too):** `@expo/vector-icons@15.1.1` peer-needs `expo-font>=14` but SDK52 pins `expo-font@13.0.4` → `npm install` ERESOLVE fails on EAS (and locally). Fix = `.npmrc` `legacy-peer-deps=true` (ZERO version change; dry-run tree identical). **Android production EAS build will need this same .npmrc.**
- **Health:** tsc=0, 46/46 tests pass. Committed on `ios-setup` as `f514818`.
- **iOS builds:** #1 `0c7036a9` ERRORED (npm conflict, pre-fix). #2 `e7a0f565` **FINISHED** ✅ — iOS SIMULATOR build (isForIosSimulator=true, SDK52, v1.0.0 build1). Artifact (.tar.gz): https://expo.dev/artifacts/eas/ug9sdxLZ8LsngkQ4dbO9nf0hyXXPfx2Tisu9COOnlks.tar.gz — ready for Appetize.io.
- **Prior session (2026-08-01):**
- **Website icon refresh:** feature-card emoji (🍲✨📊…) → 7 branded SVG icons. Live on `sofra.savvylabs.dev`.
- **iOS deployment research & guides:** Created 4 comprehensive guides (deploy checklist, Firebase setup, App Store submission, quick-ref). Key findings: iOS differs from Android (URL schemes instead of SHA-1, stricter privacy label, silent failures documented).
- **iOS testing strategy:** Appetize.io cloud simulator (free tier: 30 min/month, 3 min/session) for pre-testing before giving builds to friends. No Mac/iPhone/Apple account needed for initial testing.
- **Model decision:** Opus 4.8 Medium effort chosen for iOS work (better reasoning on multi-step config, catches silent failures, worth cost vs. wasted Appetize sessions).
- **Launch readiness:** Android path ready. iOS path fully documented + testing strategy confirmed.

## Next Up (Sameer's launch path)
**Auth (NOW BLOCKS LAUNCH — verify before building):**
0. Firebase console: paste email-template copy from `docs/firebase-email-templates.md` (sender name Sofra + subjects/bodies).
1. Device/Appetize test the new flows: sign-up → verify-email gate → click link → "I've verified" lands in app; Resend works; forgot-password on an EMAIL account delivers; tap Dinner on Home → form opens on Dinner.

**Android (after auth verified):**
2. Verify Google Play Developer account.
3. `eas build -p android --profile production` → Play Console → internal testing.
4. Compliance + store listing + smoke test.

**iOS (simulator build READY — Appetize next):**
1. ✅ Build #2 FINISHED — artifact URL above. NEXT: create Appetize.io account, upload the .tar.gz (or paste the artifact URL). Guard the free tier (30min/mo, 3min/session) — run the checklist deliberately.
2. Run the 10-point smoke test (watch Google Sign-in especially — simulator OAuth is the main risk).
3. If a build fails: `eas build:view <id> --json` → logFiles[0] → `curl -sk --compressed <url>` (it's NDJSON; grep `npm error`/phase).
4. If all pass → enroll Apple Developer ($99/yr) → signed build → TestFlight → App Store (`ios-deploy-checklist.md`).
- NOTE: `@react-native-google-signin` needs a dev/custom build (not Expo Go). EAS login is done (sameerrajwade); eas-cli NOT on Sameer's real-terminal PATH (use `npx eas-cli` or `npm i -g eas-cli`).
- Guides ready: `ios-deploy-checklist.md`, `ios-firebase-setup.md`, `ios-appstore-submission.md`, `ios-quick-ref.md`.

**Post-launch:** Update `#get` button href (line 120) to live Play URL.

## Constraints
- **ANDROID LOCK (iOS work in progress):** Android is FROZEN. iOS changes are additive to iOS-only sections ONLY. HANDS OFF: `app.json` root keys + `"android"` block (L23-29); `eas.json` existing `android`/`submit` keys; `package.json` dependency versions (no bumps for iOS). No new/upgraded deps to support iOS without flagging Android impact first. Every iOS commit must show ZERO diff to Android config. iOS work lives on branch `ios-setup`. Backup restore point: `C:\Users\samee\DiningPlanner-Android` (full repo minus node_modules).
- **Firebase = JS SDK (not native RN Firebase):** `src/config/firebase.ts` uses a platform-agnostic `firebaseConfig` JS object → iOS reuses the SAME config for Firestore/Auth/Storage. NO `GoogleService-Info.plist` needed for those. The iOS guides' plist/native steps mostly DON'T apply. Only iOS-specific secret = Google Sign-in iOS OAuth client (iosClientId + reversed-client-id URL scheme) in `app.json`.
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
