import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { PUBLIC_TOPIC_ROUTES } from '@/lib/seo-landing-pages';

const PUBLIC_EXACT_ROUTES = new Set([
  '/',
  '/login',
  '/register',
  '/auth/error',
  '/offline',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml',
  '/googlee8f36920ba0141bb.html',
  '/sw.js',
  ...PUBLIC_TOPIC_ROUTES,
]);

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin-only guard
    if (pathname.startsWith('/admin') && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Always allow public routes
        if (PUBLIC_EXACT_ROUTES.has(pathname)) return true;
        if (pathname.startsWith('/exam/')) return true;
        if (pathname.startsWith('/brand')) return true;
        if (pathname.startsWith('/icons')) return true;
        if (pathname.startsWith('/workbox-')) return true;
        if (pathname.startsWith('/api/auth')) return true;
        if (pathname.startsWith('/api/site-logo')) return true;
        if (pathname === '/api/site-settings' && req.method === 'GET') return true;
        if (pathname.startsWith('/api/exams') && req.method === 'GET') return true;
        if (pathname.startsWith('/_next')) return true;
        if (pathname.startsWith('/favicon')) return true;
        if (pathname.endsWith('.xml')) return true;
        if (pathname.endsWith('.txt')) return true;
        if (pathname.endsWith('.html')) return true;

        // All other routes require auth
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images|brand|robots.txt|sitemap.xml|googlee8f36920ba0141bb.html).*)',
  ],
};
