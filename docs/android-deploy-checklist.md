# Sofra — Android Play Store Deploy Checklist

Goal: ship Sofra to the Google Play Store. App is feature-complete for MVP1; this is the
release/compliance mile. Status legend: ☐ todo · ◐ in progress · ✅ done · 🔒 Sameer-only (keys/account/uploads).

**Package id:** `com.thaliplan.app` (Firebase-linked — must NOT change).
**Site:** https://sofra.savvylabs.dev (privacy + terms live here).

---

## A. Build & signing  ← the real blocker

- 🔒 **Decide signing path** — EAS managed (recommended) vs local keystore. See "Signing path" below.
- ☐ Produce a **signed AAB** (`.aab`, not APK). Play requires app-bundle for new listings.
  - Currently `android/app/build.gradle` release uses the **debug keystore** (lines ~109-112) → NOT publishable.
- 🔒 **Back up the keystore + passwords** somewhere safe (losing the upload key = painful key reset).
- ✅ Hermes enabled (`android/gradle.properties hermesEnabled=true`).
- ✅ `eas.json` production profile → `buildType: app-bundle`.
- ☐ Add an `eas submit` profile to `eas.json` (see B).
- ☐ Version: `versionCode 1` / `versionName 1.0.0` — fine for first launch. Bump `versionCode` every upload after.

### Signing path (recommendation: EAS managed)
**EAS Build + Play App Signing** — cloud builds the AAB, EAS generates & stores the upload key,
no human handles a keystore password (satisfies the "Sameer signs / never handle keystore passwords" rule).
- `eas build -p android --profile production` → AAB
- `eas submit -p android` → uploads to Play
- Needs a free Expo account login (Sameer).

Alt: **Local keystore** — Sameer runs `keytool` to generate, wires passwords into Gradle, builds AAB
locally. More control, but he handles passwords.

---

## B. eas.json — add submit profile
- ✅ Added `submit.production.android` (`serviceAccountKeyPath: ./play-service-account.json`,
  `track: internal`, `releaseStatus: draft`); production build now `autoIncrement` + `appVersionSource: remote`.
- ✅ `play-service-account.json` gitignored (secret).
- 🔒 Create a Google Play service account JSON (Play Console → Setup → API access → link a GCP
  project → create service account → grant Play access → download JSON) → save as
  `play-service-account.json` at repo root.

---

## C. Firebase (production)
- ☐ Deploy `firestore.rules` + `storage.rules` to the `thaliplan` project; verify deployed == repo.
- ☐ Confirm **Storage bucket is provisioned** (was flagged not-set-up; blocks avatar upload).
- 🔒 **Add SHA-1/SHA-256 fingerprints to Firebase** for Google Sign-in in the release build:
  - the **upload key** SHA-1, AND
  - the **Play App Signing key** SHA-1 (from Play Console → App integrity, after first upload).
  - Google Sign-in silently fails in release if these are missing — verify sign-in on a store build.
- ☐ (optional, recommended) Enable **Firebase App Check** (Play Integrity) before public traffic.

## D. Play Console — account & compliance
- 🔒 **Google Play Developer account** ($25 one-time). Personal vs org (D-U-N-S) matters — see gate below.
- 🔒 **Data Safety form** — declare: email, name, user content (meals), photo (avatar); encrypted in
  transit; user can request deletion. Provide the in-app + web deletion path.
- 🔒 **Content rating** (IARC questionnaire) — Food & Drink, no objectionable content → likely Everyone.
- 🔒 **Target audience & content** — not directed at children.
- 🔒 **Privacy policy URL** → https://sofra.savvylabs.dev/privacy.html
- 🔒 **Account/data deletion URL** for the Data Safety section → point to privacy page's deletion section
  (in-app deletion already exists in Settings ✅).
- 🔒 **App category:** Food & Drink.

### New-account testing gate
- Personal accounts created after ~Nov 2023 must run **closed testing: 12+ testers for 14 continuous days**
  before production access. Org accounts with a D-U-N-S number skip this.
