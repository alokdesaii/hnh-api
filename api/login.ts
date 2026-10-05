import { createToken, safeEqual, sessionCookie, MAX_AGE } from '../lib/session.js';

// Checks the portal credentials, which live only in Vercel env vars (PORTAL_USERNAME / PORTAL_PASSWORD).
// On success sets the signed, httpOnly session cookie that middleware.ts requires.
export async function POST(request: Request) {
  const { PORTAL_USERNAME, PORTAL_PASSWORD, SESSION_SECRET } = process.env;
  if (!PORTAL_USERNAME || !PORTAL_PASSWORD || !SESSION_SECRET) {
    return Response.json({ message: 'Sign-in isn’t configured on the server yet.' }, { status: 503 });
  }

  let username = '';
  let password = '';
  try {
    const body = await request.json();
    username = String(body.username ?? '').trim();
    password = String(body.password ?? '');
  } catch {
    return Response.json({ message: 'Invalid request.' }, { status: 400 });
  }

  // Check both fields every time so timing doesn't reveal which one was wrong.
  const [userOk, passOk] = await Promise.all([safeEqual(username, PORTAL_USERNAME), safeEqual(password, PORTAL_PASSWORD)]);
  if (!userOk || !passOk) {
    // ponytail: fixed delay instead of a rate limiter; add one (e.g. Upstash) if this is ever targeted.
    await new Promise((r) => setTimeout(r, 700));
    return Response.json({ message: 'That username and password don’t match our records.' }, { status: 401 });
  }

  const token = await createToken(username, SESSION_SECRET);
  return Response.json(
    { user: { username, clientAccountNumber: '102-344-001-01-00-0001-00000' } },
    { headers: { 'Set-Cookie': sessionCookie(token, MAX_AGE), 'Cache-Control': 'no-store' } }
  );
}
