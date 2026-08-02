# Sofra — iOS Deployment Quick Reference

Fast lookup guide for iOS deployment. See full guides for details: `/docs/ios-deploy-checklist.md`, `/docs/ios-firebase-setup.md`, `/docs/ios-appstore-submission.md`.

---

## Command Cheat Sheet

```bash
# One-time setup
npm i -g eas-cli
eas login  # Expo account
eas build:configure -p ios  # First iOS build

# Build for testing (ad-hoc)
eas build -p ios --profile preview

# Build for App Store (production)
eas build -p ios --profile production

# List registered test devices
eas device:list

# Register a new test device
eas device:create

# Remove a test device
eas device:delete [device-id]

# Local build on Mac
eas build -p ios --profile preview --local

# Submit to TestFlight (if configured in eas.json)
eas submit -p ios --profile production
```

---

## Key File Locations

| File | Purpose |
|------|---------|
| `ios/GoogleService-Info.plist` | Firebase iOS configuration (place here after download) |
| `app.json` | Expo config; add URL schemes for Google Sign-in here |
| `eas.json` | EAS Build + submit profiles |
| `docs/ios-deploy-checklist.md` | Full iOS deployment guide |
| `docs/ios-firebase-setup.md` | Deep-dive Firebase iOS setup |
| `docs/ios-appstore-submission.md` | App Store metadata & privacy requirements |

---

## Critical Values for Sofra

| Key | Value |
|-----|-------|
| **Bundle ID** | `com.thaliplan.app` |
| **App Name (Store)** | Sofra |
| **Category** | Food & Drink |
| **Package/Team ID** | Your Apple Developer Team ID (if org account) |
| **Min iOS Version** | iOS 14.0+ |
| **Firebase Project** | `thaliplan` |
| **Privacy Policy URL** | https://sofra.savvylabs.dev/privacy.html |

---

## Pre-Testing Verification (Before Friends Test)

**Run this sequence on a real iOS device (not simulator):**

```
1. Open app → verify no crash on launch
2. Tap "Sign in with Google"
   ✓ Google login popup appears
   ✓ Can complete sign-in
   ✓ Returns to app (no hang or error)
3. Create/join household
   ✓ Household name loads
4. Log a home meal
   ✓ Saves without error
5. Log a dine-out
   ✓ Saves restaurant + dish without error
6. Generate plan
   ✓ Shows dishes from past week
   ✓ Accept button saves plan
7. Go to Insights
   ✓ Charts load (Unique Dishes, Most Cooked, Cuisines)
   ✓ "Today" date picker works
8. Upload avatar
   ✓ Select photo from library
   ✓ Photo saves and displays in profile
9. Delete account
   ✓ Settings → Account → Delete Account
   ✓ App logs out, returns to login
   ✓ Sign in again → account deleted (clean state)
10. Check Xcode console
   ✓ No Firebase errors
   ✓ No URL scheme errors
   ✓ No crashes or warnings related to Firebase
```

**If ANY step fails:** DO NOT distribute to friends. Debug and fix (see troubleshooting sections in full guides).

---

## Silent Failure Points (What Breaks Without Error Messages)

| Problem | Symptom | Fix |
|---------|---------|-----|
| GoogleService-Info.plist missing | Firebase reads/writes fail silently | Place file at `ios/GoogleService-Info.plist` |
| REVERSED_CLIENT_ID wrong | Google Sign-in popup appears but doesn't close | Verify value in Info.plist matches GoogleService-Info.plist |
| Bundle ID mismatch | Firebase auth silently fails | Check GoogleService-Info.plist, app.json, Firebase console (all must match) |
| URL scheme not in Info.plist | Google Sign-in crashes when tapped | Verify app.json plugin has correct URL scheme |
| Firestore rules wrong | Reads work, writes silently fail | Check Firestore security rules deployed |
| Storage permissions wrong | Avatar upload hangs or fails | Check Storage rules allow authenticated user uploads |

---

## Deployment Timeline

| Step | Time | Notes |
|------|------|-------|
| Apple Developer enrollment | 1 day | Need Apple ID + payment method |
| App creation in App Store Connect | 15 min | Instant |
| Firebase iOS app registration | 5 min | Instant |
| GoogleService-Info.plist download | 2 min | Instant |
| eas build:configure (first time) | 5 min | Prompts for Apple ID login |
| First production build | 15–20 min | Cloud build, slower first time |
| Subsequent builds | 5–10 min | Reuse credentials |
| TestFlight processing | 5–15 min | Before testers can install |
| Internal TestFlight distribution | instant | Testers get access immediately |
| External TestFlight distribution | 24–48 hours | Requires App Review |
| App Store submission review | 24–48 hours | First submission may take 3–5 days |
| Post-approval release | 1–2 hours | After you click "Release" |

---

## App Store Submission Checklist (Final)

Before clicking "Submit for Review" in App Store Connect:

**Metadata:**
- ☐ App Name: "Sofra"
- ☐ Subtitle: "Plan, cook, celebrate" (30 chars max)
- ☐ Description: filled (from `docs/store-listing.md`)
- ☐ Keywords: meal planner, family, recipes, etc.
- ☐ Category: Food & Drink
- ☐ Privacy Policy URL: https://sofra.savvylabs.dev/privacy.html (HTTPS, working link)
- ☐ Support URL: https://sofra.savvylabs.dev (optional but recommended)

