# Sofra — iOS Firebase Setup (Deep Dive)

This document covers iOS-specific Firebase configuration in detail. iOS Firebase setup differs significantly from Android, particularly around URL schemes, provisioning, and the absence of SHA-1 fingerprints.

**Prerequisite:** You've already set up Firebase project `thaliplan` with Android. Now we're adding iOS to the same project.

---

## 1. Register iOS App in Firebase Console

### Step 1.1: Add iOS App to Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project `thaliplan`
3. Click **Project Settings** (gear icon, top-left)
4. Click **+ Add App** → iOS
5. Fill in the form:
   - **Bundle ID:** `com.thaliplan.app` (must match your Xcode/app.json value exactly)
   - **App nickname:** "Sofra" (just for display in Firebase console)
   - **App Store ID:** leave blank (only fill if app already exists on App Store)
   - **Xcode managed:** leave unchecked (Expo/EAS manages this)
6. Click **Register app**

### Step 1.2: Download GoogleService-Info.plist

1. Firebase console will generate and offer to download `GoogleService-Info.plist`
2. Download the file
3. **Critical:** keep this file safe; it contains your Firebase project credentials
4. Add to version control `.gitignore` (it's environment-specific):
   ```
   ios/GoogleService-Info.plist
   ```
5. Place the file at: **`ios/GoogleService-Info.plist`** (must be in this exact location)
6. **Do NOT check into git** (unless your project is private and you trust all contributors)

### Step 1.3: Verify GoogleService-Info.plist Contents

Open the downloaded `GoogleService-Info.plist` in a text editor (or Xcode). You should see:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>BUNDLE_ID</key>
  <string>com.thaliplan.app</string>
  <key>CLIENT_ID</key>
  <string>YOUR_CLIENT_ID.apps.googleusercontent.com</string>
  <key>REVERSED_CLIENT_ID</key>
  <string>com.googleusercontent.apps.YOUR_CLIENT_ID</string>
  <key>API_KEY</key>
  <string>YOUR_API_KEY</string>
  <key>GCM_SENDER_ID</key>
  <string>YOUR_SENDER_ID</string>
  <key>PROJECT_ID</key>
  <string>thaliplan</string>
  ...
</dict>
</plist>
```

**Key fields to verify:**
- `BUNDLE_ID` = `com.thaliplan.app` (exact match)
- `CLIENT_ID` = Google OAuth client ID (used by Firebase SDK)
- `REVERSED_CLIENT_ID` = **this is critical for Google Sign-in** (URL scheme format)
- `API_KEY` = Firebase API key (public, non-secret)
- `GCM_SENDER_ID` = Google Cloud Messaging sender ID (for push notifications)

---

## 2. Google Sign-In iOS Configuration

### Step 2.1: Get the REVERSED_CLIENT_ID

From the `GoogleService-Info.plist` file, find and copy the value of the `REVERSED_CLIENT_ID` key.

Example: `com.googleusercontent.apps.123456789-abcdefg.apps.googleusercontent.com`

This is your **URL scheme** for iOS. It's the Apple-specific way Google Sign-in works on iOS.

### Step 2.2: Add URL Scheme to app.json

In your Expo `app.json`, you must add this URL scheme. The method depends on which Google Sign-in library you're using:

#### Option A: Using `@react-native-google-signin/google-signin` (Recommended)

Add to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.YOUR_CLIENT_ID.apps.googleusercontent.com"
        }
      ]
    ]
  }
}
```

Replace `YOUR_CLIENT_ID` with the actual value from REVERSED_CLIENT_ID.

#### Option B: Using `expo-app-search` or Manual Info.plist

If using a different library, add URL type manually to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "infoPlist": {
              "CFBundleURLTypes": [
                {
                  "CFBundleURLSchemes": ["com.googleusercontent.apps.YOUR_CLIENT_ID.apps.googleusercontent.com"]
                }
              ]
            }
          }
        }
      ]
    ]
  }
}
```

**Important:** Make sure this is added BEFORE building, as Expo bakes this into `ios/Sofra/Info.plist` during the build process.

### Step 2.3: Verify URL Scheme After Build

After you build with `eas build -p ios --profile production`, you can verify the URL scheme was added:

1. Download the signed .ipa from EAS
2. Unzip it: `unzip app.ipa`
3. Navigate to: `Payload/Sofra.app/Info.plist`
4. Open in a text editor and search for `CFBundleURLSchemes` or `CFBundleURLTypes`
5. Should contain your reversed client ID:
   ```
   <array>
     <string>com.googleusercontent.apps....</string>
   </array>
   ```

If the URL scheme is missing → Google Sign-in will crash or hang when triggered.

---

## 3. Firebase Authentication Setup

### Step 3.1: Enable Google Provider in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com) → your project
2. Navigate to **Authentication** → **Sign-in methods**
3. Find **Google** in the list
4. Click the toggle to **Enable**
5. Verify it shows "Enabled" with a green checkmark

### Step 3.2: iOS-Specific Auth Configuration

You typically don't need to add anything else for Google Sign-in on iOS once the URL scheme is in place. However, if you're also using Email/Password auth:

1. Enable **Email/Password** in Sign-in methods (if not already enabled)
2. No iOS-specific configuration needed for email/password

### Step 3.3: Verify Firebase App Registration

Back in **Project Settings** → your iOS app, verify:
- Bundle ID matches exactly: `com.thaliplan.app`
- App certificate is listed (EAS manages this; you'll see it after first build)
- App name shows correctly

---

## 4. React Native Firebase Installation

### Step 4.1: Verify Dependencies

Check that your `package.json` has:

```json
{
  "react-native-firebase": "^21.0.0",
  "@react-native-firebase/app": "^21.0.0",
  "@react-native-firebase/auth": "^21.0.0",
  "@react-native-firebase/firestore": "^21.0.0",
  "@react-native-firebase/storage": "^21.0.0"
}
```

(Exact versions may vary; the important thing is they're all present.)

If any are missing, add them:

```bash
npm install react-native-firebase @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage
```

### Step 4.2: CocoaPods Installation (Mac-Only)

**Note:** This step happens automatically when you run `eas build -p ios`. You only need to do this locally if you're building on Mac with Xcode.

Navigate to your iOS directory and install pods:

```bash
cd ios
pod install --repo-update
```

**What pod install does:**
- Reads `Podfile` (generated by EAS Build)
- Downloads Firebase SDK pods (Core, Auth, Firestore, Storage)
- Links them to your Expo app
- Creates `.xcworkspace` file (required for Xcode after this point)

**Important:** After running `pod install`, use `ios/Sofra.xcworkspace` in Xcode, NOT `ios/Sofra.xcodeproj`.

### Step 4.3: Common CocoaPods Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| Pod cache stale | `pod install` takes forever or fails | Run `pod repo update`, then try again |
| Firebase pod conflicts | Build error: `use_frameworks!` + React-Core-prebuilt | Use `expo-build-properties` to pin Firebase version (see section 5 below) |
| Missing `.xcworkspace` | Xcode shows "Sofra" project but no pods | Run `pod install` from ios/ directory |
| CocoaPods not installed | Error: `command not found: pod` | Run `sudo gem install cocoapods` |

---

## 5. EAS Build Configuration for iOS

### Step 5.1: eas.json iOS Profiles

Add iOS-specific build profiles to your `eas.json`:

```json
{
  "cli": {
    "version": ">= 20.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "ios": {
        "distribution": "internal",
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "buildType": "app-store"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "sameerrajwade@gmail.com",
        "appleIdPassword": "@env APPLE_ID_PASSWORD",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./play-service-account.json",
        "track": "internal",
        "releaseStatus": "draft"
      }
    }
  }
}
```

**Key settings:**
- `preview.ios.distribution: "internal"` → uses ad-hoc provisioning (for friends)
- `preview.ios.simulator: false` → builds for physical device
- `production.ios.buildType: "app-store"` → builds for App Store submission
- `submit.ios.appleId` → your Apple ID (leave as environment variable for security)
- `submit.ios.appleTeamId` → optional; EAS can auto-detect if you have one Apple Developer account

### Step 5.2: Handling Firebase Pod Version Conflicts (Rare but Critical)

If you encounter build errors related to Firebase pods (e.g., `use_frameworks!` conflicts with React-Core-prebuilt), use `expo-build-properties`:

Add to `app.json`:

```json
{
  "plugins": [
    [
      "expo-build-properties",
      {
        "ios": {
          "deploymentTarget": "14.0",
          "useFrameworks": "static"
        }
      }
    ]
  ]
}
```

And/or pin Firebase version in a custom Podfile via `expo-build-properties`:

```json
{
  "plugins": [
    [
      "expo-build-properties",
      {
        "ios": {
          "modifyPods": ["Firebase/Core==9.6.0"]
        }
      }
    ]
  ]
}
```

---

## 6. Testing Firebase Connection Locally

### Step 6.1: Build Locally (Mac with Xcode Required)

If you have a Mac with Xcode installed:

```bash
eas build -p ios --profile preview --local
```

This builds the .ipa locally, same as a cloud build but faster for iteration.

### Step 6.2: Test on Simulator

```bash
xcrun simctl boot "iPhone 15"
xcrun simctl install booted path/to/app.ipa
open -a Simulator
```

Simulator testing can verify:
- App launches
- No obvious crashes
- UI renders

But simulator tests DON'T verify:
- Real device hardware interactions (camera, push notifications, etc.)
- Production provisioning certificate (simulator uses a dev cert)
- URL scheme registration (simulator may not enforce this)

### Step 6.3: Test on Real Device

1. Register device UDID via `eas device:create`
2. Wait 24–72 hours for Apple provisioning
3. Build ad-hoc: `eas build -p ios --profile preview`
4. Install on device (via Xcode or Apple Configurator)
5. Run through full smoke test:
   - Launch app
   - Google Sign-in (verify popup appears, login works)
   - Create household
   - Log meal (home + dine-out)
   - Generate plan
   - Insights
   - Avatar upload
   - Account deletion

---

## 7. Troubleshooting Firebase iOS Issues

### Issue: "Unknown error" when signing in with Google

**Possible causes:**
1. REVERSED_CLIENT_ID URL scheme missing from Info.plist
2. Bundle ID mismatch (GoogleService-Info.plist vs. app.json)
3. Google provider not enabled in Firebase console

**How to debug:**
- Check Xcode console for Firebase errors
- Verify URL scheme is in Info.plist (see step 2.3)
- Verify bundle ID in Firebase console matches app.json
- Verify Google is enabled in Firebase Authentication sign-in methods

**Fix:**
- Rebuild with corrected app.json
- Re-download GoogleService-Info.plist if bundle ID was wrong

---

### Issue: Google Sign-in popup appears but doesn't close after login

**Possible cause:** URL scheme is wrong or not registered.

**How to debug:**
- Verify REVERSED_CLIENT_ID value in GoogleService-Info.plist
- Check that URL scheme in Info.plist matches exactly
- Check Xcode console for `openURL` or scheme-related errors

**Fix:**
- Compare GoogleService-Info.plist REVERSED_CLIENT_ID with Info.plist CFBundleURLSchemes
- They should match exactly
- Rebuild + reinstall

---

### Issue: Firestore reads work but writes fail silently

**Possible cause:** Security rules are rejecting writes (common in dev mode).

**How to debug:**
- Check Firestore console → Database → Firestore → check security rules
- Enable console logging in your Firebase setup: `firebase.firestore().enableLogging(true)`
- Check browser/app console for error messages

**Fix:**
- Verify Firestore security rules are deployed (see `/docs/firestore-rules.ts`)
- Check that user is authenticated (`firebase.auth().currentUser` is not null)
- Verify data matches the schema (no `undefined` values)

---

### Issue: Avatar upload fails or hangs

**Possible cause:** Firebase Storage rules are rejecting the upload, or the file is too large.

**How to debug:**
- Check Storage console → Firebase → check rules
- Monitor network requests in app (see if upload request completes)
- Check app console for error messages

**Fix:**
- Verify Storage rules allow authenticated users to upload (see `/docs/storage-rules.ts`)
- Verify image is < 1MB (app should crop/downscale; check `src/hooks/useAvatarUpload.ts`)
- Test with a small image (100KB) first

---

### Issue: Build fails with "REVERSED_CLIENT_ID not found"

**Possible cause:** GoogleService-Info.plist is missing or malformed.

**How to debug:**
- Check `ios/GoogleService-Info.plist` exists
- Open the file and search for `REVERSED_CLIENT_ID`
- If not found, re-download from Firebase console

**Fix:**
- Re-download GoogleService-Info.plist from Firebase console
- Place at `ios/GoogleService-Info.plist`
- Rebuild

---

### Issue: CocoaPods error during EAS Build

**Symptom:** EAS build fails with `pod: command not found` or CocoaPods version error.

**Possible cause:** EAS is using an outdated CocoaPods cache.

**Fix:**
- Run `eas build --clean`
- Rebuild: `eas build -p ios --profile production`

---

## 8. Security Best Practices for iOS Firebase

1. **GoogleService-Info.plist:** Add to `.gitignore`; store in secure environment if needed.
2. **API Keys:** GoogleService-Info.plist contains public API key; this is expected. Restrict it in Firebase console via API restrictions.
3. **Security Rules:** Always use proper Firestore + Storage security rules; don't rely on client-side checks.
4. **App Check (Optional):** Enable Firebase App Check for production to prevent abuse (requires iOS 14+).
5. **No hardcoded secrets:** Never embed credentials in app code; use Firebase Auth for user secrets.

---

## 9. Verification Checklist (Before Submitting to App Store)

- ☐ GoogleService-Info.plist placed at `ios/GoogleService-Info.plist`
- ☐ Bundle ID in GoogleService-Info.plist matches `com.thaliplan.app`
- ☐ REVERSED_CLIENT_ID from GoogleService-Info.plist added to app.json URL schemes
- ☐ Google provider enabled in Firebase console → Authentication → Sign-in methods
- ☐ Google Sign-in works on real device (not just simulator)
- ☐ Firestore reads/writes work on real device
- ☐ Storage avatar upload works on real device
- ☐ Account deletion deletes all user data from Firestore + Storage
- ☐ No "Unknown error" or silent failures during sign-in
- ☐ EAS build succeeds with production profile
- ☐ .ipa is signed correctly (can install on test device)

---

## Sources

- [Add Firebase to your Apple project](https://firebase.google.com/docs/ios/setup)
- [Authenticate Using Google Sign-In on Apple Platforms](https://firebase.google.com/docs/auth/ios/google-signin)
- [React Native Firebase - Installation (iOS)](https://rnfirebase.io/auth/usage)
- [Expo app.json configuration](https://docs.expo.dev/config/app/)
- [EAS Build iOS documentation](https://docs.expo.dev/build/introduction/)
