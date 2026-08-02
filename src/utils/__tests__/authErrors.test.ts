import { mapAuthError } from '../authErrors';

describe('mapAuthError', () => {
  it('never leaks the raw Firebase message', () => {
    const raw = new Error('Firebase: The password is invalid (auth/wrong-password).');
    (raw as any).code = 'auth/wrong-password';
    const msg = mapAuthError(raw);
    expect(msg).not.toMatch(/firebase/i);
    expect(msg).not.toMatch(/auth\//);
  });

  it('uses the SAME message for wrong password and unknown account (no enumeration)', () => {
    const wrongPw = mapAuthError({ code: 'auth/wrong-password' });
    const noUser = mapAuthError({ code: 'auth/user-not-found' });
    const invalid = mapAuthError({ code: 'auth/invalid-credential' });
    expect(wrongPw).toBe('Incorrect email or password.');
    expect(noUser).toBe(wrongPw);
    expect(invalid).toBe(wrongPw);
  });

  it('maps common codes to friendly text', () => {
    expect(mapAuthError({ code: 'auth/email-already-in-use' })).toMatch(/already exists/i);
    expect(mapAuthError({ code: 'auth/network-request-failed' })).toMatch(/network/i);
    expect(mapAuthError({ code: 'auth/too-many-requests' })).toMatch(/too many/i);
  });

  it('falls back to a safe generic message for unknown/undefined errors', () => {
    expect(mapAuthError({ code: 'auth/something-new' })).toBe('Something went wrong. Please try again.');
    expect(mapAuthError(new Error('boom'))).toBe('Something went wrong. Please try again.');
    expect(mapAuthError(undefined)).toBe('Something went wrong. Please try again.');
  });
});
