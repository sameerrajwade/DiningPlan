# Sofra iOS Deployment — Complete Summary

**Status:** Ready to begin iOS deployment (Android Play Store deployment completed and verified).

**Target:** Ship Sofra iOS to App Store via TestFlight or direct production submission.

**Timeline:** 2–4 weeks from start to live on App Store (assuming no major rejections).

---

## Documents Created

This research generated **4 comprehensive guides** in your `/docs` directory:

1. **`ios-deploy-checklist.md`** (100+ lines)
   - Step-by-step deployment from zero to TestFlight
   - A–R sections covering every phase
   - Includes Sameer's launch sequence

2. **`ios-firebase-setup.md`** (350+ lines)
   - Deep-dive Firebase iOS SDK setup
   - GoogleService-Info.plist configuration
   - URL schemes for Google Sign-in
   - Troubleshooting guide for silent Firebase failures

3. **`ios-appstore-submission.md`** (400+ lines)
   - App Store Connect metadata setup
   - App Privacy Details (Nutrition Label) — critical for 2026
   - Screenshots, description, keywords
   - Common rejection reasons
   - TestFlight beta distribution

4. **`ios-quick-ref.md`** (200+ lines)
   - One-page quick lookup guide
   - Command cheat sheet
   - Pre-testing checklist
   - Silent failure points
   - Common error messages

---

## iOS vs. Android: The Key Differences

| Aspect | Android (Done ✅) | iOS (To Do) | Why Different |
|--------|------------------|----------|---|
| **Account** | Google Play ($25 one-time) | Apple Developer ($99/year) | Different stores, different fees |
| **Signing** | EAS managed (same as iOS) | EAS managed (same as Android) | Both use cloud signing; approach is identical |
| **Provisioning** | Play App Signing (Apple abstracts) | Provisioning profiles (manual, device-specific) | iOS requires device UDIDs for testing; Android doesn't |
| **Firebase config file** | `google-services.json` in android/ | `GoogleService-Info.plist` in ios/ | Different formats for different platforms |
| **Google Sign-in setup** | SHA-1 fingerprints added to Firebase | URL schemes + REVERSED_CLIENT_ID in Info.plist | iOS doesn't use SHA-1; uses URL callbacks instead |
| **Testing distribution** | Google Play internal (instant, 100 testers) | TestFlight (instant internal, 24h external) | Different distribution mechanisms |
| **Privacy disclosure** | Google Play Data Safety (simpler) | Apple Privacy Nutrition Label (stricter, mandatory) | Apple enforces stricter privacy compliance in 2026 |
| **Account deletion** | Must provide URL link | Must provide in-app deletion | iOS requires in-app, not just link to privacy policy |
| **Content rating** | Play content rating | IARC questionnaire | Different rating systems |
| **Review time** | 4–8 hours (faster) | 24–48 hours (slower) | Apple reviews manually more carefully |
| **Rejection #1** | Malicious behavior | Privacy Label mismatch | Different strict points |

**Bottom line:** iOS deployment is NOT just Android ported to iOS. Three major differences:
1. URL schemes + provisioning profiles are iOS-specific
2. Privacy compliance is stricter and mandatory
3. No SHA-1 fingerprints; uses REVERSED_CLIENT_ID instead

---

## Critical Setup Sequence (0 to TestFlight)

```
Week 1:
  Day 1: Enroll Apple Developer Program ($99/year)
  Day 2: Create App ID + app in App Store Connect
  Day 3: Register iOS app in Firebase console
  Day 3: Download GoogleService-Info.plist → place at ios/
  Day 4: Verify GoogleService-Info.plist bundle ID correct
  Day 4: Add REVERSED_CLIENT_ID to app.json URL schemes
  Day 5: Run eas build:configure -p ios (first time setup)
  Day 5: Run eas build -p ios --profile preview (test build)
  
Week 2:
  Day 6–7: Smoke test on real device (full sequence from checklist)
  Day 8: Fix any Firebase/sign-in issues
  Day 9: Build production: eas build -p ios --profile production
  Day 10: Upload to TestFlight or App Store Connect
  
Week 3:
  Day 11–14: Distribute to internal testers (or external with 24h wait)
  Day 15–21: Collect feedback, fix any issues
  Day 21: Submit for App Review (if skipping TestFlight)
  
Week 4:
  Day 22–24: Monitor App Review status
  Day 24–28: Apple Review (average 24–48h)
  Day 28: Approve + Release
  Day 28: Update website with App Store link
```

---

## What Breaks Silently (No Error Message)

These are **CRITICAL** — they break with no obvious error; you'll only discover the issue at runtime:

