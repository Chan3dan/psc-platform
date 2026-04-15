// ── NOTES PAGE ────────────────────────────────────────────────
// File: app/(dashboard)/notes/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Exam } from '@psc/shared/models';
import { NotesClient } from '@/components/notes/NotesClient';

export default async function NotesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  await connectDB();
  const exams = await Exam.find({ is_active: true }).select('_id name slug').lean();
  return (
    <div className="page-wrap max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Study Notes</h1>
        <p className="text-sm text-[var(--muted)] mt-1">PDFs and rich-text notes for each subject.</p>
      </div>
      <NotesClient exams={JSON.parse(JSON.stringify(exams))} />
    </div>
  );
}
