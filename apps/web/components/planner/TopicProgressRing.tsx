import Link from 'next/link';

type TopicProgress = {
  subject_id: string;
  subject_name: string;
  subject_slug: string;
  attempted: number;
  correct: number;
  accuracy_percent: number;
  revision_count: number;
  due_for_revision: boolean;
  practiceHref: string;
};

type Props = {
  topics: TopicProgress[];
};

export function TopicProgressRing({ topics }: Props) {
  if (!topics.length) {
    return (
      <section className="card p-5">
        <h2 className="text-xl font-bold text-[var(--text)]">Topic progress</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">Practice results will appear here after your first session.</p>
      </section>
    );
  }

  return (
    <section className="card p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Readiness rings</p>
          <h2 className="mt-2 text-xl font-bold text-[var(--text)]">Topic progress</h2>
        </div>
        <p className="text-xs text-[var(--muted)]">Accuracy, attempts, and revision count</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {topics.map((topic) => {
          const radius = 34;
          const circumference = 2 * Math.PI * radius;
          const offset = circumference - (Math.min(topic.accuracy_percent, 100) / 100) * circumference;
          return (
            <Link
              key={topic.subject_id}
              href={topic.practiceHref}
              className="group rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] p-4 transition-colors hover:border-[var(--brand)]/70"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0">
                  <svg className="h-20 w-20 -rotate-90" viewBox="0 0 84 84" aria-hidden="true">
                    <circle cx="42" cy="42" r={radius} fill="none" stroke="var(--line)" strokeWidth="8" />
                    <circle
                      cx="42"
                      cy="42"
                      r={radius}
                      fill="none"
                      stroke="var(--brand)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                    />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center text-sm font-bold text-[var(--text)]">
                    {topic.accuracy_percent}%
                  </div>
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-[var(--text)] group-hover:text-[var(--brand)]">
                    {topic.subject_name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {topic.attempted} attempted · {topic.correct} correct
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[var(--bg)] px-2 py-1 text-[11px] font-semibold text-[var(--muted)]">
                      {topic.revision_count} revisions
                    </span>
                    {topic.due_for_revision && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-500">
                        Due today
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
