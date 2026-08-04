# iOS Appetize.io Smoke-Test Runbook (Sofra)

**Build:** EAS iOS simulator build `620270a7` (v1.0.0, SDK 52) — includes email-verification gate, generic auth errors, meal-slot fix.
**Artifact:** https://expo.dev/artifacts/eas/Mhwupxa54G8EnSKzpGJuecYiyDruK3QJyg72ruuG4aw.tar.gz
**(superseded:** old build `e7a0f565` predates the auth fixes — do not use.)

> **Free-tier discipline:** ~30 min/month, ~3 min/session. Tests are ordered by RISK and batched into 3 short sessions so the scariest things (sign-in, Firebase writes) are proven first. Read the whole session's steps BEFORE launching it, so no clock time is spent reading. Keep the Firebase console open in another tab to watch writes land.

## One-time setup (no session clock)
1. Create a free account at **appetize.io**.
2. **Upload → paste the artifact URL above** (or download the .tar.gz and upload the file). Platform: **iOS**, choose a recent iPhone + iOS 17/18.
3. Open **Firebase console → Firestore** (project `thaliplan`) in a second browser tab, and **Authentication → Users**. You'll watch these update live.
4. Do NOT start the session until you've read Session 1 below.

## Session 1 — CRITICAL PATH (auth + first write) — the make-or-break session
Goal: prove Google Sign-in and the first Firestore write work on iOS.
1. App launches to the login screen (no white screen / crash).
2. Tap **Continue with Google** → Google sheet appears → sign in.
   - ✅ PASS: returns to app, lands on household/home. New row in **Auth → Users**.
   - ❌ If the Google sheet never appears → `iosUrlScheme` / `iosClientId` issue.
   - ❌ If sign-in returns but no Auth user / app hangs → token/webClientId issue.
3. Create a household ("Test House"). ✅ New doc in Firestore `households`.
**If Session 1 passes, iOS is fundamentally working.** Everything after is feature polish.

## Session 2 — CORE LOGGING + PLANNER
(Sign-in is cached, so this session starts already logged in.)
4. Log a **home meal**, multi-dish (e.g. 2 dishes) with a per-dish rating. ✅ Firestore `meals` doc, `items[]` has names + ratings.
5. Log a **dine-out / outside meal** with a restaurant name, leave one dish UNRATED. ✅ Saves with NO crash (this was the launch-blocker bug on Android — confirm iOS too).
6. Open **Plan** → generate weekly plan → accept. ✅ Plan shows HOME dishes only; Calendar reflects it.

## Session 3 — INSIGHTS + MEDIA + DESTRUCTIVE
7. Open **Insights** → charts render (no blank/NaN), unique-dishes count looks right.
8. **Avatar upload** → pick an image → ✅ uploads (resized ≤512px/1MB) to Storage, shows on profile.
9. Dish Library / Restaurants lists populate from what you logged.
10. **Delete account** (settings) → ✅ Auth user deleted FIRST, then data; app returns to login. Confirm the Auth user is gone in console.

## Silent-failure quick reference
| Symptom | Likely cause |
|---|---|
| Google sheet never appears | iOS URL scheme (REVERSED_CLIENT_ID) missing/wrong |
| Signs in but no Firestore/Auth activity | wrong bundle id / config mismatch |
| App white-screens on launch | JS bundle / Hermes / asset issue — check build logs |
| Dine-out save crashes | undefined rating not stripped (should be fixed via sanitize.ts) |

## After testing
- Report each numbered item PASS/FAIL back to me with any error text.
- All pass → GO decision: enroll Apple Developer ($99/yr), then a signed device/TestFlight build.
- Any fail → send me the symptom; I fix config/code, rebuild on EAS, you retest.
