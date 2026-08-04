import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { auth } from '../config/firebase';

GoogleSignin.configure({
  webClientId: '349329204088-6d984s5kj2sbnngtth6567cib4e846di.apps.googleusercontent.com',
  // iOS-only OAuth client (from thaliplan Firebase iOS app). Android ignores this and
  // uses webClientId + the SHA-1-registered Android client, so this is Android-neutral.
  iosClientId: '349329204088-nmihufdrn14vsqikc5tpotqf37otvaui.apps.googleusercontent.com',
});

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
): Promise<FirebaseUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  // Send the verification link immediately. The app gates entry on emailVerified
  // (see VerifyEmailScreen), so a new email/password account must confirm first.
  // Google accounts arrive pre-verified and skip this path entirely.
  try {
    await sendEmailVerification(credential.user);
  } catch {
    // Non-fatal (e.g. rate-limited). User can tap "Resend" on the verify screen.
  }
  return credential.user;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInWithGoogle(): Promise<FirebaseUser> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const signInResult = await GoogleSignin.signIn();
  const idToken = signInResult.data?.idToken;
  if (!idToken) {
    throw new Error('Google sign-in failed: no ID token returned');
  }
  const googleCredential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, googleCredential);
  return userCredential.user;
}

// Native Sign in with Apple (iOS only). Apple requires this whenever a third-party
// social login (Google) is offered — App Store guideline 4.8. Firebase verifies the
// identity token against a SHA-256 nonce, so we generate a raw nonce, hand Apple the
// hashed nonce, and hand Firebase the raw one. Apple returns the user's name ONLY on
// the very first authorization, so we persist it to the Firebase displayName then.
export async function signInWithApple(): Promise<FirebaseUser> {
  // Random raw nonce; hashed copy goes to Apple to bind the token to this request.
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  const { identityToken, fullName } = appleCredential;
  if (!identityToken) {
    throw new Error('Apple sign-in failed: no identity token returned');
  }

  const provider = new OAuthProvider('apple.com');
  const firebaseCredential = provider.credential({
    idToken: identityToken,
    rawNonce,
  });
  const userCredential = await signInWithCredential(auth, firebaseCredential);

  // First-run only: Apple gives the name once. Firebase seeds displayName from the
  // token as "" for Apple, so set it if we have a name and none is stored yet.
  const displayName = [fullName?.givenName, fullName?.familyName]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (displayName && !userCredential.user.displayName) {
    try {
      await updateProfile(userCredential.user, { displayName });
    } catch {
      // Non-fatal — profile row falls back to the email prefix.
    }
  }

  return userCredential.user;
}

// Whether Sign in with Apple is available (iOS 13+ real devices/simulators).
export async function isAppleSignInAvailable(): Promise<boolean> {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
  try {
    await GoogleSignin.signOut();
  } catch {
    // Google sign-out may fail if user didn't sign in with Google
  }
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// Re-sends the verification link to the currently signed-in user.
export async function resendVerificationEmail(): Promise<void> {
  if (auth.currentUser) await sendEmailVerification(auth.currentUser);
}

// Reloads the current user from Firebase and returns whether the email is now
// verified. Firebase does NOT push emailVerified changes via onAuthStateChanged,
// so the verify screen calls this after the user clicks the link.
export async function refreshEmailVerified(): Promise<boolean> {
  if (!auth.currentUser) return false;
  await reload(auth.currentUser);
  return auth.currentUser.emailVerified;
}

// Deletes the Firebase Auth user. May throw 'auth/requires-recent-login' if the
// session is old — caller should surface a "sign in again" message.
export async function deleteCurrentUser(): Promise<void> {
  const current = auth.currentUser;
  if (!current) return;
  await current.delete();
  try {
    await GoogleSignin.signOut();
  } catch {
    // ignore
  }
}

export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

export function onAuthStateChanged(
  callback: (user: FirebaseUser | null) => void,
): () => void {
  return firebaseOnAuthStateChanged(auth, callback);
}
