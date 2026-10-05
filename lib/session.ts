// Signed session cookie shared by the login function (api/login.ts) and the gate (middleware.ts).
// Token = base64url(payload) + "." + base64url(HMAC-SHA256(payload, SESSION_SECRET)).
// Web Crypto only, so it runs in both the Node function and the edge middleware.

export const COOKIE = 'hnh_session';
export const MAX_AGE = 60 * 60 * 12; // 12 hours

const enc = new TextEncoder();

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function hmac(data: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

// Constant-time comparison of two strings (compares their SHA-256 digests).
export async function safeEqual(a: string, b: string) {
  const [x, y] = await Promise.all([a, b].map(async (s) => new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))));
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function createToken(username: string, secret: string, now = Date.now()) {
  const payload = b64url(enc.encode(JSON.stringify({ u: username, exp: Math.floor(now / 1000) + MAX_AGE })));
  return `${payload}.${b64url(await hmac(payload, secret))}`;
}

export async function verifyToken(token: string | undefined, secret: string, now = Date.now()): Promise<string | null> {
  if (!token || !secret) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  if (!(await safeEqual(sig, b64url(await hmac(payload, secret))))) return null;
  try {
    const { u, exp } = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    return typeof u === 'string' && exp * 1000 > now ? u : null;
  } catch {
    return null;
  }
}

export const readCookie = (header: string | null, name: string) =>
  header
    ?.split(';')
    .map((c) => c.trim().split('='))
    .find(([k]) => k === name)?.[1];

export const sessionCookie = (value: string, maxAge: number) =>
  `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

// Self-check: `node --experimental-strip-types lib/session.ts`
if ((globalThis as { process?: { argv?: string[] } }).process?.argv?.[1]?.endsWith('session.ts')) {
  const assert = (c: boolean, m: string) => {
    if (!c) throw new Error(m);
  };
  const t = await createToken('client', 's3cret');
  assert((await verifyToken(t, 's3cret')) === 'client', 'valid token verifies');
  assert((await verifyToken(t, 'other')) === null, 'wrong secret rejected');
  assert((await verifyToken(t.slice(0, -2) + 'xx', 's3cret')) === null, 'tampered signature rejected');
  const [p, s] = t.split('.');
  assert((await verifyToken(p.slice(0, -1) + 'A.' + s, 's3cret')) === null, 'tampered payload rejected');
  assert((await verifyToken(t, 's3cret', Date.now() + (MAX_AGE + 5) * 1000)) === null, 'expired token rejected');
  assert(await safeEqual('a', 'a'), 'equal strings');
  assert(!(await safeEqual('a', 'b')), 'different strings');
  assert(readCookie('x=1; hnh_session=abc.def', COOKIE) === 'abc.def', 'cookie parsed');
  console.log('session.ts: all checks passed');
}