1. **GoogleService-Info.plist bundle ID wrong** → Firebase auth appears to work, but fails after authentication
2. **REVERSED_CLIENT_ID URL scheme missing** → Google Sign-in popup appears, user taps it, nothing happens or popup doesn't close
3. **URL scheme doesn't match REVERSED_CLIENT_ID exactly** → Sign-in hangs or crashes without a visible error message
4. **Google provider not enabled in Firebase Console** → Sign-in button works, but authentication fails with generic "Unknown error"
5. **Firestore security rules wrong** → App reads data fine but writes fail with no error message
6. **Storage permissions wrong** → Avatar upload silently hangs forever
7. **Firebase Analytics SDK included but not initialized** → Privacy Label says "Analytics: Yes" but app never collects it → App Review rejection
8. **App crashes on real device but works on simulator** → Provisioning certificate issue (unlikely with EAS, but possible)

**Mitigation:** Follow the pre-testing checklist in `/docs/ios-deploy-checklist.md` Section I. Test EVERY single one of those steps before giving to friends.

---

## What Breaks Loudly (Build Errors)

These produce clear error messages you can fix:

1. **GoogleService-Info.plist missing** → Build fails: "GoogleService-Info.plist not found"
2. **Bundle ID mismatch** → Build fails: "Bundle ID mismatch"
3. **Provisioning profile invalid** → Build fails: "No provisioning profile found" (EAS regenerates automatically)
4. **Firebase pod version conflict** → Build fails: "use_frameworks conflict" (rare, fixable via expo-build-properties)
5. **Xcode SDK too old** → Build fails: "SDK version too old" (EAS auto-updates, unlikely to happen)
6. **CocoaPods stale** → Build fails: "Pod not found" (run `pod repo update`)

**Mitigation:** EAS handles most of this automatically. If you get a build error, it's usually fixable by rebuilding or fixing the app.json config.

---

## Pre-Testing Verification Checklist (Do This Before Friends Test)

Run this on a real iOS device (not simulator):

1. ✓ Open app — no crash
2. ✓ Sign in with Google — popup appears, login works, app returns
3. ✓ Create household — household name loads
4. ✓ Log home meal — saves without error
5. ✓ Log dine-out — restaurant + dish save without error
6. ✓ Generate plan — shows dishes, accept button works
7. ✓ Insights — charts load, date picker works
8. ✓ Avatar upload — photo saves and displays
9. ✓ Delete account — works, app logs out, data deleted
10. ✓ Xcode console — no Firebase errors, no crashes

**If any step fails:** Debug and fix BEFORE distributing to friends. See troubleshooting in `/docs/ios-firebase-setup.md`.

---

## App Privacy Requirements (Critical for 2026)

Apple's **App Privacy Nutrition Label** is MANDATORY and STRICTLY ENFORCED. Mismatch = automatic rejection.

**Sofra must declare:**
- Email (linked to user) — Google Sign-in
- Name (linked to user) — Google profile
- User IDs (linked to user) — Firebase
- Meals/dishes (linked to user) — user content
- Photos (linked to user) — avatar upload
- Encryption in transit: Yes (Firebase uses HTTPS)
- User deletion: Yes (in-app via Settings → Account → Delete Account)

**Sofra must NOT declare:**
- Analytics data (not collected)
- Crash reports (not collected)
- Advertising data (not in MVP1)
- Location data (not collected)

**Before submission:** Audit code to verify no unused Firebase SDKs that would falsify privacy label.

---

## Pre-App Store Submission Checklist

Before clicking "Submit for Review" in App Store Connect:

- ☐ App name: "Sofra"
- ☐ Subtitle: "Plan, cook, celebrate"
- ☐ Description: filled (from store-listing.md)
- ☐ Keywords: meal planner, recipes, family, etc.
- ☐ Category: Food & Drink
- ☐ Privacy Policy URL: https://sofra.savvylabs.dev/privacy.html (working HTTPS link)
- ☐ Support URL: https://sofra.savvaylabs.dev (working HTTPS link)
- ☐ App Icon: 1024×1024 PNG
- ☐ Screenshots: 3–5 images, clear and readable
- ☐ App Privacy Details: complete + accurate
- ☐ IARC age rating: 4+ (most likely)
- ☐ Build uploaded and processed ("Ready to Submit")
- ☐ Release type: Automatic or Manual (your choice)

---

## Common App Store Rejections (iOS 2026)

| Rank | Reason | Impact | How to Prevent |
|------|--------|--------|----------------|
| #1 | Privacy Label mismatch | Automatic rejection | Audit code; remove unused SDKs; declare only data actually collected |
| #2 | Broken support/privacy URL | Automatic rejection | Test all URLs are HTTPS + respond with 200 |
| #3 | Missing in-app account deletion | Automatic rejection | Sofra has Settings → Account → Delete Account ✅ |
| #4 | Misleading screenshots | Manual review rejection | Use realistic generic data; match app's actual UI |
| #5 | App crashes on launch | Manual review rejection | Test on real device before submission |

