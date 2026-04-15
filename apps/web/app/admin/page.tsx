import { connectDB } from '@/lib/db';
import { Exam, Question, User, Result } from '@psc/shared/models';
import Link from 'next/link';

export default async function AdminPage() {
  await connectDB();
  const [examCount, questionCount, userCount, resultCount, recentUsers] = await Promise.all([
    Exam.countDocuments({ is_active: true }),
    Question.countDocuments({ is_active: true }),
    User.countDocuments({ is_active: true }),
    Result.countDocuments({}),
    User.find({}).sort({ created_at: -1 }).limit(8).select('name email created_at role').lean(),
  ]);

  return (
    <div className="page-wrap space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Overview</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Platform statistics and quick actions.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Exams', value: examCount, href: '/admin/exams', color: 'text-blue-600' },
          { label: 'Questions', value: questionCount.toLocaleString(), href: '/admin/questions', color: 'text-emerald-600' },
          { label: 'Users', value: userCount.toLocaleString(), href: '/admin/users', color: 'text-purple-600' },
          { label: 'Test Attempts', value: resultCount.toLocaleString(), href: '#', color: 'text-orange-600' },
        ].map(s => (
          <Link key={s.label} href={s.href} className="card p-5">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-[var(--muted)] mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { href: '/admin/exams', label: 'Add New Exam', desc: 'Create a new PSC exam type', icon: '📋' },
          { href: '/admin/questions', label: 'Upload Questions', desc: 'Bulk upload MCQ bank via JSON', icon: '⬆️' },
          { href: '/admin/notes', label: 'Upload Notes', desc: 'Add PDFs and study materials', icon: '📚' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className="card p-5">
            <div className="text-2xl mb-2">{a.icon}</div>
            <h3 className="font-medium text-[var(--text)] text-sm">{a.label}</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">{a.desc}</p>
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-3 border-b border-[var(--line)]">
          <h2 className="font-semibold text-[var(--text)] text-sm">Recent Registrations</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-soft)]/35">
            <tr>
              {['Name', 'Email', 'Role', 'Joined'].map(h => (
                <th key={h} className="text-left px-6 py-2 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {(recentUsers as any[]).map(u => (
              <tr key={u._id} className="hover:bg-[var(--brand-soft)]/25">
                <td className="px-6 py-2.5 font-medium text-[var(--text)]">{u.name}</td>
                <td className="px-6 py-2.5 text-[var(--muted)]">{u.email}</td>
                <td className="px-6 py-2.5">
                  <span className={`badge ${u.role === 'admin' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' : 'badge-gray'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-2.5 text-[var(--muted)]">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
