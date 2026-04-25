import { getServerSession } from 'next-auth';
import { MockTestCatalog } from '@/components/exam/MockTestCatalog';
import { getActiveMockTests } from '@/lib/catalog-data';
import { authOptions } from '@/lib/auth';
import { getUserPreferences } from '@/lib/user-preferences';
import { buildWeeklyFeedForExam } from '@/lib/weekly-feed';

export default async function MockIndexPage() {
  const session = await getServerSession(authOptions);
  const preferences = session ? await getUserPreferences(session.user.id) : { targetExam: null };
  const tests = (await getActiveMockTests()) as any[];
  const filteredTests = preferences.targetExam
    ? tests.filter((test: any) => String(test.exam_id?._id ?? '') === preferences.targetExam?._id)
    : tests;
  const weeklyFeed = preferences.targetExam ? await buildWeeklyFeedForExam(preferences.targetExam) : null;

  return (
    <div className="page-wrap space-y-6">
      <div className="card glass p-6 md:p-7">
        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--text)]">Mock Tests</h1>
        <p className="text-sm text-[var(--muted)] mt-1.5">
          {preferences.targetExam
            ? `Showing ${preferences.targetExam.name} mock tests only.`
            : 'Start a full exam-style mock test from the list below.'}
        </p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-[var(--brand-soft)]/40 border border-[var(--line)] px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Available</p>
            <p className="text-xl font-semibold text-[var(--text)]">{filteredTests.length}</p>
          </div>
          <div className="rounded-xl bg-[var(--brand-soft)]/40 border border-[var(--line)] px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Total Attempts</p>
            <p className="text-xl font-semibold text-[var(--text)]">{filteredTests.reduce((s, t) => s + (t.attempt_count ?? 0), 0)}</p>
          </div>
          <div className="rounded-xl bg-[var(--brand-soft)]/40 border border-[var(--line)] px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Avg Duration</p>
            <p className="text-xl font-semibold text-[var(--text)]">
              {filteredTests.length ? Math.round(filteredTests.reduce((s, t) => s + (t.duration_minutes ?? 0), 0) / filteredTests.length) : 0}m
            </p>
          </div>
          <div className="rounded-xl bg-[var(--brand-soft)]/40 border border-[var(--line)] px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Questions/Test</p>
            <p className="text-xl font-semibold text-[var(--text)]">
              {filteredTests.length ? Math.round(filteredTests.reduce((s, t) => s + (t.total_questions ?? 0), 0) / filteredTests.length) : 0}
            </p>
          </div>
        </div>
      </div>

      <MockTestCatalog
        tests={filteredTests}
        initialExamId={preferences.targetExam?._id ?? 'all'}
        pastWeeklyMocks={(weeklyFeed as any)?.pastWeeklyMocks ?? []}
      />
    </div>
  );
}