---

## Sameer's iOS Launch Sequence (Simplified)

```bash
# Step 1: One-time setup
npm i -g eas-cli
eas login
eas build:configure -p ios

# Step 2: Prepare Firebase
# (Download GoogleService-Info.plist, place at ios/, verify bundle ID)

# Step 3: Test build
eas build -p ios --profile preview
# (Install on real device, run smoke test)

# Step 4: Production build
eas build -p ios --profile production

# Step 5: App Store setup
# (Create app in App Store Connect, fill metadata + privacy label, upload build)

# Step 6: Submit for review
# (Click "Submit for Review" in App Store Connect)

# Step 7: Monitor & launch
# (Wait 24–48h for review, click "Release" when approved)
```

---

## Estimated Costs

| Item | Cost | Notes |
|------|------|-------|
| Apple Developer Program | $99/year | Required; one-time enrollment |
| iPhone for testing | $0–1000 | Optional; can use simulator for basic testing |
| Xcode (Mac required) | $0 | Free; requires Mac hardware |
| Firebase (Sofra's use) | $0 | Within free tier; no charges for MVP1 |
| **Total (bare minimum)** | **$99/year** | Just Apple Developer account |

---

## Key Files & URLs

**Your project:**
- `/docs/ios-deploy-checklist.md` — full deployment guide
- `/docs/ios-firebase-setup.md` — Firebase iOS configuration
- `/docs/ios-appstore-submission.md` — App Store submission
- `/docs/ios-quick-ref.md` — quick reference
- `app.json` — Expo config (add URL schemes here)
- `eas.json` — EAS Build config (add iOS profiles here)
- `ios/GoogleService-Info.plist` — Firebase iOS config (place file here after download)

**Official documentation:**
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- [Firebase Google Sign-in for iOS](https://firebase.google.com/docs/auth/ios/google-signin)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [App Privacy Nutrition Label](https://developer.apple.com/app-store/app-privacy-details/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

## FAQ

### Q: Do I need a Mac to build iOS?
**A:** For production builds, no — EAS builds in the cloud. For local testing/iteration, yes — Xcode is Mac-only.

### Q: Do I need to generate certificates manually?
**A:** No — EAS handles everything if you select "Let EAS Build manage signing credentials."

### Q: Can I skip TestFlight and go straight to App Store?
**A:** Yes. TestFlight is optional; go straight to production submission if you've thoroughly tested locally.

### Q: How long does App Review take?
**A:** 24–48 hours typical; first submission may take 3–5 days. Can be faster (same day) or slower (up to 2 weeks) in edge cases.

### Q: What if my app is rejected?
**A:** Apple provides detailed feedback. Fix the issue (usually metadata or privacy label) and resubmit. No additional fee.

### Q: How do I update the app after launch?
**A:** Upload new build in App Store Connect, increment build number, resubmit for review (same process, ~24–48h).

### Q: Can I distribute to friends without App Store?
**A:** Yes, via TestFlight (easiest) or ad-hoc distribution (requires device UDIDs). See `/docs/ios-deploy-checklist.md` Section D.

### Q: Is Firebase different on iOS vs. Android?
**A:** Same backend; different client SDK. iOS setup is more involved (URL schemes, provisioning profiles, GoogleService-Info.plist).

### Q: What if Google Sign-in doesn't work on iOS?
**A:** Most common cause: URL scheme missing or wrong. See `/docs/ios-firebase-setup.md` Section 7 troubleshooting.

---

## Next Steps

1. **Read** `/docs/ios-deploy-checklist.md` completely (30 min)
2. **Enroll** Apple Developer Program ($99)
3. **Create** App ID + app in App Store Connect
4. **Download** GoogleService-Info.plist from Firebase
5. **Place** at `ios/GoogleService-Info.plist`
6. **Verify** app.json has URL schemes configured
7. **Run** `eas build:configure -p ios` (one-time setup)
8. **Build** preview: `eas build -p ios --profile preview`
9. **Test** on real device (full checklist from `/docs/ios-deploy-checklist.md` Section I)
10. **Build** production: `eas build -p ios --profile production`
11. **Submit** to App Store Connect
12. **Monitor** App Review status
13. **Release** when approved
14. **Update** website with App Store link

---

## Support

For issues or questions:
- Check the relevant guide (`ios-deploy-checklist.md`, `ios-firebase-setup.md`, `ios-appstore-submission.md`, `ios-quick-ref.md`)
- Search for error message in the troubleshooting section
- Consult official Expo + Firebase + Apple documentation
- Verify against the pre-testing checklist before involving testers

---

**Good luck! iOS deployment is complex but well-documented. Follow the guides step-by-step, test thoroughly before distributing to friends, and you'll have Sofra on the App Store within 2–4 weeks.**