- **Internal testing** (up to 100 testers, instant install, no 14-day gate) is the right first step regardless.

## E. Store listing assets  (all in `assets/brand/marketing/` — see its README)
- ✅ App icon **512×512** → `sofra_icon_512.png` (full-bleed, Play masks corners).
- ✅ **Feature graphic 1024×500** → `sofra_feature.png`.
- ✅ **Phone screenshot frames** ×3 → `sofra_shot_home/plan/insights.png` (1080×1920, branded).
  ⚠️ **They embed screenshots with TEST DATA** ("Test/Ttt/Mataki") — recapture `docs/assets/screens/*.png`
  from a clean app state, then re-render (design stays; only phone content refreshes).
- ✅ **Social set**: `sofra_reel.png` 1080×1920 (Shorts/Reels), `sofra_square.png` 1080×1080 (Insta),
  `sofra_og.png` 1200×630 (website OG), `sofra_lockup.png` 900×280 (transparent header lockup).
- ✅ **Store text** drafted → `docs/store-listing.md` (title, short + full description, category, URLs).

## H. Website revamp (sofra.savvylabs.dev) — consumer launch
Current GitHub Pages site is dev-tool-flavored (Guide/Features/Security/Architecture nav). For a public
consumer launch it needs a lighter, download-first pass. Sequence AFTER the Play listing exists (the
primary CTA links to it). Scope:
- ☐ Hero → "Get it on Google Play" badge (needs live Play URL) as primary CTA.
- ☐ Demote/hide dev pages (Architecture, Security) from primary nav → footer or remove.
- ☐ Benefit-led feature section + screenshot carousel (post-rename screens).
- ☐ Add Open Graph / Twitter meta + share image (reuse `sofra_square.png`) for link previews.
- ☐ FAQ + clear privacy/terms/account-deletion links in footer (deletion URL also feeds Play Data Safety).
- ☐ Keep it static on GitHub Pages (custom domain already wired via CNAME).

## F. Pre-submit smoke test (on the store artifact, not a local build)
- ☐ Fresh install → Google sign-in works (validates SHA-1 setup) → create/join household → log meal →
  generate + accept plan → insights → avatar upload → delete account.
- ☐ Confirm notifications fire (POST_NOTIFICATIONS runtime permission on Android 13+).

## G. Rollout
- ☐ Internal testing track first → verify → closed testing (if gated) → production staged rollout (10–20%).

---

## Decisions locked (2026-08-01)
- Signing path: **EAS managed** (cloud build, EAS-stored upload key, Play App Signing).
- Play Developer account: **exists** (personal → expect the 12-tester/14-day closed-testing gate for
  production; internal testing is instant and unaffected).

## Sameer's launch sequence (EAS managed)
1. `npm i -g eas-cli` (if needed) → `eas login` (free Expo account).
2. `eas build:configure` (first time) → then `eas build -p android --profile production`.
   EAS prompts to generate & store the Android keystore — say yes (managed credentials).
   Output: a signed **.aab**.
3. In Play Console: create the app "Sofra" → **Internal testing** track → upload the .aab (or use
   `eas submit -p android` after step B's service-account JSON is in place).
4. Play Console → App integrity: copy the **App Signing key SHA-1** → add it (and the upload-key SHA-1)
   to Firebase console (project settings → your Android app) → download refreshed `google-services.json`
   if changed. **Verify Google Sign-in on the internal-testing build** — this is where it breaks if SHA-1
   is missing.
5. Fill Data Safety + content rating + privacy URL (text drafted in `store-listing.md`).
6. Add ≥2 phone screenshots + feature graphic (ask me to generate the feature graphic).
7. Roll internal testing → (closed testing 14-day gate if personal account) → production staged rollout.

## What I (Claude) can still do without console access
- Generate the **1024×500 feature graphic** from the brand kit.
- Regenerate clean phone **screenshots** (curated data, post-rename UI).
- Refine store-listing copy.
- Verify/prepare `firestore.rules` + `storage.rules` for deploy (deploy itself needs your Firebase auth).
