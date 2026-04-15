// ── FILE: app/admin/users/page.tsx ───────────────────────────
import { connectDB } from '@/lib/db';
import { User } from '@psc/shared/models';
import { UsersTable } from '@/components/admin/UsersTable';

export default async function AdminUsersPage() {
  await connectDB();
  const users = await User.find({}).sort({ created_at: -1 }).limit(500)
    .select('name email role stats.total_tests stats.average_accuracy stats.current_streak created_at is_active auth_provider')
    .lean() as any[];

  return (
    <div className="page-wrap space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Users</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">Search, filter, and review user activity.</p>
      </div>

      <UsersTable users={JSON.parse(JSON.stringify(users))} />
    </div>
  );
}
