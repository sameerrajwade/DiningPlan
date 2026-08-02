# Sofra — iOS App Store Submission & Privacy Requirements

This document covers App Store Connect metadata, privacy requirements (App Privacy Details / Nutrition Label), common rejection reasons, and the review process. This is where iOS diverges most significantly from Android.

---

## 1. App Store Connect Setup

### Step 1.1: Create App in App Store Connect

1. Log into [App Store Connect](https://appstoreconnect.apple.com)
2. Click **+ Add New App**
3. Select **iOS app**
4. Fill in:
   - **App Name:** Sofra (the name users see on App Store)
   - **Bundle ID:** com.thaliplan.app (must match exactly)
   - **SKU:** sofra-2024 (internal identifier; not visible to users)
   - **User Account Type:** Organization or Personal (affects testing gate; personal = 12-tester/14-day gate before production)

### Step 1.2: Fill App Information

Navigate to **App Information** tab:

- **App Name:** Sofra
- **Subtitle:** (optional, 30 chars max) "Plan, cook, celebrate"
- **Category:** Food & Drink
- **Subcategory:** (optional) leave blank or "Lifestyle"
- **Primary Language:** English
- **Age Rating:** Complete IARC questionnaire (see section 3 below)
- **Copyright:** 2026 Sameer Rajwade (or your name)
- **Support URL:** https://sofra.savvylabs.dev (optional but recommended)
- **Privacy Policy URL:** https://sofra.savvylabs.dev/privacy.html (REQUIRED)
- **License Agreement:** (optional) leave blank

**Critical:** Privacy Policy URL is mandatory and must be a working HTTPS link.

---

## 2. General App Information (Pricing & Availability)

### Step 2.1: Set Pricing

1. Navigate to **Pricing and Availability**
2. **Price Tier:** Select "Free" (Sofra MVP1 is free)
3. **Availability:**
   - Check "Make this app available in the App Store"
   - Set "Release Date" to either immediate or a future date
   - Select regions (default: worldwide, recommended)
   - App availability: "This app requires iOS/iPadOS X.X or later"
     - Set deployment target to iOS 14.0 or later (EAS will use this)

### Step 2.2: Set Release Type

1. Navigate to **App Submission**
2. **Release Type:**
   - **Option A (recommended for MVP1):** "Automatically release this version"
     - App goes live immediately after approval
   - **Option B (if you want to control timing):** "Manually release this version"
     - You must click "Release" in App Store Connect after approval is complete
     - Useful if you want to coordinate launch with marketing/website updates

---

## 3. App Privacy Details (Nutrition Label)

**CRITICAL — This is the #1 iOS rejection reason in 2026.** Apple's App Privacy Details (Nutrition Label) must be 100% accurate.

### Step 3.1: Access App Privacy Details

1. App Store Connect → Your app
2. Navigate to **Privacy** tab
3. Click **Manage your privacy details**

### Step 3.2: Fill Privacy Questionnaire

You'll answer questions about what data you collect. For Sofra:

#### Data Collected by Your App

| Data Type | Collected? | Linked to User? | Tracking? | Reason |
|-----------|-----------|-----------------|-----------|--------|
| **Contact Info > Email** | Yes | Yes | No | Firebase Authentication (Google Sign-in) |
| **Contact Info > Name** | Yes | Yes | No | Displayed in household + settings (from Google profile) |
| **User IDs** | Yes | Yes | No | Firebase user ID (links all their data) |
| **User Content > Meals** | Yes | Yes | No | User-generated meal logs (dishes, ratings, dates) |
| **User Content > Photos** | Yes | Yes | No | Avatar upload to Storage |
| **Usage Data** | No | N/A | No | Sofra does NOT collect usage/analytics data |
| **Crash Data** | No | N/A | No | Sofra does NOT use Crashlytics/error reporting |
| **Analytics Data** | No | N/A | No | Sofra does NOT use Firebase Analytics |
| **Advertising Data** | No | N/A | No | No ads in MVP1 |

**Critical rule:** If a data type is toggled ON in the app, declare it. If OFF, don't declare it.

**Example of rejection scenario:**
- App has Firebase Analytics SDK installed but it's never initialized in code → you declare "Analytics data: Yes" → Apple checks the binary and finds it → rejection for "Data not collected as declared"
- Solution: Either initialize it (and declare it) or remove the SDK dependency

#### Data Encryption & User Rights

- **Data in Transit:** Yes (Firebase uses HTTPS/TLS)
- **Data at Rest:** Yes (Firebase encrypts at rest by default)
- **User Deletion / Account Deletion:** Yes → point to in-app deletion path
  - Sofra has this: Settings → Account → Delete Account ✅
- **Privacy Policy Updates:** Users can review at Settings or web link

### Step 3.3: Verify Against App Behavior

Before submitting:

1. Audit your app code:
   - Search for `firebase.analytics()` usage → if not used, don't declare analytics
   - Search for Crashlytics, Sentry, or error reporting → if not used, don't declare crash data
   - Search for AdMob or ad networks → if not used, don't declare advertising data
   - Verify Google Sign-in is used → declare email + name

2. Verify Security Rules:
   - Firestore rules should enforce `request.auth != null` (only authenticated users can read/write)
   - Storage rules should enforce user-scoped paths (users can only access their own files)

3. Test user deletion:
   - Delete account in app
   - Verify Firestore document is deleted
   - Verify Storage files are deleted
   - Verify can't sign back in with same email (creates new profile)

---

## 4. IARC Content Rating

### Step 4.1: Complete IARC Questionnaire

1. App Store Connect → App → **Age Ratings**
2. Click **Edit**
3. Answer IARC questionnaire:
   - **Gambling:** No (no money involved)
   - **Contests/Lotteries:** No
   - **Alcohol/Tobacco/Drugs:** No (food app, not related)
   - **Sexual Content:** No
   - **Violence:** No
   - **Mature Themes:** No
   - **Profanity/Crude Humor:** No
   - **Horror/Scary Themes:** No
   - **Personal Info Collection:** Yes → "In-app purchase information, account information, user contact information, or other information"
     - Explanation: "App collects email and name via Google Sign-in, avatar photo, user-generated meal data"
   - **Selling Physical Goods/Services:** No
   - **Advertising:** No

4. Click **Save**
5. Verify the resulting age rating (should be **4+** or **12+** depending on questionnaire)

**Expected rating for Sofra:** 4+ (food/family app, no objectionable content)

---

## 5. Screenshots & Preview Assets

### Step 5.1: iPhone Screenshots

Requirements:
- Minimum 2, recommended 3–5 screenshots
- Orientation: Portrait or Landscape (choose one, consistent across all)
- Dimensions: Must match one of these (EAS/Xcode will guide you):
  - iPhone 15 Pro Max (6.7"): 1290×2796
  - iPhone 15 (6.1"): 1170×2532
  - iPhone SE (2nd gen, 4.7"): 1125×2436 (shorter, older)
  - Generic 1080×1920 also accepted (16:9 ratio)

**Content for screenshots:**

Screenshot 1: **Onboarding / Sign-in**
- Show login screen
- On-screen text: "Sign in with your Google account"
- Feature text: "Quick setup in seconds"

Screenshot 2: **Household Planning**
- Show household view with weekly plan
- Display dishes for upcoming days
- On-screen text: "Plan meals for the whole family"

Screenshot 3: **Add Meal**
- Show adding a home meal with dish + rating
- Display saved meal in history
- On-screen text: "Log every meal, track favorites"

Screenshot 4: **Insights (Optional)**
- Show charts (Unique Dishes, Most Cooked, Cuisines)
- Display insights summary
- On-screen text: "See what your family loves"

Screenshot 5: **Restaurants / Outside Meals (Optional)**
- Show saved dine-outs
- Display restaurant + dish info
- On-screen text: "Remember meals away from home"

**Design requirements:**
- Use generic test data (same as Android store listing)
- Ensure text is readable on smaller screens
- Use app's actual UI (no mockups or fake screenshots)
- Include brief captions overlaid on each screenshot
- Dark mode optional (but good to show if app supports it)

### Step 5.2: App Preview (Optional)

App Preview = a short video (30 seconds max) of app in action.

- Format: .mov or .mp4
- Max file size: 500MB
- Dimensions: same as screenshots (portrait or landscape)
- Audio: optional (can use background music or voiceover)

**Recommendation for MVP1:** Skip this (not required). Add after launch if you want to.

### Step 5.3: App Icon

- **Size:** 1024×1024 PNG (smallest allowed dimension: 1024px)
- **Format:** square, no rounded corners (App Store applies corners automatically)
- **Content:** use `sofra_icon_512.png` (upscaled to 1024×1024 if needed)

**Avoid:**
- Text smaller than 42px (hard to read at icon size)
- Gradients or very fine details (blur at small sizes)
- Hollow/outlined design (fills with background color)

### Step 5.4: Upload Screenshots to App Store Connect

1. App Store Connect → Your app → **App Preview**
2. Select device type (e.g., "iPhone 6.1-inch" for iPhone 15)
3. Drag-and-drop screenshots in order
4. Add optional preview video
5. Save

---

## 6. App Description, Keywords, Support

### Step 6.1: Subtitle (30 characters max)

Example: "Plan, cook, celebrate"

### Step 6.2: Description (4000 characters max)

Use the same narrative from `/docs/store-listing.md`:

**Example:**
```
Sofra makes family meal planning simple and delightful.

Plan meals for your whole household, track what everyone loves, 
and celebrate the dishes that bring your family together.

Features:
• Build a weekly meal plan from your family's favorites
• Log every meal—home-cooked or restaurants
• See what your family loves most with instant insights
• Manage a shared meal diary with your household
• Private, secure, and free to use

Download Sofra today and bring clarity to your family's table.
```

### Step 6.3: Keywords (100 characters total)

Examples:
```
meal planner, family recipes, dish tracker, meal planning app, kitchen
```

Or:
```
recipes, meal prep, family, food, planning
```

(Choose 5–10 relevant terms, no more than 100 chars total)

### Step 6.4: Support URL (optional)

Example: `https://sofra.savvylabs.dev`

Recommended if you want users to have a place to report issues or find help.

---

## 7. Common App Store Rejection Reasons (iOS 2026)

| Reason | Why It Happens | How to Fix |
|--------|---------------|-----------|
| **Privacy Label mismatch** | App privacy details declare data not actually collected, or vice versa | Audit code vs. declared data types; remove unused SDKs; fix any Firebase collectors |
| **Missing privacy policy URL** | No valid HTTPS privacy policy link | Add working privacy policy URL to app settings |
| **Broken support/privacy links** | Links in app or store listing are dead/404 | Verify all URLs are live + HTTPS |
| **Misleading screenshots** | Screenshots show features not in app, or use fake test data too obviously | Use realistic-looking generic data; match app's actual UI |
| **Missing account deletion** | App collects data but doesn't offer in-app deletion | Sofra has this ✅; verify Settings → Account → Delete Account works |
| **Crash on launch** | App binary crashes when opened (rare if tested) | Test thoroughly on device; verify provisioning certificate |
| **Invalid provisioning certificate** | Code signing fails or certificate expired | Unlikely with EAS; rebuild if needed |
| **Data Safety incomplete** | App Privacy Details section is blank or incomplete | Fill all required fields in Privacy tab |
| **Wrong iOS SDK** | Built with SDK older than Apple's current requirement (iOS 26 as of April 2026) | Rebuild with Xcode 26+; EAS keeps up to date automatically |
| **Unreviewed third-party SDKs** | Firebase or other SDK doesn't have privacy manifest | Rare; update Firebase pods to latest version |

---

## 8. Submission Process

### Step 8.1: Pre-Submission Checklist

Before clicking "Submit for Review," verify:

- ☐ Bundle ID correct: `com.thaliplan.app`
- ☐ App icon uploaded (1024×1024)
- ☐ Screenshots uploaded (minimum 2)
- ☐ Description filled in
- ☐ Privacy Policy URL is valid and loads
- ☐ Support URL filled (optional but recommended)
- ☐ IARC age rating complete (4+, 12+, 17+, etc.)
- ☐ App Privacy Details filled (all data types declared)
- ☐ Pricing set to "Free"
- ☐ Release type set (Automatic or Manual)
- ☐ Build uploaded and processed (status shows "Ready to Submit")

### Step 8.2: Build Status

Before submitting, your build must be processed:

1. Upload .ipa to App Store Connect (via EAS or manual drag-and-drop)
2. Build processing takes 5–15 minutes
3. Status changes from "Processing" → "Ready to Submit" or "Incomplete"
4. If "Incomplete," check for errors and rebuild

### Step 8.3: Submit for Review

1. App Store Connect → Your app → **App Submission**
2. Click **Submit for Review**
3. Verify your contact info for Apple feedback
4. Click **Submit**
5. Status changes to "Waiting for Review"

### Step 8.4: Track Review Status

1. App Store Connect → Your app → **App Review**
2. Status will show: "In Review" → "Approved" or "Rejected"
3. Apple will email you with results

**Average review time:** 24–48 hours
**First-time submissions:** may take 3–5 days

### Step 8.5: If Rejected

If rejected, Apple provides detailed feedback:

1. Read the rejection reason carefully
2. Fix the issue (usually metadata, privacy, or code)
3. Resubmit (no additional fee, no waiting)
4. Repeat until approved

**Most common reason to resubmit:** Privacy Label doesn't match binary.

---

## 9. Post-Approval: Releasing Your App

### Step 9.1: Release Decision

When your app is approved, status shows "Ready to Release."

- **If you selected "Automatically release this version":** app goes live within 1–2 hours automatically
- **If you selected "Manually release this version":** you must click "Release" to make it live

### Step 9.2: Manual Release

1. App Store Connect → Your app → **App Submission**
2. Click **Release**
3. Confirm the date/time
4. Click **Release**
5. Status changes to "Released"

**After release:**
- App is visible on App Store, searchable by name
- Users can download it
- You can see download counts + reviews in **Analytics** tab

---

## 10. TestFlight Beta Distribution (Before Production Release)

### Step 10.1: Internal vs. External Testers

**Internal Testers:**
- People with access to your Apple Developer organization account
- Instant access (no App Review)
- Up to 100 testers
- Good for: team + early friends with Apple Developer accounts

**External Testers:**
- Friends without Apple Developer accounts, via public invite links
- Requires App Review (24–48 hours, same as production)
- Up to 10,000 testers
- Better for: broader feedback before production launch

### Step 10.2: Add Testers

1. App Store Connect → Your app → **TestFlight**
2. Click **Testers & Groups**
3. Click **+ Internal Testers** (or **+ External Testers**)
4. Enter tester email addresses
5. Assign to build
6. Click **Add**

### Step 10.3: Send Invite

1. TestFlight → **Testers & Groups**
2. Click **Internal Testers** (or **External Testers**)
3. Testers see an invite link
4. Copy invite link → share via email/messaging
5. Testers click link → prompted to install TestFlight app → app installs

### Step 10.4: Tester Feedback

Once testers install from TestFlight:

1. They can tap **Send Feedback** in TestFlight app
2. Feedback appears in App Store Connect → TestFlight → **Feedback**
3. They can also crash reports appear here

**For MVP1:** TestFlight is optional; can skip straight to production release if smoke testing passes.

---

## 11. Post-Launch Tasks

### Step 11.1: Update Website

In `docs/index.html`, update the "Get Sofra" button:

From:
```html
<a href="#" class="btn-cta">Coming soon on Google Play</a>
```

To:
```html
<a href="https://apps.apple.com/app/id[YOUR_APP_ID]" class="btn-cta">Get it on the App Store</a>
```

And add Android button if not present:
```html
<a href="https://play.google.com/store/apps/details?id=com.thaliplan.app" class="btn-cta">Get it on Google Play</a>
```

### Step 11.2: Monitor Reviews & Ratings

- App Store Connect → **Ratings and Reviews**
- Read user feedback
- Respond to 1–2 star reviews (Apple lets you reply publicly)
- Use feedback to plan MVP2 improvements

### Step 11.3: Set Up Crash Reporting (Optional)

- App Store Connect → **TestFlight** → **Crashes**
- View crash reports automatically
- Alternative: set up Sentry or Crashlytics for detailed debugging

---

## 12. Differences from Android (Play Store)

| Aspect | Android (Play Store) | iOS (App Store) |
|--------|---------------------|-----------------|
| **Account** | Google Play Developer ($25, one-time) | Apple Developer ($99/year) |
| **Build tool** | EAS Build (same) | EAS Build (same) |
| **Signing** | EAS managed (upload key + Play App Signing) | EAS managed (distribution certificate + provisioning) |
| **Provisioning** | Automatic via Play App Signing | Manual (provisioning profiles) |
| **Testing distribution** | Google Play internal (instant, 100 testers) | TestFlight (instant internal, 24h external) |
| **Privacy form** | Google Play Data Safety (optional fields) | Apple Privacy Nutrition Label (mandatory, strict) |
| **Account deletion** | Must provide URL | Must provide in-app deletion (✅ Sofra has this) |
| **Content rating** | Play content rating | IARC questionnaire |
| **Review time** | 4–8 hours typical | 24–48 hours typical |
| **Review strictness** | Moderate | Strict (especially privacy/SDK manifests) |
| **Rejection reason #1** | Malicious behavior, policy violations | Privacy Label mismatch |
| **Screenshots** | Landscape (2:1 ratio) | Portrait (2:3 ratio) |
| **Metadata limits** | Description: 4000 chars | Description: 4000 chars |

---

## 13. Privacy Verification Checklist

Before submitting to App Store:

- ☐ Firebase Analytics enabled? If yes, declare in Privacy Label. If no, remove SDK.
- ☐ Firebase Crashlytics enabled? If yes, declare in Privacy Label. If no, remove SDK.
- ☐ Sentry or Crashlytics? If yes, declare crash data. If no, don't declare.
- ☐ AdMob or ads? If yes, declare advertising data. If no, don't declare.
- ☐ Google Sign-in? If yes, declare email + name. ✅ Sofra uses this.
- ☐ Avatar upload? If yes, declare photos. ✅ Sofra uses this.
- ☐ Firestore user content? If yes, declare "User Content". ✅ Sofra logs meals.
- ☐ Account deletion path? If yes, link to it in Privacy Label. ✅ Sofra has Settings → Account → Delete Account.
- ☐ No "Data not collected" if any of the above are true.
- ☐ Privacy policy URL works (HTTPS, no 404).

---

## Sources

- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [App Privacy Nutrition Label - Apple Developer](https://developer.apple.com/app-store/app-privacy-details/)
- [User Privacy and Data Use - Apple App Store](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- [IARC Content Rating System](https://www.globalratings.com/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [TestFlight Overview](https://help.apple.com/testflight/)
- [Common App Store Rejection Reasons 2026](https://appfollow.io/blog/app-store-review-guidelines)
