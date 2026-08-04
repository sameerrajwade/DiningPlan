# Sofra — iOS App Store Deploy Checklist

Goal: ship Sofra iOS to the Apple App Store via TestFlight. App is feature-complete for MVP1 on iOS; this is the release/compliance mile. 

**Status legend:** ☐ todo · ◐ in progress · ✅ done · 🔒 Sameer-only (Apple account/signing/uploads).

**Package id / Bundle ID:** `com.thaliplan.app` (Firebase-linked, same as Android — must NOT change).

**Site:** https://sofra.savvylabs.dev (privacy + terms live here, same as Android).

**Key difference from Android:** iOS uses Apple Developer Program ($99/year), App Store Connect (not Play Console), provisioning profiles + distribution certificates, and has stricter privacy/SDK requirements.

---

## A. Apple Developer Account & App Store Connect Setup

- 🔒 **Enroll in Apple Developer Program** ($99/year, personal or organization). Need a valid Apple ID and payment method.
- 🔒 **Verify Apple Developer account identity** (likely automatic for existing accounts; new accounts may require review).
- 🔒 **Create App ID / Bundle ID in Apple Developer Portal:**
  - Navigate to Certificates, Identifiers & Profiles → Identifiers → + → App IDs
  - Bundle ID: `com.thaliplan.app`
  - Capabilities: enable Push Notifications (for local notifications), Sign in with Apple (optional but recommended for privacy)
