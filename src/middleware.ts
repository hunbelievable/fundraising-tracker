import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/login' || pathname === '/api/login') {
    return NextResponse.next();
  }

  const auth = request.cookies.get('auth')?.value;
  if (auth && auth === process.env.AUTH_COOKIE_SECRET) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
