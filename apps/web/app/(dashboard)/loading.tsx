export default function DashboardLoading() {
  const quotes = [
    'Small daily effort compounds into exam confidence.',
    'Read, attempt, review, repeat. That is the rank loop.',
    'Your future self is built during quiet practice sessions.',
  ];
  const quote = quotes[new Date().getDate() % quotes.length];
  return (
    <div className="page-wrap space-y-4">
      <div className="card glass p-6 md:p-7">
        <div className="h-4 w-32 animate-pulse rounded-full bg-[var(--brand-soft)]" />
        <div className="mt-4 h-8 w-64 animate-pulse rounded-xl bg-[var(--line)]/70" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-xl bg-[var(--line)]/70" />
        <p className="mt-4 text-sm font-semibold text-[var(--text)]">Preparing your learning workspace...</p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{quote}</p>
        <div className="mt-5 flex animate-pulse flex-wrap gap-3">
          <div className="h-11 w-36 rounded-2xl bg-[var(--line)]/70" />
          <div className="h-11 w-36 rounded-2xl bg-[var(--line)]/70" />
          <div className="h-11 w-36 rounded-2xl bg-[var(--line)]/70" />
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card p-4">
            <div className="h-3 w-20 rounded bg-[var(--line)]/70" />
            <div className="mt-3 h-7 w-16 rounded bg-[var(--line)]/70" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="card p-5 space-y-3">
            <div className="h-4 w-32 rounded bg-[var(--line)]/70" />
            <div className="h-12 w-full rounded-2xl bg-[var(--line)]/70" />
            <div className="h-12 w-full rounded-2xl bg-[var(--line)]/70" />
            <div className="h-12 w-full rounded-2xl bg-[var(--line)]/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
