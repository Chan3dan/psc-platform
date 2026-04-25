import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { buildTestSession } from '@/lib/test-session';
import { MockTestPageInner } from '@/components/exam/MockTestPageInner';
import type { ExamSession } from '@/store/examStore';
import { connectDB } from '@/lib/db';
import { MockTest } from '@psc/shared/models';
import { validateScheduledWeeklyAttempt } from '@/lib/weekly-feed';

export default async function MockTestPage({
  searchParams,
}: {
  searchParams?: { test?: string; weekly?: string; week?: string };
}) {
  const session = await getServerSession(authOptions);
  const testId = searchParams?.test ?? null;
  const weeklyMode = searchParams?.weekly ?? null;
  const weeklyWeek = searchParams?.week ?? null;

  let scheduledAllowed = true;
  if (session && testId && weeklyMode === 'scheduled') {
    await connectDB();
    const mock = await MockTest.findById(testId).select('exam_id').lean() as any;
    const validation = mock
      ? await validateScheduledWeeklyAttempt({
          userId: session.user.id,
          testId,
          examId: String(mock.exam_id),
          weekEnd: weeklyWeek,
        })
      : { ok: false as const };
    scheduledAllowed = Boolean(validation.ok);
  }

  const initialSession =
    session && testId && scheduledAllowed
      ? await buildTestSession({ test_id: testId, test_type: 'mock', weekly: weeklyMode as any, week: weeklyWeek })
      : null;
  const hydratedSession: ExamSession | null = initialSession?.ok
    ? (initialSession.data as unknown as ExamSession)
    : null;

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading test…</p>
        </div>
      </div>
    }>
      <MockTestPageInner initialSession={hydratedSession} />
    </Suspense>
  );
}
