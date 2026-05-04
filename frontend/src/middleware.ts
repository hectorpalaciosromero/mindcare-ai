import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that skip auth.
const PUBLIC_ROUTES = ['/login', '/register'];

// Decode JWT payload client-side (server validates).
function decodeJwtPayload(token: string): { role?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad === 1) return null;
    if (pad) base64 += '='.repeat(4 - pad);

    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function getDashboardForRole(role: string): string {
  switch (role) {
    case 'admin': return '/admin/dashboard';
    case 'psychologist': return '/psychologist/dashboard';
    default: return '/patient/dashboard';
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  // Public routes
  if (PUBLIC_ROUTES.some(route => path.startsWith(route))) {
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload?.role) {
        return NextResponse.redirect(new URL(getDashboardForRole(payload.role), request.url));
      }
    }
    return NextResponse.next();
  }

  // Protected routes
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', path);
    return NextResponse.redirect(loginUrl);
  }

  const payload = decodeJwtPayload(token);

  // Token validation fallback
  if (!payload?.role) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  // RBAC
  const role = payload.role;

  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(getDashboardForRole(role), request.url));
  }
  if (path.startsWith('/psychologist') && role !== 'psychologist') {
    return NextResponse.redirect(new URL(getDashboardForRole(role), request.url));
  }
  if (path.startsWith('/patient') && role !== 'patient') {
    return NextResponse.redirect(new URL(getDashboardForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/psychologist/:path*', '/patient/:path*', '/login', '/register'],
};
