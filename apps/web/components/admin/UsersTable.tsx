'use client';
import { useMemo, useState } from 'react';

type RoleFilter = 'all' | 'admin' | 'user';
type StatusFilter = 'all' | 'active' | 'inactive';

export function UsersTable({ users }: { users: any[] }) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [provider, setProvider] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const providers = useMemo(
    () => Array.from(new Set(users.map((u) => u.auth_provider).filter(Boolean))).sort(),
    [users]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (role !== 'all' && u.role !== role) return false;
      if (status !== 'all' && (status === 'active') !== Boolean(u.is_active)) return false;
      if (provider !== 'all' && u.auth_provider !== provider) return false;
      if (!q) return true;
      const hay = `${u.name ?? ''} ${u.email ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, query, role, status, provider]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => Boolean(u.is_active)).length;
  const adminUsers = users.filter((u) => u.role === 'admin').length;
  const regularUsers = Math.max(0, totalUsers - adminUsers);

  return (
    <div className="card overflow-hidden">
      <div className="p-4 md:p-5 border-b border-[var(--line)] bg-[var(--brand-soft)]/20 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            className={`card p-3 text-left transition border ${role === 'all' && status === 'all' ? 'border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900' : 'border-[var(--line)]'}`}
            onClick={() => {
              setRole('all');
              setStatus('all');
              setPage(1);
            }}
          >
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">All</p>
            <p className="text-lg font-semibold text-[var(--text)]">{totalUsers}</p>
          </button>
          <button
            className={`card p-3 text-left transition border ${status === 'active' ? 'border-emerald-400 ring-2 ring-emerald-200 dark:ring-emerald-900' : 'border-[var(--line)]'}`}
            onClick={() => {
              setStatus('active');
              setPage(1);
            }}
          >
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Active</p>
            <p className="text-lg font-semibold text-emerald-600">{activeUsers}</p>
          </button>
          <button
            className={`card p-3 text-left transition border ${role === 'admin' ? 'border-orange-400 ring-2 ring-orange-200 dark:ring-orange-900' : 'border-[var(--line)]'}`}
            onClick={() => {
              setRole('admin');
              setPage(1);
            }}
          >
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Admins</p>
            <p className="text-lg font-semibold text-orange-600">{adminUsers}</p>
          </button>
          <button
            className={`card p-3 text-left transition border ${role === 'user' ? 'border-violet-400 ring-2 ring-violet-200 dark:ring-violet-900' : 'border-[var(--line)]'}`}
            onClick={() => {
              setRole('user');
              setPage(1);
            }}
          >
            <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">Users</p>
            <p className="text-lg font-semibold text-violet-600">{regularUsers}</p>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="input text-sm md:col-span-2"
            placeholder="Search by name or email..."
          />
          <select
            className="input text-sm"
            value={role}
            onChange={(e) => {
              setRole(e.target.value as RoleFilter);
              setPage(1);
            }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select
            className="input text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              setPage(1);
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--muted)]">Provider</label>
            <select
              className="input text-xs h-9 py-0"
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All</option>
              {providers.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-[var(--muted)]">
            Showing {paged.length ? start + 1 : 0}-{start + paged.length} of {filtered.length}
          </div>
        </div>
      </div>

      <div className="md:hidden divide-y divide-[var(--line)]">
        {paged.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">
            No users match your filters.
          </div>
        )}
        {paged.map((u) => (
          <div key={u._id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-[var(--text)] truncate">{u.name}</p>
                <p className="text-xs text-[var(--muted)] truncate mt-0.5">{u.email}</p>
              </div>
              <span className={`badge text-xs ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                {u.is_active ? 'active' : 'inactive'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-[var(--brand-soft)]/30 px-3 py-2">
                <p className="text-[var(--muted)]">Role</p>
                <p className={`${u.role === 'admin' ? 'text-orange-600' : 'text-[var(--text)]'} font-semibold mt-1`}>
                  {u.role}
                </p>
              </div>
              <div className="rounded-xl bg-[var(--brand-soft)]/30 px-3 py-2">
                <p className="text-[var(--muted)]">Provider</p>
                <p className="text-[var(--text)] font-semibold mt-1">{u.auth_provider ?? 'email'}</p>
              </div>
              <div className="rounded-xl bg-[var(--brand-soft)]/30 px-3 py-2">
                <p className="text-[var(--muted)]">Tests</p>
                <p className="text-[var(--text)] font-semibold mt-1">{u.stats?.total_tests ?? 0}</p>
              </div>
              <div className="rounded-xl bg-[var(--brand-soft)]/30 px-3 py-2">
                <p className="text-[var(--muted)]">Accuracy</p>
                <p className="text-[var(--text)] font-semibold mt-1">{Math.round(u.stats?.average_accuracy ?? 0)}%</p>
              </div>
              <div className="rounded-xl bg-[var(--brand-soft)]/30 px-3 py-2">
                <p className="text-[var(--muted)]">Streak</p>
                <p className="text-orange-500 font-semibold mt-1">{u.stats?.current_streak ?? 0}🔥</p>
              </div>
              <div className="rounded-xl bg-[var(--brand-soft)]/30 px-3 py-2">
                <p className="text-[var(--muted)]">Joined</p>
                <p className="text-[var(--text)] font-semibold mt-1">{new Date(u.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-[var(--brand-soft)]/35">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Provider', 'Tests', 'Accuracy', 'Streak', 'Joined'].map((h) => (
                <th key={h} className="text-left px-4 py-2 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {paged.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-[var(--muted)]">
                  No users match your filters.
                </td>
              </tr>
            )}
            {paged.map((u) => (
              <tr key={u._id} className="hover:bg-[var(--brand-soft)]/25">
                <td className="px-4 py-2.5 font-medium text-[var(--text)]">{u.name}</td>
                <td className="px-4 py-2.5 text-xs text-[var(--muted)]">{u.email}</td>
                <td className="px-4 py-2.5">
                  <span className={`badge text-xs ${u.role === 'admin' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' : 'badge-gray'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`badge text-xs ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                    {u.is_active ? 'active' : 'inactive'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-[var(--muted)]">{u.auth_provider ?? 'email'}</td>
                <td className="px-4 py-2.5 text-xs text-[var(--muted)]">{u.stats?.total_tests ?? 0}</td>
                <td className="px-4 py-2.5 text-xs text-[var(--muted)]">{Math.round(u.stats?.average_accuracy ?? 0)}%</td>
                <td className="px-4 py-2.5 text-xs text-orange-500">{u.stats?.current_streak ?? 0}🔥</td>
                <td className="px-4 py-2.5 text-xs text-[var(--muted)]">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="px-4 py-3 border-t border-[var(--line)] flex items-center justify-between gap-3 flex-wrap">
          <button
            className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <p className="text-xs text-[var(--muted)]">
            Page {safePage} / {totalPages}
          </p>
          <button
            className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
