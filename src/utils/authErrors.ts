// Maps Firebase Auth error codes to short, generic, user-safe messages.
//
// Why: Firebase's raw `e.message` leaks internals (SDK name, error codes, and
// hints about account existence). We never surface those. In particular, wrong
// password and unknown-account are shown with the SAME message so we don't
// reveal whether an email is registered (matches Firebase's own email-
// enumeration protection).
export function mapAuthError(e: unknown): string {
  const code =
    (typeof e === 'object' && e !== null && 'code' in e && typeof (e as any).code === 'string'
      ? (e as any).code
      : '') as string;

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support if this is unexpected.';
    case 'auth/email-already-in-use':
      return 'An account already exists for this email. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
