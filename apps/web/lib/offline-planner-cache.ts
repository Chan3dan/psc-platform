'use client';

import { get, set } from 'idb-keyval';
import type { PlannerTodayPayload } from '@/lib/planner-smart';

type PlannerCacheEntry = {
  payload: PlannerTodayPayload;
  cachedAt: string;
};

const TODAY_PLAN_KEY = 'planner:today';

function canUseIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

export async function cacheTodayPlan(payload: PlannerTodayPayload) {
  if (!canUseIndexedDb()) return;
  await set(TODAY_PLAN_KEY, {
    payload,
    cachedAt: new Date().toISOString(),
  } satisfies PlannerCacheEntry);
}

export async function readCachedTodayPlan() {
  if (!canUseIndexedDb()) return null;
  return (await get<PlannerCacheEntry>(TODAY_PLAN_KEY)) ?? null;
}
