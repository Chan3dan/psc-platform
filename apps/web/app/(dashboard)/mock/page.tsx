import { MockTestCatalog } from '@/components/exam/MockTestCatalog';
import { getActiveMockTests } from '@/lib/catalog-data';

export default async function MockIndexPage() {
  const tests = (await getActiveMockTests()) as any[];

  return (
    <div className="page-wrap space-y-6">
      <div className="card glass p-6 md:p-7">
        <h1 className="text-2xl md:text-3xl font-semibold text-[var(--text)]">Mock Tests</h1>
        <p className="text-sm text-[var(--muted)] mt-1.5">Start a full exam-style mock test from the list below.</p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-[var(--brand-soft)]/40 border border-[var(--line)] px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Available</p>
            <p className="text-xl font-semibold text-[var(--text)]">{tests.length}</p>
          </div>
          <div className="rounded-xl bg-[var(--brand-soft)]/40 border border-[var(--line)] px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Total Attempts</p>
            <p className="text-xl font-semibold text-[var(--text)]">{tests.reduce((s, t) => s + (t.attempt_count ?? 0), 0)}</p>
          </div>
          <div className="rounded-xl bg-[var(--brand-soft)]/40 border border-[var(--line)] px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Avg Duration</p>
            <p className="text-xl font-semibold text-[var(--text)]">
              {tests.length ? Math.round(tests.reduce((s, t) => s + (t.duration_minutes ?? 0), 0) / tests.length) : 0}m
            </p>
          </div>
          <div className="rounded-xl bg-[var(--brand-soft)]/40 border border-[var(--line)] px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">Questions/Test</p>
            <p className="text-xl font-semibold text-[var(--text)]">
              {tests.length ? Math.round(tests.reduce((s, t) => s + (t.total_questions ?? 0), 0) / tests.length) : 0}
            </p>
          </div>
        </div>
      </div>

      <MockTestCatalog tests={tests} />
    </div>
  );
}
