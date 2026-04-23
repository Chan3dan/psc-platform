'use client';

import { get, set } from 'idb-keyval';
import type { ExamSession } from '@/store/examStore';

type PracticeCacheEntry = {
  questions: any[];
  cachedAt: string;
  label: string;
};

type MockCacheEntry = {
  session: ExamSession;
  cachedAt: string;
};

function practiceLatestKey(examSlug: string, subjectSlug: string) {
  return `practice:${examSlug}:${subjectSlug}:latest`;
}

function practiceScopedKey(examSlug: string, subjectSlug: string, suffix: string) {
  return `practice:${examSlug}:${subjectSlug}:${suffix}`;
}

function mockKey(testId: string) {
  return `mock:${testId}`;
}

function canUseIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

export async function cachePracticeQuestions({
  examSlug,
  subjectSlug,
  suffix,
  label,
  questions,
}: {
  examSlug: string;
  subjectSlug: string;
  suffix: string;
  label: string;
  questions: any[];
}) {
  if (!canUseIndexedDb() || questions.length === 0) return;

  const entry: PracticeCacheEntry = {
    questions,
    cachedAt: new Date().toISOString(),
    label,
  };

  await Promise.all([
    set(practiceLatestKey(examSlug, subjectSlug), entry),
    set(practiceScopedKey(examSlug, subjectSlug, suffix), entry),
  ]);
}

export async function readCachedPracticeQuestions({
  examSlug,
  subjectSlug,
  suffix,
}: {
  examSlug: string;
  subjectSlug: string;
  suffix?: string;
}) {
  if (!canUseIndexedDb()) return null;
  const scoped = suffix ? await get<PracticeCacheEntry>(practiceScopedKey(examSlug, subjectSlug, suffix)) : null;
  return scoped ?? (await get<PracticeCacheEntry>(practiceLatestKey(examSlug, subjectSlug))) ?? null;
}

export async function cacheMockSession(testId: string, session: ExamSession) {
  if (!canUseIndexedDb() || !testId || session.questions.length === 0) return;
  await set(mockKey(testId), {
    session,
    cachedAt: new Date().toISOString(),
  } satisfies MockCacheEntry);
}

export async function readCachedMockSession(testId: string) {
  if (!canUseIndexedDb() || !testId) return null;
  return (await get<MockCacheEntry>(mockKey(testId))) ?? null;
}
