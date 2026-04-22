export default function DashboardLoading() {
  return (
    <div className="page-wrap space-y-4 animate-pulse">
      <div className="card glass p-6 md:p-7">
        <div className="h-4 w-32 rounded-full bg-[var(--brand-soft)]" />
        <div className="mt-4 h-8 w-64 rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="mt-3 h-4 w-80 max-w-full rounded-xl bg-gray-200 dark:bg-gray-800" />
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="h-11 w-36 rounded-2xl bg-gray-200 dark:bg-gray-800" />
          <div className="h-11 w-36 rounded-2xl bg-gray-200 dark:bg-gray-800" />
          <div className="h-11 w-36 rounded-2xl bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card p-4">
            <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="mt-3 h-7 w-16 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="card p-5 space-y-3">
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-12 w-full rounded-2xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-12 w-full rounded-2xl bg-gray-200 dark:bg-gray-800" />
            <div className="h-12 w-full rounded-2xl bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
