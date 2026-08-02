# Firebase Auth email templates — branding (Sameer console task)

These are **console settings**, not code. Firebase sends the verification + reset
emails; we can brand the *name, subject, and body* but (on Path A) the From-address
stays a Firebase domain. A fully custom `sofra-registration@…` sender needs the
Path B backend + a domain you own (deferred).

## Where
Firebase Console → project **thaliplan** → **Authentication** → **Templates** tab.

## 1. Sender name (applies to all templates)
- **Sender name:** `Sofra`
- Leave the From-address as the default `noreply@thaliplan.firebaseapp.com`
  (customizing the domain requires domain verification — skip for now).

## 2. Email address verification template
- **Subject:** `Confirm your Sofra account`
- **Body (edit the message; keep the %LINK% action):**
  ```
  Welcome to Sofra!

  Tap the link below to confirm this is your email address and finish
  setting up your account:

  %LINK%

  If you didn't create a Sofra account, you can ignore this email.

  — The Sofra team
  This is an automated message from an unmonitored address — please don't reply.
  ```

## 3. Password reset template
- **Subject:** `Reset your Sofra password`
- **Body:**
  ```
  We received a request to reset the password for your Sofra account.

  Tap the link below to choose a new password:

  %LINK%

  If you didn't request this, you can safely ignore this email — your
  password won't change.

  — The Sofra team
  This is an automated message from an unmonitored address — please don't reply.
  ```

## Notes
- Firebase renders `%LINK%` / `%APP_NAME%` placeholders — keep `%LINK%` intact.
- The reset link opens a **Firebase-hosted page** (Path A). That's expected.
- After editing, send yourself a test from an **email/password** test account (a
  Google-signed-in account has no password → no reset email; that was the earlier
  "nothing arrived" symptom).
