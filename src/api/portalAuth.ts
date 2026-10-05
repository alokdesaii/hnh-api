/**
 * Portal sign-in — the one place the backend team plugs in.
 *
 * This is sign-in to the *portal* (client access to the docs and sandbox),
 * separate from the Payments API's own 1.1 /api/users/authenticate.
 *
 * Contract the UI relies on:
 *   signIn(username, password) resolves to either
 *     { ok: true,  user: PortalUser, token }   → user is let in
 *     { ok: false, error: SignInError, message? } → message shown on the form
 *   It should not throw; network failures resolve to { ok: false, error: 'network' }.
 *
 * Suggested endpoint (adjust freely, only this file needs to change):
 *   POST {PORTAL_API}/auth/login   body: { username, password }
 *   200 → { user: { username, clientAccountNumber, displayName? }, token }
 *   401 → invalid credentials · 423 → locked · 429 → too many attempts
 *
 * Session storage: the UI keeps { user, token } in localStorage (AuthContext).
 * If you move to an httpOnly session cookie, return token: '' and keep the cookie.
 */

export interface PortalUser {
  username: string;
  clientAccountNumber: string;
  displayName?: string;
}

export type SignInError = 'invalid' | 'locked' | 'rate_limited' | 'network' | 'unknown';

export type SignInResult = { ok: true; user: PortalUser; token: string } | { ok: false; error: SignInError; message?: string };

const PORTAL_API = import.meta.env.VITE_PORTAL_API_URL as string | undefined;
export const PREVIEW = !PORTAL_API && (import.meta.env.DEV || import.meta.env.VITE_PORTAL_PREVIEW === 'true');

export const SIGN_IN_MESSAGES: Record<SignInError, string> = {
  invalid: 'That username and password don’t match our records.',
  locked: 'This account is locked. Contact your Harbour & Hills relationship manager.',
  rate_limited: 'Too many attempts. Wait a few minutes and try again.',
  network: 'We couldn’t reach the sign-in service. Check your connection and try again.',
  unknown: 'Something went wrong signing you in. Please try again.',
};

export async function signIn(username: string, password: string): Promise<SignInResult> {
  // ponytail: no backend yet — local dev, or a deploy with VITE_PORTAL_PREVIEW=true, accepts any credentials.
  // Set VITE_PORTAL_API_URL to use the real service (and remove VITE_PORTAL_PREVIEW).
  if (!PORTAL_API) {
    if (!PREVIEW) return { ok: false, error: 'network', message: 'Sign-in isn’t configured yet (VITE_PORTAL_API_URL is not set).' };
    await new Promise((r) => setTimeout(r, 600));
    return {
      ok: true,
      token: 'dev-session',
      user: { username, clientAccountNumber: '102-344-001-01-00-0001-00000' },
    };
  }

  try {
    const res = await fetch(`${PORTAL_API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.user) return { ok: true, user: data.user, token: data.token ?? '' };
    const error: SignInError = res.status === 401 ? 'invalid' : res.status === 423 ? 'locked' : res.status === 429 ? 'rate_limited' : 'unknown';
    return { ok: false, error, message: data.message };
  } catch {
    return { ok: false, error: 'network' };
  }
}
