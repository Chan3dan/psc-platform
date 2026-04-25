'use client';

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export const USER_PREFETCH_ROUTES = [
  '/dashboard',
  '/feed',
  '/exams',
  '/practice',
  '/mock',
  '/drill',
  '/review',
  '/planner',
  '/results',
  '/leaderboard',
  '/notes',
  '/bookmarks',
  '/settings',
] as const;

export const ADMIN_PREFETCH_ROUTES = [
  '/admin',
  '/admin/exams',
  '/admin/subjects',
  '/admin/questions',
  '/admin/flagged',
  '/admin/results',
  '/admin/mocks',
  '/admin/analytics',
  '/admin/users',
  '/admin/feedback',
  '/admin/notes',
  '/admin/settings',
] as const;

export function prefetchRoutes(
  router: AppRouterInstance,
  routes: readonly string[],
  currentPathname?: string | null
) {
  for (const href of routes) {
    if (!href || href === currentPathname) continue;
    router.prefetch(href);
  }
}
