import { getServerSession } from 'next-auth';
import { LeaderboardClient } from '@/components/leaderboard/LeaderboardClient';
import { authOptions } from '@/lib/auth';
import { getUserPreferences } from '@/lib/user-preferences';

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  const preferences = session ? await getUserPreferences(session.user.id) : { targetExam: null };

  return <LeaderboardClient initialExamId={preferences.targetExam?._id ?? ''} />;
}
