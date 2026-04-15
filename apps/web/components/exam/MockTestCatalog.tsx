'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AppIcon } from '@/components/icons/AppIcon';

export function MockTestCatalog({ tests }: { tests: any[] }) {
  const [query, setQuery] = useState('');
  const [exam, setExam] = useState('all');

  const exams = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tests) {
      const id = String(t.exam_id?._id ?? t.exam_id ?? '');
      const name = String(t.exam_id?.name ?? 'Unknown');
      if (id) map.set(id, name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [tests]);

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

      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-[var(--muted)]">No mock tests matched your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filtered.map((test) => (
            <div key={test._id} className="card p-5 md:p-6 flex items-start justify-between gap-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)] font-semibold">{test.exam_id?.name}</p>
                <h2 className="font-semibold text-[var(--text)] text-lg mt-1 line-clamp-2">{test.title}</h2>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="badge badge-blue inline-flex items-center gap-1.5"><AppIcon name="mock" className="h-3.5 w-3.5" /> {test.duration_minutes} min</span>
                  <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 inline-flex items-center gap-1.5"><AppIcon name="questions" className="h-3.5 w-3.5" /> {test.total_questions} questions</span>
                  <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 inline-flex items-center gap-1.5"><AppIcon name="users" className="h-3.5 w-3.5" /> {test.attempt_count ?? 0} attempts</span>
                </div>
              </div>
              <Link href={`/mock/${test.exam_id?.slug}?test=${test._id}`} className="btn-primary shrink-0">
                Start Test
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
