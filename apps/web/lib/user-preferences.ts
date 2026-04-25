import { User } from '@psc/shared/models';
import { connectDB } from '@/lib/db';

export async function getUserPreferences(userId: string) {
  await connectDB();
  const user = (await User.findById(userId)
    .select('preferences')
    .populate('preferences.target_exam_id', 'name slug description')
    .lean()) as any;

  return {
    language: user?.preferences?.language === 'ne' ? 'ne' : 'en',
    targetExam: user?.preferences?.target_exam_id
      ? {
          _id: String(user.preferences.target_exam_id._id),
          name: user.preferences.target_exam_id.name,
          slug: user.preferences.target_exam_id.slug,
          description: user.preferences.target_exam_id.description ?? '',
        }
      : null,
  };
}
