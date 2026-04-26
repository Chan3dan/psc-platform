'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '@/components/icons/AppIcon';
import { formatResultDateTime } from '@/lib/results';

function AdminOverviewLoadingState() {
  return (
    <div className="page-wrap space-y-8">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded bg-[var(--line)] animate-pulse" />
        <div className="h-4 w-56 rounded bg-[var(--line)] animate-pulse" />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="card p-4 md:p-5 space-y-2">
            <div className="h-8 w-16 rounded bg-[var(--line)] animate-pulse" />
            <div className="h-4 w-24 rounded bg-[var(--line)] animate-pulse" />
          </div>
        ))}
      </div>
      <div className="card h-64 animate-pulse bg-[var(--brand-soft)]/15" />
    </div>
  );
}

export function AdminOverviewClient() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const response = await fetch('/api/admin/overview');
      const payload = await response.json();
      return payload.data;
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  if (isLoading || !data) {
    return <AdminOverviewLoadingState />;
  }

  const { stats, recentUsers, recentFlaggedQuestions } = data;

  return (
    <div className="page-wrap space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Overview</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Platform statistics and quick actions.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4">
        {[
          { label: 'Active Exams', value: stats.examCount, href: '/admin/exams', color: 'text-blue-600' },
          { label: 'Questions', value: stats.questionCount.toLocaleString(), href: '/admin/questions', color: 'text-emerald-600' },
          { label: 'Users', value: stats.userCount.toLocaleString(), href: '/admin/users', color: 'text-purple-600' },
          { label: 'Test Attempts', value: stats.resultCount.toLocaleString(), href: '/admin/results', color: 'text-orange-600' },
          { label: 'Flagged Reviews', value: stats.flaggedCount.toLocaleString(), href: '/admin/flagged', color: 'text-amber-600' },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="card p-4 md:p-5">
            <div className={`text-xl md:text-2xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs md:text-sm text-[var(--muted)] mt-1">{item.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {[
          { href: '/admin/exams', label: 'Add New Exam', desc: 'Create a new exam type', icon: 'exams' },
          { href: '/admin/questions', label: 'Upload Questions', desc: 'Bulk upload MCQ bank via JSON', icon: 'upload' },
          { href: '/admin/notes', label: 'Upload Notes', desc: 'Add PDFs and study materials', icon: 'notes' },
        ].map((action) => (
          <Link key={action.href} href={action.href} className="card p-4 md:p-5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <AppIcon name={action.icon as any} className="h-5 w-5" />
            </div>
            <h3 className="font-medium text-[var(--text)] text-sm">{action.label}</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">{action.desc}</p>
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 md:px-6 py-3 border-b border-[var(--line)] flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-[var(--text)] text-sm">Flagged By Users</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Recent questions users marked for review during tests.</p>
          </div>
          <button type="button" onClick={() => router.push('/admin/flagged')} className="btn-secondary px-3 py-2 text-xs">
            Open flagged queue
          </button>
        </div>
        {recentFlaggedQuestions.length === 0 ? (
          <div className="px-4 md:px-6 py-5 text-sm text-[var(--muted)]">No flagged questions yet.</div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {recentFlaggedQuestions.map((item: any) => (
              <div key={`${item.resultId}-${item.questionId}`} className="px-4 md:px-6 py-3 space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] line-clamp-2">{item.questionText}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {item.userName} · {item.testTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="badge badge-amber text-xs">Flagged</span>
                    <Link
                      href={`/admin/questions?open=bank&questionId=${item.questionId}&mode=edit`}
                      className="text-xs text-[var(--brand)] hover:underline"
                    >
                      Review
                    </Link>
                  </div>
                </div>
                <p className="text-xs text-[var(--muted)]">{formatResultDateTime(item.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 md:px-6 py-3 border-b border-[var(--line)]">
          <h2 className="font-semibold text-[var(--text)] text-sm">Recent Registrations</h2>
        </div>
        <div className="md:hidden divide-y divide-[var(--line)]">
          {recentUsers.map((user: any) => (
            <div key={user._id} className="px-4 py-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--text)] truncate">{user.name}</p>
                  <p className="text-xs text-[var(--muted)] truncate mt-0.5">{user.email}</p>
                </div>
                <span className={`badge text-xs ${user.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'badge-gray'}`}>
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)]">Joined {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[var(--brand-soft)]/35">
              <tr>
                {['Name', 'Email', 'Role', 'Joined'].map((heading) => (
                  <th key={heading} className="text-left px-6 py-2 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {recentUsers.map((user: any) => (
                <tr key={user._id} className="hover:bg-[var(--brand-soft)]/25">
                  <td className="px-6 py-2.5 font-medium text-[var(--text)]">{user.name}</td>
                  <td className="px-6 py-2.5 text-[var(--muted)]">{user.email}</td>
                  <td className="px-6 py-2.5">
                    <span className={`badge ${user.role === 'admin' ? 'bg-orange-100 text-orange-700' : 'badge-gray'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-2.5 text-[var(--muted)]">{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
