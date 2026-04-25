'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppIcon } from '@/components/icons/AppIcon';

export function MockTestCatalog({
  tests,
  initialExamId = 'all',
  pastWeeklyMocks = [],
}: {
  tests: any[];
  initialExamId?: string;
  pastWeeklyMocks?: any[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [exam, setExam] = useState(initialExamId || 'all');
  const [pastOpen, setPastOpen] = useState(false);

  useEffect(() => {
    for (const test of tests.slice(0, 6)) {
      if (!test?.exam_id?.slug || !test?._id) continue;
      router.prefetch(`/mock/${test.exam_id.slug}?test=${test._id}`);
    }
  }, [router, tests]);

  const exams = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tests) {
      const id = String(t.exam_id?._id ?? t.exam_id ?? '');
      const name = String(t.exam_id?.name ?? 'Unknown');
      if (id) map.set(id, name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tests]);

  useEffect(() => {
    if (exams.length === 1) {
      setExam(exams[0].id);
      return;
    }
    if (initialExamId && initialExamId !== 'all') {
      setExam(initialExamId);
    }
  }, [exams, initialExamId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tests.filter((t) => {
      const examId = String(t.exam_id?._id ?? t.exam_id ?? '');
      const examName = String(t.exam_id?.name ?? '').toLowerCase();
      const title = String(t.title ?? '').toLowerCase();
      const slug = String(t.slug ?? '').toLowerCase();
      const textOk = !q || title.includes(q) || slug.includes(q) || examName.includes(q);
      const examOk = exam === 'all' || examId === exam;
      return textOk && examOk;
    });
  }, [tests, query, exam]);

  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input
          className="input md:col-span-3"
          placeholder="Search mock by title / exam / slug..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="input" value={exam} onChange={(e) => setExam(e.target.value)}>
          <option value="all">All Exams</option>
          {exams.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </div>

      {pastWeeklyMocks.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setPastOpen(true)}
            className="card w-full p-4 text-left transition-colors hover:border-[var(--brand)]/45 hover:bg-[var(--brand-soft)]/15"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
                  <AppIcon name="mock" className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold text-[var(--text)]">Past weekly mock tests</span>
                  <span className="mt-1 block text-sm text-[var(--muted)]">
                    Re-attempt expired weekly sets as normal mocks. Scheduled ranks only count on the original Saturday.
                  </span>
                </span>
              </div>
              <span className="btn-primary !px-3 !py-2 text-xs">Open past weekly</span>
            </div>
          </button>

          {pastOpen && (
            <div className="fixed inset-0 z-[90]">
              <button
                type="button"
                className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
                aria-label="Close past weekly mocks"
                onClick={() => setPastOpen(false)}
              />
              <section className="absolute inset-x-3 top-8 mx-auto flex max-h-[86dvh] max-w-2xl flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">Normal practice mode</p>
                    <h2 className="mt-1 text-lg font-bold text-[var(--text)]">Past Weekly Mocks</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">Pick an expired weekly test and attempt it without ranking pressure.</p>
                  </div>
                  <button type="button" onClick={() => setPastOpen(false)} className="btn-secondary !px-3 !py-2 text-xs">Close</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid gap-3">
                    {pastWeeklyMocks.map((mock) => (
                      <Link
                        key={`${mock._id}-${mock.week_end}`}
                        href={mock.href}
                        onClick={() => setPastOpen(false)}
                        className="rounded-2xl border border-[var(--line)] bg-[var(--bg)]/55 p-4 transition-colors hover:border-[var(--brand)]/50 hover:bg-[var(--brand-soft)]/20"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold text-[var(--brand)]">{mock.week_start} to {mock.week_end}</p>
                            <h3 className="mt-1 font-semibold text-[var(--text)]">{mock.title}</h3>
                            <p className="mt-1 text-sm text-[var(--muted)]">{mock.total_questions} questions · {mock.duration_minutes} min</p>
                          </div>
                          <span className="btn-primary !px-3 !py-2 text-xs">Attempt</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}
        </>
      )}

      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-[var(--muted)]">No mock tests matched your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((test) => (
            <div key={test._id} className="card flex items-start justify-between gap-4 p-5 transition-colors hover:border-[var(--brand)]/45 hover:bg-[var(--brand-soft)]/12 md:p-6">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)] font-semibold">{test.exam_id?.name}</p>
                <h2 className="font-semibold text-[var(--text)] text-lg mt-1 line-clamp-2">{test.title}</h2>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="badge badge-blue inline-flex items-center gap-1.5"><AppIcon name="mock" className="h-3.5 w-3.5" /> {test.duration_minutes} min</span>
                  <span className="badge badge-green inline-flex items-center gap-1.5"><AppIcon name="questions" className="h-3.5 w-3.5" /> {test.total_questions} questions</span>
                  <span className="badge inline-flex items-center gap-1.5 bg-violet-100 text-violet-700"><AppIcon name="users" className="h-3.5 w-3.5" /> {test.attempt_count ?? 0} attempts</span>
                </div>
              </div>
              <Link
                href={`/mock/${test.exam_id?.slug}?test=${test._id}`}
                prefetch
                className="btn-primary shrink-0"
              >
                Start Test
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
