import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { UserSettingsClient } from '@/components/settings/UserSettingsClient';
import { connectDB } from '@/lib/db';
import { Exam, User } from '@psc/shared/models';
import { UPCOMING_EXAM_TRACKS } from '@/lib/exam-tracks';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  await connectDB();

  const [user, exams] = await Promise.all([
    User.findById(session.user.id)
      .select('name email preferences')
      .populate('preferences.target_exam_id', 'name slug description')
      .lean() as Promise<any>,
    Exam.find({ is_active: true }).select('_id name slug description').sort({ name: 1 }).lean() as Promise<any[]>,
  ]);

  return (
    <UserSettingsClient
      name={user?.name ?? ''}
      email={user?.email ?? ''}
      preferences={{
        language: user?.preferences?.language === 'ne' ? 'ne' : 'en',
        targetExam: user?.preferences?.target_exam_id
          ? {
              _id: String(user.preferences.target_exam_id._id),
              name: user.preferences.target_exam_id.name,
              slug: user.preferences.target_exam_id.slug,
              description: user.preferences.target_exam_id.description ?? '',
            }
          : null,
      }}
      activeExams={exams.map((exam) => ({
        _id: String(exam._id),
        name: exam.name,
        slug: exam.slug,
        description: exam.description ?? '',
      }))}
      examTracks={UPCOMING_EXAM_TRACKS}
    />
  );
}
