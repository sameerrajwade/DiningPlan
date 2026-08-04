# Sofra — App Store Connect Listing Pack (paste-ready)

Everything needed to fill the App Store Connect listing. Apple's fields differ from
Google Play (shorter name, a subtitle, a 100-char keyword field, plus a privacy
"nutrition label" and an age-rating questionnaire). Character limits noted inline.

---

## 1. App information (set once)

- **App Name** (max 30 chars): `Sofra: Family Meal Planner`  *(26 chars)*
  - Fallback if taken: `Sofra — Meal Planner` (20), then `Sofra: Meal & Dinner Planner` (28).
- **Subtitle** (max 30 chars): `Plan meals, remember it all`  *(27 chars)*
  - Alternates: `Family meals, planned & logged` (30) · `Never wonder what's for dinner` (30)
- **Primary category:** Food & Drink
- **Secondary category (optional):** Lifestyle
- **Bundle ID:** `com.thaliplan.app`  *(EAS registers this during the build)*
- **SKU** (internal, any unique string): `sofra-ios-001`
- **Primary language:** English (U.S.)
- **Copyright:** `2026 Sameer Rajwade`

## 2. Version listing (per-version)

- **Promotional text** (max 170 chars, editable anytime WITHOUT review):
  `Now on iPhone & iPad. Plan the week from your own cooking history, log home or
  takeout meals in seconds, and see what your family really eats.`  *(152 chars)*

- **Keywords** (max 100 chars total, comma-separated, NO spaces after commas — every
  char counts; don't repeat words already in the name/subtitle):
  `dinner,recipe,cooking,menu,weekly,tiffin,grocery,food diary,household,kids,eat,mealprep`
  *(≈92 chars — verify in the field; trim the last term if it shows over 100)*

- **Description** (max 4000 chars):

```
Sofra is your family's shared table — a warm, simple way to plan meals, track what you actually cook, and stop repeating the same dishes on autopilot.

Log a meal in seconds — home-cooked, takeout, or dining out — with one or many dishes and per-dish ratings. Sofra quietly learns your kitchen and turns it into insights you'll actually use.

WHAT YOU CAN DO
• Plan the week — personalized weekly plans built from your own cooking history.
• Log any meal — home, takeout, or restaurant, with multiple dishes and star ratings.
• Kids' tiffin planning — plan children's meals separately from family meals.
• See your patterns — most-cooked dishes, dishes you haven't made in a while, outside-meal spend.
• Restaurant memory — remember which dishes to order (and which to skip) at each place.
• Share with family — one household, everyone stays in sync.
• Reminders — gentle notifications so tomorrow's menu is never a surprise.
• Light & dark themes, designed to be calm and readable for all ages.

WHY SOFRA
The daily "what should we cook?" is exhausting. Sofra remembers for you — what you made, what everyone liked, what's overdue for a comeback — so meal decisions get easier every week.

Your data is yours. Meals sync privately to your household, encrypted in transit, and you can delete your account and all data anytime from Settings.

Sign in with Apple, Google, or email.
```

- **Support URL:** https://sofra.savvylabs.dev
- **Marketing URL (optional):** https://sofra.savvylabs.dev
- **Privacy Policy URL:** https://sofra.savvylabs.dev/privacy.html

## 3. Screenshots (upload from `assets/brand/marketing/ios/`)

- **iPhone 6.7" (required, 1290×2796):** `sofra_ios_67_home.png`, `sofra_ios_67_plan.png`,
  `sofra_ios_67_insights.png`, `sofra_ios_67_addmeal.png`, `sofra_ios_67_celebration.png`
- **iPad 12.9" (required because supportsTablet=true, 2048×2732):** `sofra_ios_ipad_home.png`,
  `sofra_ios_ipad_plan.png`, `sofra_ios_ipad_insights.png`
- **App icon:** App Store Connect pulls the 1024 icon from the build automatically. The
  marketing copy `sofra_icon_1024.png` (no alpha) is there if a manual upload is ever asked for.

> NOTE on iPad: because `app.json` has `ios.supportsTablet: true`, Apple REQUIRES iPad
> screenshots. If you'd rather NOT ship/support iPad, set `supportsTablet: false` and the
> iPad screenshot requirement disappears — flag me and I'll change it (iOS-only, Android-safe).

## 4. App Privacy — "nutrition label" answers

Sofra uses Firebase Auth + Firestore + Storage (JS SDK). It does NOT run analytics
(no getAnalytics call) and does NOT track users across other apps/sites.

**Do you collect data? → YES.** For every item below: purpose = **App Functionality**,
**Linked to the user's identity = Yes**, **Used for tracking = No**.

| Category | Data type | Notes |
|---|---|---|
| Contact Info | Email address | Account sign-in |
| Contact Info | Name | Display name / household member |
| User Content | Photos or Videos | Optional profile avatar |
| User Content | Other User Content | Meals, dishes, ratings, restaurants, notes |
| Identifiers | User ID | Firebase account UID |

- **Tracking:** None. Answer "No" to the "used to track you" prompt for every item.
- **Data NOT collected:** location, contacts, browsing history, search history, purchases,
  financial info, health, sensitive info, usage data, diagnostics/crash data (no crash SDK yet).
- **Data deletion:** Yes — the app offers in-app account + data deletion (Settings). When asked
  "Does your app provide a way for users to request deletion?" → **Yes** (also via support email).

## 5. Age rating questionnaire

Answer **None / No** to every content question (no violence, profanity, sexual content,
gambling, drugs, horror, mature themes, user-generated content that's public, etc.).
→ Expected rating: **4+**. It is NOT age-restricted and NOT made for kids (don't opt into
the Kids Category).

## 6. App Review Information (critical — app is behind a login)

- **Sign-in required:** YES. Provide a demo account so Apple can review:
  - **Demo username:** `⟨SAMEER: create a test account in the app and paste its email here⟩`
  - **Demo password:** `⟨SAMEER: paste the test account password here⟩`
  - *(Use email/password sign-in for the demo — simplest for reviewers. Seed it with a couple
    of logged meals so the reviewer sees populated Home/Insights screens.)*
- **Notes to reviewer:**
  ```
  Sofra is a family meal-planning app. Sign in with the demo email/password above (or use
  Sign in with Apple / Google). After sign-in you can create or join a household, log a meal
  (home, takeout, or dine-out) with dishes and ratings, generate a weekly plan, and view
  Insights. Account and all data can be deleted in Settings > Delete Account.
  ```
- **Contact:** Sameer Rajwade · sameerrajwade@gmail.com · phone on file in Membership details.

## 7. Export compliance
Already handled in `app.json` (`ITSAppUsesNonExemptEncryption: false`) — Apple will not
prompt for encryption docs. Uses only standard HTTPS/TLS.

## 8. Pricing & availability
- **Price:** Free (Tier 0). No in-app purchases (paywall deferred post-launch).
- **Availability:** All territories, OR deselect the EU if you skip DSA trader status
  (see PROGRESS — EU listing needs a trader/non-trader declaration; harmless to leave EU off
  for a US-first launch).

---

## What still needs Sameer (the only human-gated bits)
1. Run the build: `npx eas-cli build --platform ios --profile production` (+ Apple 2FA login).
2. Create a **demo test account** in the app and paste its email/password into §6 above.
3. Decide iPad support (§3 note) and EU availability (§8).
Everything else (entering all of the above into App Store Connect, uploading screenshots,
submitting for review) Claude can drive in the browser once the build/app record exists.
