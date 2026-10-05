import { next } from '@vercel/functions';
import { COOKIE, readCookie, verifyToken } from './lib/session.js';

// Gate: without a valid session cookie, only the login page and its assets are served.
// The portal bundle (which contains the specification) is never sent to signed-out visitors.
export const config = {
  matcher: '/((?!login\\.html|login-assets/|api/login|favicon\\.svg).*)',
};

export default async function middleware(request: Request) {
  const user = await verifyToken(readCookie(request.headers.get('cookie'), COOKIE), process.env.SESSION_SECRET ?? '');
  if (user) return next();

  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return Response.json({ message: 'Not signed in.' }, { status: 401 });
  return Response.redirect(new URL('/login.html', url), 307);
}