- 🔒 **Create app in App Store Connect:**
  - Log into App Store Connect (https://appstoreconnect.apple.com)
  - Create new app → select iOS platform
  - Bundle ID: `com.thaliplan.app`
  - App Name: "Sofra"
  - Primary Language: English
  - Category: Food & Drink
  - User Account Type: Organization or Personal (affects testing gate; see B.4)
- ☐ **Set up signing credentials (EAS managed recommended):**
  - Run `eas build:configure -p ios` on first iOS build
  - Select "Lets EAS Build manage signing credentials" (recommended, same pattern as Android)
  - EAS will prompt for Apple ID login → authenticates and stores credentials
  - **DO NOT manually generate or manage certificates/provisioning profiles** (EAS handles this)

---

## B. Firebase iOS SDK Setup (CRITICAL — different from Android)

- ☐ **Register iOS app in Firebase console:**
  - Go to Firebase console → your `thaliplan` project → Project Settings
  - Click "+ Add app" → iOS
  - Bundle ID: `com.thaliplan.app` (exact match)
  - iOS App Name: "Sofra" (descriptive only)
  - App Store ID: leave blank (only for existing App Store apps; fill after launch)
  - Xcode Managed (optional): leave unchecked
  - Download `GoogleService-Info.plist` (contains API keys + client IDs)
- ☐ **Add GoogleService-Info.plist to Expo project:**
  - Place file at: `ios/GoogleService-Info.plist` (NOT in `app.json` — it's a native iOS file)
  - Ensure it's in `.gitignore` (contains non-secret but environment-specific config)
  - EAS will include it automatically in builds
- ☐ **Verify GoogleService-Info.plist contents:**
  - Should contain: `CLIENT_ID`, `REVERSED_CLIENT_ID`, `API_KEY`, `BUNDLE_ID` (matching `com.thaliplan.app`)
  - Common mistake: bundle ID mismatch → Firebase auth silently fails
- ☐ **Configure Xcode URL schemes for Google Sign-in (CRITICAL):**
  - In Firebase console, download a fresh `GoogleService-Info.plist`
  - Open `GoogleService-Info.plist` (in text editor) and find the `REVERSED_CLIENT_ID` value (looks like `com.googleusercontent.apps.XXXXXXXXX.apps.googleusercontent.com`)
  - This must be added to your Expo app's Info.plist (which EAS builds from `app.json`)
  - In your `app.json`, under `"plugins": []`, ensure the `expo-app-search-plugin` or equivalent includes this URL scheme
  - **Better approach:** use `expo-google-sign-in` or `@react-native-google-signin/google-signin` package config
  - Add to `app.json`:
    ```json
    {
      "plugins": [
        [
          "@react-native-google-signin/google-signin",
          {
            "iosUrlScheme": "[REVERSED_CLIENT_ID from GoogleService-Info.plist]"
          }
        ]
      ]
    }
    ```
  - Without this, Google Sign-in will crash or silently fail on iOS
- ☐ **Enable Google Sign-in provider in Firebase Console:**
  - Go to Firebase console → Authentication → Sign-in methods
  - Enable "Google" provider
  - Verify that a Web SDK configuration also exists (for website, if applicable)
- ☐ **(Optional but recommended) Enable Firebase App Check:**
  - Provides abuse protection for Firestore, Storage, and Auth
  - Set up App Attest (iOS native attestation provider)
  - Configure in Firebase console → App Check
  - Add to `app.json` plugin config if using expo-build-properties
  - **Note:** skip this for MVP1 if timeline is tight; can add post-launch

---

## C. React Native Firebase & Build Configuration

- ✅ **Dependencies already present** (verify with `npm ls react-native-firebase`):
  - `react-native-firebase` (core)
  - `@react-native-firebase/auth` (Google Sign-in)
  - `@react-native-firebase/firestore` (database)
  - `@react-native-firebase/storage` (avatar upload)
- ☐ **Ensure build.gradle uses eas.json (no local keystore):**
  - `android/app/build.gradle` should NOT hardcode signing config for release builds
  - EAS will inject signing during cloud build
- ☐ **Create eas.json iOS profiles** (if not already present):
  - Production build profile (for App Store submission):
    ```json
    {
      "build": {
        "production": {
          "ios": {
            "buildType": "app-store"
          },
          "autoIncrement": true,
          "appVersionSource": "remote"
        }
      }
    }
    ```
  - Internal distribution profile (for TestFlight before public launch):
    ```json
    {
      "build": {
        "preview": {
          "ios": {
            "distribution": "internal",
            "buildType": "simulator"
          }
        }
      }
    }
    ```
  - **Note:** EAS v5.13+ unifies iOS & Android `eas.json` structure
- ☐ **Verify eas.json has submit profile for TestFlight:**
  - Add submit configuration (optional; can also submit via App Store Connect manually):
    ```json
    {
      "submit": {
        "production": {
          "ios": {
            "appleId": "[Sameer's Apple ID email]",
            "appleIdPassword": "@env APPLE_PASSWORD",
            "appleTeamId": "[team ID from Apple Developer Portal]",
            "bundleIdentifier": "com.thaliplan.app"
          }
        }
      }
    }
    ```
  - **SAFER ALTERNATIVE:** submit manually via App Store Connect; avoids handling passwords in environment

---

## D. Device Registration & Testing (Ad-Hoc Distribution)

- ☐ **Determine testing strategy:**
  - **Option 1 - TestFlight (recommended):** use App Store's built-in beta testing → friends install via TestFlight app
  - **Option 2 - Ad-Hoc:** use internal distribution → manual UDID registration, rebuild required for new devices
  - **Option 3 - Simulator:** for basic smoke tests on your Mac (no iOS device needed for initial testing)
- ☐ **If using ad-hoc distribution for friends:**
  - Collect device UDIDs from each tester (Settings → General → About → Identifier, or via iTunes)
  - Register each UDID:
    ```bash
    eas device:create
    ```
  - EAS will prompt for UDID, device name, and platform (iOS)
  - View registered devices:
    ```bash
    eas device:list
    ```
  - **Important:** Apple takes 24–72 hours to provision new devices; can't immediately rebuild
  - Each new device requires a new build (provisioning profile must be regenerated with updated UDID list)
- ☐ **If using TestFlight (simpler for friends):**
  - Skip device registration
  - Build once for App Store
  - Add testers in App Store Connect → TestFlight → Testers & Groups
  - Send invite links to friends → they install via TestFlight app
  - No UDID collection or rebuilding needed

---

## E. Build & Signing

- ☐ **Ensure app.json has minimal iOS config:**
  - `bundleIdentifier: "com.thaliplan.app"`
  - `buildNumber: "1"` (increment for each new build)
  - Plugins for Google Sign-in, app search, etc.
- ☐ **Run eas build for iOS:**
  ```bash
  npm i -g eas-cli  # if needed
  eas login         # authenticate with Expo account
  eas build -p ios --profile production
  ```
  - EAS will:
    - Prompt for Apple ID login (first time only)
    - Generate distribution certificate (if needed)
    - Generate App Store provisioning profile (if needed)
    - Build .ipa on EAS cloud servers
    - Download signed .ipa or upload directly to App Store Connect (if configured)
- ☐ **Capture the build output:**
  - Note the build ID and download link
  - .ipa file is the signed iOS app (equivalent to .aab on Android)
- ☐ **Verify no build errors related to:**
  - Missing GoogleService-Info.plist → **HARD ERROR** (build fails)
  - Bundle ID mismatch → **HARD ERROR**
  - Provisioning profile invalid → **HARD ERROR** (EAS regenerates automatically)
  - `use_frameworks!` conflicts with Firebase pods (Expo SDK 55+ known issue) → **HARD ERROR** on build, fixable via expo-build-properties

---

## F. Firebase iOS Configuration Verification

**⚠️ This is where Android & iOS diverge most. iOS has multiple silent failure points.**

- ☐ **Add GoogleService-Info.plist SHA-1 to Firebase Console:**
  - iOS doesn't use SHA-1 fingerprints like Android
  - Instead: GoogleService-Info.plist bundle ID + client IDs must match exactly
  - **Verify in Firebase console → Your iOS app → App Settings:**
    - Bundle ID: `com.thaliplan.app`
    - App ID Prefix: (auto-generated from your Apple Developer account)
    - Client ID: copied from GoogleService-Info.plist
  - If mismatched, Firebase Auth silently fails (you won't see errors until runtime)
- ☐ **Add REVERSED_CLIENT_ID URL scheme to Info.plist:**
  - Already configured in `app.json` plugin config (step B above)
  - At build time, EAS generates `ios/Sofra/Info.plist` with URL Types section containing the reversed client ID
  - **Verify after build:** download .ipa, unzip, navigate to `Payload/Sofra.app/Info.plist`, search for `CFBundleURLSchemes` → should contain your reversed client ID
  - If missing → Google Sign-in crashes when triggered
- ☐ **Test Firebase connectivity (before TestFlight):**
  - Build a preview build locally or via EAS
  - Install on simulator or device
  - Run app → attempt Google Sign-in
  - Should see Google login popup (not crash or silent error)
  - Verify login works → user data loads from Firestore
  - **If it fails silently:** check bundle ID + GoogleService-Info.plist + REVERSED_CLIENT_ID URL scheme

---

## G. App Store Connect Setup & Metadata

- 🔒 **Fill out App Store Connect app info:**
  - Privacy Policy URL: `https://sofra.savvylabs.dev/privacy.html`
  - Support URL: `https://sofra.savvylabs.dev` or leave blank if no support email
  - License Agreement: leave blank (Apple default)
- ☐ **Add app icon & metadata:**
  - App Icon: 1024×1024 PNG (use `sofra_icon_512.png` → upscale to 1024×1024 if needed)
  - App Category: Food & Drink (same as Android)
  - Subtitle: "Family meal planning" (optional, max 30 chars)
  - Content Rating: fill IARC questionnaire
    - Content rating authority: IARC
    - Select "Food & Drink" category
    - No objectionable content → likely Everyone rating (same as Android)
  - Ratings & Reviews: enable (default)
- ☐ **Fill App Privacy Details (Nutrition Label):**
  - **Critical requirement** — Apple enforces this strictly in 2026
  - Declare all data collected:
    - **Collected by app:** Email (for sign-in), Name (from Google profile), User-generated content (meals/dishes), Photos (avatar)
    - **Linked to user:** Yes (email, name, avatar photo are linked to Firebase Auth user)
    - **Used for tracking:** No (Sofra does not track users across apps/websites)
  - Encryption in transit: Yes (Firebase uses HTTPS)
  - User deletion path: In-app via Settings → Account → Delete Account (already implemented ✅)
  - **Common rejection reason:** if Privacy Label says "No data collected" but Firebase Analytics is enabled → rejected
- ☐ **Verify data practices match implementation:**
  - If using Firebase Analytics → declare analytics data collection
  - If using Firebase Crashlytics → declare crash logs
  - If using only Firestore + Storage + Auth → declare only email, name, user content, photos
  - Mismatch = App Store rejection (high severity in 2026)

---

## H. Store Listing Assets (Screenshots & Graphics)

- ✅ **App Icon:** 1024×1024 PNG (same as Android, upscaled from `sofra_icon_512.png`)
- ✅ **Feature Graphic (iPhone 6s Plus or similar ratio 2:3):**
  - iOS uses a different aspect ratio than Android (2:3 vs 16:9)
  - Create a 1080×1620 or similar portrait image
  - Reuse `sofra_feature.png` aesthetic (terracotta/sage/cream) but portrait orientation
  - Or upload 3–5 app screenshots in sequence (more common for iOS)
- ✅ **Phone Screenshots:** 3–5 images, one per screen/feature
  - Dimensions for iPhone models (pick one):
    - iPhone 15 Pro Max: 1290×2796 (6.7")
    - iPhone 15: 1170×2532 (6.1")
    - iPhone 13/14: 1170×2532 (6.1")
    - Or use a generic template (e.g., 1080×1920 portrait)
  - Content: use generic data (same as Android store listing)
    - Screen 1: login / sign-up flow
    - Screen 2: household / weekly plan
    - Screen 3: add meal / insights
    - Screen 4: (optional) restaurants / dish library
    - Screen 5: (optional) account settings / privacy
  - Embed a brief descriptive text on each (e.g., "Plan meals for your family" on screen 1)
- ☐ **App Preview (video, optional):**
  - iOS supports a 30-second promotional video (not required)
  - Can use one of the 20-second brand-commercial briefs from `docs/video-prompts.md`
  - Format: .mov, .mp4; max 500MB; landscape or portrait
- ☐ **Description text:**
  - Use text from `docs/store-listing.md` (same as Android)
  - Subtitle: "Plan, cook, celebrate" (max 30 chars for iOS)
  - Full description: same 2–3 paragraph narrative (slightly different character limits on iOS)

---

## I. Pre-TestFlight Smoke Test (On Simulator or Device)

**⚠️ CRITICAL: iOS smoke tests MUST verify what Android could silently break on. Run all tests before inviting friends.**

- ☐ **Build for simulator (optional, fast):**
  ```bash
  eas build -p ios --profile preview --output app.ipa
  xcrun simctl boot "iPhone 15"
  xcrun simctl install booted app.ipa
  ```
  - Or build via Xcode: `eas build -p ios --local` (requires Mac with Xcode)
- ☐ **Build for device (if available):**
  - Register device UDID (via `eas device:create`)
  - Wait 24–72 hours for Apple provisioning
  - Build ad-hoc: `eas build -p ios --profile preview`
  - Install via manual Xcode workflow or Apple Configurator
- ☐ **Test sequence (do ALL of these):**
  1. **Launch app:** verify it opens, no crash
  2. **Google Sign-in:**
     - Tap "Sign in with Google"
     - Should see Google login popup (NOT app crash, NOT "URL error")
     - Complete sign-in
     - Verify you're logged in (user info appears, Settings shows email)
     - If this fails silently → check GoogleService-Info.plist + REVERSED_CLIENT_ID
  3. **Household:**
     - Create/join household
     - Verify household name loads
  4. **Add meal (local):**
     - Log a home meal with a dish, rating, timestamp
     - Verify it saves (no Firestore error)
  5. **Add meal (dine-out):**
     - Log a dine-out/takeout with restaurant + dish
     - Verify it saves (this is the #1 crash in Android — test thoroughly)
  6. **Generate plan:**
     - Tap "Generate plan"
     - Verify plan appears with dishes from the past week
     - Tap "Accept" → verify it saves
  7. **Insights:**
     - Verify charts load (Unique Dishes, Most Cooked, Cuisine Breakdown)
     - Verify "Today" date picker works
     - Verify "Outside Meals" card shows restaurants
  8. **Avatar upload:**
     - Go to Settings → Profile
     - Upload a photo (test with a small image, <1MB)
     - Verify it saves + displays
     - Test with a large image (>1MB) → should crop/scale down
  9. **Account deletion:**
     - Go to Settings → Account → Delete Account
     - Confirm deletion
     - Verify app logs out, shows login screen
     - Sign in again (with same Google account) → should have clean state (no old meals)
  10. **Notifications (optional but recommended):**
      - Grant notification permission when prompted
      - Schedule a meal for tomorrow
      - Wait for local notification to fire (may require closing/reopening app)
- ☐ **Verify no crashes in Console:**
  - Check Xcode console or device console for Firebase errors, URL scheme errors, or crashes
  - Look for:
    - `REVERSED_CLIENT_ID` errors → URL scheme issue
    - `BUNDLE_ID_MISMATCH` → GoogleService-Info.plist issue
    - `NSURLError` or networking errors → Firebase connectivity issue
    - Unrecognized selector / type errors → dependency version mismatch

---

## J. TestFlight Distribution (To Friends)

- 🔒 **Build for App Store:**
  ```bash
  eas build -p ios --profile production
  ```
  - EAS outputs a signed .ipa ready for App Store submission
  - Download .ipa or let EAS upload directly (requires App Store Connect auth)
- 🔒 **Upload to App Store Connect:**
  - Option A (automatic): EAS submits directly if `submit.production.ios` is configured in eas.json
  - Option B (manual):
    - Download .ipa from EAS
    - Open App Store Connect
    - Navigate to your app → TestFlight → Builds → "+ iOS Build"
    - Drag-and-drop .ipa or use "Choose Files"
    - Wait for processing (5–15 minutes)
    - Once processed, add Internal Testers or External Testers
- ☐ **Configure TestFlight testers:**
  - Internal Testers: add via email (friends with access to your organization account)
    - Instant access, no review wait
    - Can invite up to 100 internal testers
  - External Testers: invite via email link
    - Requires App Review (24–48 hours, same as production)
    - Better for friends outside your organization
  - **Recommended for MVP1:** use Internal Testers if friends can be added to your Apple Developer organization; otherwise External (with review wait)
- ☐ **Send invite to testers:**
  - Generate TestFlight invite link
  - Share via email or messaging
  - Testers click link → install TestFlight app → see your beta app
  - Testers install Sofra → run through same smoke test sequence
- ☐ **Collect feedback:**
  - Testers can submit crash reports + feedback in TestFlight
  - Monitor in App Store Connect → TestFlight → Feedback

---

## K. App Store Submission & Review

**Note:** TestFlight is optional; you can go straight to production after smoke testing.

- ☐ **Verify all metadata is complete:**
  - App name, subtitle, description, keywords
  - Screenshots (3–5), icon, feature graphic
  - Privacy Policy URL
  - Privacy Nutrition Label (all data types declared)
  - Content rating (IARC)
  - Support email (optional but recommended)
- ☐ **Set release type:**
  - Version Release: "Automatically release this version"
  - OR "Manually release this version" (to control exact launch date)
  - Recommendation: "Manually release" so Sameer can check App Review completion first
- ☐ **Submit for App Review:**
  - App Store Connect → your app → Prepare for Submission
  - Review all sections (Availability, Pricing, App Information, etc.)
  - Click "Submit for Review"
  - Average review time: 24–48 hours; first submission may take 3–5 days
- ☐ **Monitor App Review:**
  - Check status in App Store Connect → App Review
  - Apple will email if rejected (common reasons below)
  - If rejected, fix issues + resubmit (no additional review fee)
- ☐ **Common rejection reasons (iOS-specific):**
  - **Privacy Label doesn't match binary:** declared data collection but Analytics/Crashlytics isn't enabled, OR enabled but not declared
  - **Missing account deletion:** app collects user data but doesn't offer in-app deletion (Sofra has this ✅)
  - **Broken links:** privacy policy, support URL, or URLs in app description don't load
  - **Metadata issues:** misleading screenshots, incomplete description, or category mismatch
  - **SDK manifest violations:** Firebase, AdMob, Adjust, etc. don't have privacy manifests (usually auto-included in recent pods)
  - **Crash on launch:** rare if tested properly; usually provisioning profile or certificate issue
- ☐ **If approved:**
  - Manually release version (if you selected "Manually release" above)
  - App goes live within 1–2 hours
  - Visible on App Store, searchable by name

---

## L. Pre-Launch Verification Checklist (Before Giving to Friends)

**DO NOT share with friends until all of these pass:**

- ☐ Google Sign-in works (not crashing, not silently failing)
- ☐ Household creation/join works
- ☐ Meal logging works (both home + dine-out)
- ☐ Plan generation works + accepts meal
- ☐ Insights charts load + show correct data
- ☐ Avatar upload works (photo saves + displays)
- ☐ Account deletion works (account + all data deleted, app logs out)
- ☐ No crashes or errors in console
- ☐ App store metadata complete + accurate
- ☐ Privacy Nutrition Label matches what app actually collects
- ☐ Notification permissions requested + local notifications fire (if implemented)
- ☐ Runs on at least one real iOS device (not just simulator)

---

## M. Common iOS Gotchas (vs. Android)

| Issue | Android | iOS | How to Spot | Fix |
|-------|---------|-----|-------------|-----|
| **Silent Firebase auth failure** | Happens if SHA-1 missing | Happens if REVERSED_CLIENT_ID URL scheme or GoogleService-Info.plist bundle ID wrong | Sign-in button appears, user taps it, nothing happens (or popup appears but doesn't close after sign-in) | Verify URL scheme in Info.plist + bundle ID match + GoogleService-Info.plist in ios/ |
| **GoogleService-Info.plist missing** | Would need google-services.json in android/app/ | Must be in ios/ directory, not bundled in app.json | Hard build error (EAS fails) | Add GoogleService-Info.plist to ios/ before building |
| **Keystore password handling** | Sameer must handle password | EAS manages all certificates/profiles, no password needed | N/A | Use EAS managed credentials (don't manually create certs) |
| **Provisioning profile mismatch** | Play App Signing abstracts this | Must match bundle ID + distribution type (ad-hoc vs app-store) | Hard build error or installation fails | EAS regenerates automatically; verify bundle ID is correct |
| **SDK/Pod version conflicts** | Rare; Gradle manages versions | Firebase pod + React Native Expo SDK can conflict (use_frameworks issue) | Build fails with React-Core-prebuilt error | Pin Firebase version in Podfile or use expo-build-properties |
| **URL scheme not in Info.plist** | N/A | Required for Google Sign-in callback | Sign-in crashes or hangs | Add REVERSED_CLIENT_ID to Info.plist via app.json plugin |
| **Privacy Label contradicts binary** | Play Data Safety form is simpler | Apple's Nutrition Label strictly checked; declared data must be collected by app | App Review rejection | Audit app code vs. declared data types; remove unused SDKs |
| **App crashes on device but not simulator** | Rare | Can happen if certificate/provisioning profile is device-specific | Simulator works, device crashes on launch | Rebuild with proper provisioning profile; verify UDID match |
| **TestFlight review vs. production review** | N/A | TestFlight External Testers require App Review before external people can test | External testers wait 24–48h even before production | Use Internal Testers for faster feedback, or submit straight to production |
| **Bundle ID appears in 3+ places** | Package ID in android/app/build.gradle + google-services.json | Bundle ID in app.json + Info.plist + Firebase console + Apple Developer Portal | Silent failures or "Unknown app" errors | Use eas.json + app.json as source of truth; EAS propagates to all places |

---

## N. Sameer's iOS Launch Sequence (EAS Managed, TestFlight Path)

1. **Setup (one-time):**
   ```bash
   npm i -g eas-cli
   eas login  # Expo account (free)
   eas build:configure -p ios  # First time only, EAS stores Apple ID login
   ```

2. **Firebase setup:**
   - Register iOS app in Firebase console (bundle ID: `com.thaliplan.app`)
   - Download GoogleService-Info.plist → place at `ios/GoogleService-Info.plist`
   - Verify REVERSED_CLIENT_ID is in app.json plugin config

3. **Build for production:**
   ```bash
   eas build -p ios --profile production
   ```
   - EAS generates distribution certificate + App Store provisioning profile
   - Builds .ipa on cloud, downloads or auto-uploads to App Store Connect
   - Note: first build takes ~15–20 min; subsequent ~5–10 min

4. **TestFlight setup (optional, for friends):**
   - App Store Connect → your app → TestFlight → Builds → add Internal/External Testers
   - Share TestFlight invite links → friends install via TestFlight app

5. **Smoke test on real device:**
   - Sign in → household → log meal → plan → insights → delete account
   - Verify no crashes, Firebase works, privacy label matches

6. **App Store submission:**
   - Complete metadata (description, screenshots, privacy URL, privacy label)
   - App Store Connect → Prepare for Submission → Submit for Review
   - Wait 24–48 hours for App Review

7. **Post-launch:**
   - Release version (if "Manually release" was selected)
   - Update website `#get` button to link to App Store URL

---

## O. Differences from Android Path (Already Completed)

| Step | Android | iOS |
|------|---------|-----|
| **Build tool** | EAS Build | EAS Build (same CLI, different config) |
| **Signing** | EAS managed (upload key) + Play App Signing | EAS managed (distribution certificate + provisioning profile) |
| **Account** | Google Play Developer ($25, 1-time) | Apple Developer Program ($99/year) |
| **SHA-1 fingerprints** | Add upload-key + Play App Signing SHA-1 to Firebase | No SHA-1; verify GoogleService-Info.plist + REVERSED_CLIENT_ID URL scheme |
| **Firebase config file** | google-services.json in android/app/ | GoogleService-Info.plist in ios/ |
| **Google Sign-in setup** | Simpler (uses SHA-1) | More complex (URL schemes, reversed client ID, Info.plist) |
| **Testing distribution** | Google Play internal testing (instant, up to 100) | TestFlight (instant for internal, 24–48h for external) |
| **Store listing** | Play Console → 1024×500 feature graphic + screenshots | App Store Connect → portrait screenshots + icon |
| **Privacy form** | Google Play Data Safety (simpler, optional fields) | Apple Privacy Nutrition Label (mandatory, stricter enforcement) |
| **Account deletion** | Must provide deletion URL | Must provide in-app deletion (already implemented ✅) |
| **App Review time** | Faster (~4–8 hours) | Slower (~24–48 hours, can be 3–5 days for first submission) |
| **Common rejections** | Missing SHA-1, broken links | Privacy Label mismatch, missing URL scheme, broken support links |
| **eas.json config** | `buildType: app-bundle`, `submit.track: internal` | `buildType: app-store`, Apple ID in submit config |

---

## P. Critical Gotchas — What Breaks Silently

1. **GoogleService-Info.plist bundle ID wrong** → Firebase initializes but auth fails silently
2. **REVERSED_CLIENT_ID not in URL schemes** → Google Sign-in popup appears but doesn't close after login
3. **Privacy Label declares data not actually collected** → App Review rejection
4. **Missing support URL or broken privacy link** → App Review rejection
5. **Firebase Analytics enabled but not declared in Privacy Label** → App Review rejection
6. **App crashes on device but not simulator** → Usually provisioning profile UDID mismatch (unlikely if using EAS)
7. **Xcode SDK 26 requirement (April 2026+)** → Builds fail if using older Xcode; EAS stays updated

---

## Q. What I (Claude) Can Still Do Without Console Access

- ✅ Verify eas.json iOS profiles are correct
- ✅ Review app.json Google Sign-in plugin config
- ✅ Generate iOS-portrait-orientation app screenshots/feature graphics
- ✅ Refine store listing copy for iOS (different character limits)
- ✅ Create a pre-TestFlight testing checklist specific to Firebase
- ✅ Audit Privacy Nutrition Label data types vs. app code

---

## R. Next Steps (Sameer's To-Do)

1. Enroll in Apple Developer Program ($99/year) + create Apple ID for app signing
2. Create App ID + app in App Store Connect (bundle ID: com.thaliplan.app)
3. Download GoogleService-Info.plist from Firebase console → place at `ios/GoogleService-Info.plist`
4. Run `eas build:configure -p ios` (first time only)
5. Run `eas build -p ios --profile production` → get signed .ipa
6. Test on simulator or device (full smoke test from section I)
7. Upload .ipa to App Store Connect / TestFlight
8. Complete app metadata + privacy label
9. Submit for App Review
10. Monitor status + respond to any feedback
11. Release when approved

---

## Sources & Official Docs

- [EAS Build - Expo Documentation](https://docs.expo.dev/build/introduction/)
- [Internal Distribution - Expo Documentation](https://docs.expo.dev/build/internal-distribution/)
- [App Credentials for iOS - Expo Documentation](https://docs.expo.dev/app-signing/app-credentials/)
- [Authenticate Using Google Sign-In on Apple Platforms - Firebase](https://firebase.google.com/docs/auth/ios/google-signin)
- [Add Firebase to your Apple project - Firebase](https://firebase.google.com/docs/ios/setup)
- [User Privacy and Data Use - Apple App Store](https://developer.apple.com/app-store/user-privacy-and-data-use/)
- [App Privacy Details - Apple Developer](https://developer.apple.com/app-store/app-privacy-details/)
- [Firebase App Check with App Attest - Firebase](https://firebase.google.com/docs/app-check/ios/app-attest-provider)
- [React Native Google Sign In - iOS Setup Guide](https://react-native-google-signin.github.io/docs/setting-up/ios)
