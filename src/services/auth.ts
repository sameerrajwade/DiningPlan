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
  signInWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
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