**Assets:**
- ☐ App Icon: 1024×1024 PNG
- ☐ Screenshots: 2–5 images, clear and readable
- ☐ Preview video: optional, skip for MVP1

**Privacy:**
- ☐ App Privacy Details complete (all data types declared)
  - Email: Yes, linked to user
  - Name: Yes, linked to user
  - Photos: Yes, linked to user
  - User Content (meals): Yes, linked to user
  - Analytics: No (not collected)
  - Crash logs: No (not collected)
  - Ads: No (not in MVP1)
- ☐ User deletion path: yes → "Settings → Account → Delete Account"
- ☐ No data type declared that isn't actually collected

**Content Rating:**
- ☐ IARC questionnaire complete
- ☐ Age rating assigned (should be 4+)

**Release:**
- ☐ Build uploaded and processed ("Ready to Submit" status)
- ☐ Release type set (Automatic or Manual)

---

## Common Error Messages & Fixes

| Error Message | Cause | Fix |
|---------------|-------|-----|
| **"Bundle ID does not match"** | app.json ≠ Firebase console ≠ App Store Connect | Verify all three have `com.thaliplan.app` |
| **"Unknown error" on Google Sign-in** | URL scheme wrong or missing | Check app.json plugin + Info.plist + GoogleService-Info.plist REVERSED_CLIENT_ID |
| **Build fails: "GoogleService-Info.plist not found"** | File not at `ios/GoogleService-Info.plist` | Download from Firebase, place in ios/ directory |
| **Build fails: "use_frameworks conflict"** | Firebase pod + React-Core conflict (rare) | Use expo-build-properties to pin versions |
| **"App crashed on launch"** | Provisioning certificate issue or missing framework | Rebuild with EAS; verify certificate in Firebase console |
| **App Review rejection: "Privacy Label mismatch"** | Declared data not actually collected or vice versa | Audit app code vs. declared data; remove unused SDKs |
| **App Review rejection: "Broken support URL"** | Privacy Policy or support URL is 404 | Test all URLs are HTTPS and respond with 200 status |
| **TestFlight external testers see "Not Available"** | External TestFlight requires App Review, still pending | Wait for App Review to complete (24–48h) |

---

## Firebase iOS Verification Checklist

Before building:

- ☐ GoogleService-Info.plist downloaded from Firebase console
- ☐ GoogleService-Info.plist placed at `ios/GoogleService-Info.plist`
- ☐ Bundle ID in GoogleService-Info.plist = `com.thaliplan.app`
- ☐ REVERSED_CLIENT_ID value from GoogleService-Info.plist
- ☐ REVERSED_CLIENT_ID added to app.json plugin config:
  ```json
  {
    "plugins": [
      ["@react-native-google-signin/google-signin", {
        "iosUrlScheme": "[REVERSED_CLIENT_ID]"
      }]
    ]
  }
  ```
- ☐ Google provider enabled in Firebase Console → Authentication → Sign-in methods
- ☐ Firestore security rules deployed to `thaliplan` project (see `/src/firebase/rules`)
- ☐ Storage security rules deployed to `thaliplan` project

---

## TestFlight vs. Production Build Differences

| Aspect | TestFlight (Preview) | Production (App Store) |
|--------|---------------------|------------------------|
| **Distribution** | `"internal"` | `"app-store"` |
| **Provisioning** | Ad-hoc (device UDIDs) | App Store provisioning |
| **Device support** | Only registered UDIDs | All iOS 14+ devices |
| **Update mechanism** | Tester installs via TestFlight | Users get via App Store |
| **Review gate** | Internal: instant, External: 24h | 24–48 hours (standard) |
| **Rebuild for new devices** | Yes (must regenerate profile) | No (goes to all devices) |

---

## Privacy Data Declaration for Sofra

**Declared in App Privacy Nutrition Label:**
- Email (linked to user) — Google Sign-in
- Name (linked to user) — Google profile
- User IDs (linked to user) — Firebase user ID
- Meals & dishes (linked to user) — user-generated content
- Photos/Avatar (linked to user) — avatar upload

**NOT declared (not collected):**
- Location data
- Health & fitness data
- Financial & payment info
- Advertising data
- Analytics/usage data
- Crash reports

---

## Post-Launch

After app launches on App Store:

1. **Update website** — change "Get Sofra" button to App Store link
2. **Monitor reviews** — check App Store → Ratings & Reviews weekly
3. **Track installs** — App Store Connect → Analytics → Install Trends
4. **Respond to feedback** — reply to 1–2 star reviews publicly
5. **Plan MVP2** — use feedback to prioritize next features

---

## Need Help?

- **EAS Build errors:** See `/docs/ios-deploy-checklist.md` Section A–F
- **Firebase setup issues:** See `/docs/ios-firebase-setup.md` Sections 1–7
- **App Store rejection:** See `/docs/ios-appstore-submission.md` Section 7
- **Privacy Label questions:** See `/docs/ios-appstore-submission.md` Section 3
- **General questions:** Consult Expo docs and Firebase docs (links in full guides)

---

## Key Docs

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- [Firebase Google Sign-in for iOS](https://firebase.google.com/docs/auth/ios/google-signin)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Privacy Nutrition Label](https://developer.apple.com/app-store/app-privacy-details/)
