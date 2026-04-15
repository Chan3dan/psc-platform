import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { StudyPlan, User } from '@psc/shared/models';
import { ok, err, unauthorized, notFound, serverError } from '@/lib/apiResponse';
import { updateStreak } from '@psc/shared/utils/planner';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const { day_index, task_index } = await req.json();

    if (day_index === undefined || task_index === undefined) {
      return err('day_index and task_index are required');
    }

    const plan = await StudyPlan.findOne({
      _id: params.id,
      user_id: session.user.id,
    });
    if (!plan) return notFound('Study plan');

    const day = plan.daily_schedule[day_index];
    if (!day) return err('Day not found', 404);

    const task = day.tasks[task_index];
    if (!task) return err('Task not found', 404);

    // Mark task complete
    task.is_completed = true;
    task.completed_at = new Date();

    // Check if all tasks in the day are done
    const allDone = day.tasks.every((t: any) => t.is_completed);
    if (allDone && !day.is_completed) {
      day.is_completed = true;

      // Update streak
      const { new_streak } = updateStreak(plan.last_active_date, plan.streak_days);
      plan.streak_days = new_streak;
      plan.last_active_date = new Date();

      // Update user stats
      const dbUser = await User.findById(session.user.id).select('stats').lean() as any;
      await User.findByIdAndUpdate(session.user.id, {
        $set: {
          'stats.current_streak': new_streak,
          'stats.last_active': new Date(),
          ...(new_streak > (dbUser?.stats?.longest_streak ?? 0)
            ? { 'stats.longest_streak': new_streak }
            : {}),
        },
      });
    }

    await plan.save();
    return ok(plan.toJSON());
  } catch (e) {
    return serverError(e);
  }
}
