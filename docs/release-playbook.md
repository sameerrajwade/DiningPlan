# Sofra Release Playbook (Production)

> Sofra is LIVE (iOS App Store) + in Android closed testing. Treat every release as production.
> This doc = how to ship a new version on both stores with **no delays and no failed steps**.
> Current shipped version: **1.0.1 (iOS build 6 / Android versionCode 3)**.
> Next version: bump to **1.1.0** — iOS build auto-increments; Android **versionCode 4** (must strictly increase).

---

## Your 3 questions, answered

### 1. Will a new iOS version go through the same review?
**Yes — every update is reviewed again, but update reviews are faster than the first one.** The app is known now, so most updates clear review in **24–48 h (often same day)**. It is the same App Review process, not a lighter one, so the metadata/build must still be compliant. Your **listing does not go away** during review — the current live version stays up until the new one is approved and released.

### 2. When a new iOS version publishes, does it auto-install or must users install it?
**It auto-installs for most users** — iOS "Automatic Updates" (Settings → App Store) is ON by default, and updates download in the background (device locked, on Wi-Fi, charging). Users with auto-update OFF must update manually from the App Store. Two nuances:
- If you use **Phased Release** (recommended), the update rolls out to auto-update users over 7 days (1%→2%→5%→10%→20%→50%→100%). **Anyone can still get it immediately by manually tapping Update**, and new downloads always get the latest.
- So: existing users get it automatically (within 0–7 days if phased), no action needed; nobody has to reinstall.

### 3. Android — closed testing (12 testers / 14 days) finishing tomorrow. What next?
The 14-day / 12-tester gate is a **one-time unlock** for production access (personal accounts created after 13 Nov 2023). Once the 14 continuous days complete **with ≥12 testers still opted in**:
1. Play Console → **Dashboard → "Apply for production"** → complete 3 sections (closed-test details, app info, production readiness) → submit.
2. Google reviews the application — **usually ≤7 days**.
3. On approval you get production access → create a **Production release**, upload the AAB, submit → first production review (a few days) → roll out.

**Key reassurances:**
- **After production access is granted, future Android updates NEVER need testers again** — normal release + review only.
- **Uploading new builds to the closed track during the 14 days does NOT reset the clock.** The clock is tied to testers staying *opted in* for 14 continuous days, not to build age. In fact Google *wants* to see you actively shipping improvements to testers during the window (uploading v1 and sitting idle can get the application rejected). So pushing the new retention/demo build to closed testing now is good, not harmful.
- Don't cancel/remove testers or let enrollment lapse before you apply.

---

## Golden rules (never break — production app)
1. **Never upload the local debug-signed APK to a store.** The `sofra-release.apk` we sideload for on-device testing is **debug-signed** — it is ONLY for the connected phone. Play + App Store submissions must be built through **EAS** (Play App Signing / Apple signing).
2. **versionCode must strictly increase** on every Play upload (…3 → 4 → 5…). iOS build number must increase each ASC upload (auto-incremented by EAS).
3. `tsc=0` + all Jest tests green + on-device smoke test **before** submitting.
4. Changes must be backward-compatible with existing users' Firestore data. (Current new work — switch-household, local tour, derived streak — is additive and safe.)
5. Do **not** edit metadata on a version that's "Waiting for Review" (iOS) — it sends it to the back of the queue.

---

## Apple release — step by step (no delay)
1. Bump version to `1.1.0` in `app.json` (`expo.version`).
2. `eas build -p ios --profile production` (Team 3HQ9T7PKN4; build number auto-increments).
3. `eas submit -p ios --latest` → uploads to App Store Connect (Starter plan = fast queue).
4. In ASC → the app → **(+) new version 1.1.0** → select the new build → fill **What's New** (list the new features) → keep screenshots (or add new ones).
5. **Release option:** choose **"Automatically release" + Phased Release** (safest for a production app — gradual rollout, can pause if a problem appears).
6. Submit for Review → typically approved in 24–48 h → auto-releases (phased).
7. No export-compliance prompt (`ITSAppUsesNonExemptEncryption=false` already set).

## Android release — step by step (no delay)
1. Bump `android.versionCode` to `4` and `version` to `1.1.0` in `app.json`.
2. `eas build -p android --profile production` (AAB, Play App Signing — key `41:C8…` in Firebase).
3. **While still in closed testing:** `eas submit -p android` (or upload the AAB) to the **closed** track so testers get the new build. This does not reset the 14-day clock.
4. When 14 days complete with ≥12 opted-in testers → **Apply for production** (Dashboard) → submit → wait ≤7 days for access.
5. On approval → **Production → Create release** → add the AAB → release notes → **staged rollout** (e.g. 20% → 100%) → submit → review → roll out.
6. Future updates: Production → Create release → new AAB (versionCode++) → review (faster) → roll out. No more testing gate.

---

## Impact of the current in-flight changes on the stores
- **iOS listing:** unaffected. A new version is a normal update; the live listing stays up through review.
- **Existing-user UX on update:** the first-run **product tour auto-shows once** for users who haven't seen it (they haven't) — it's skippable. The **daily reminder auto-on** only triggers on household create/join, so existing users keep their current notification choice (they can enable it in Settings).
- **No data migration needed.** Switch-household reuses existing join logic; tour/streak are local/derived.
