import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Exam, Subject, Result, StudyPlan } from '@psc/shared/models';
import { err, created, unauthorized, notFound, serverError } from '@/lib/apiResponse';
import { generateStudyPlan } from '@psc/shared/utils/planner';
import { generateAnalytics } from '@psc/shared/utils/analytics';

function parseSyllabusWeights(outline?: string) {
  if (!outline) return new Map<string, number>();
  const map = new Map<string, number>();
  const lines = outline.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^(.+?)\s*[:\-]\s*(\d+(?:\.\d+)?)\s*%/);
    if (!m) continue;
    map.set(m[1].toLowerCase().replace(/\s+/g, ' ').trim(), Number(m[2]));
  }
  return map;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const body = await req.json();
    const exam_id = body.exam_id ?? body.examId;
    const target_date = body.target_date ?? body.examDate ?? body.exam_date;
    const daily_hours = Number(body.daily_hours ?? body.dailyHours);
    const preferences = body.preferences ?? {};
    const weakTopicSlugs: string[] = body.weakTopicSlugs ?? body.weak_topics ?? [];

    if (!exam_id) return err('exam_id is required');
    if (!target_date) return err('target_date is required');
    if (!daily_hours || daily_hours < 0.5) return err('daily_hours must be at least 0.5');

    const targetDateObj = new Date(target_date);
    if (isNaN(targetDateObj.getTime())) return err('Invalid target_date');
    if (targetDateObj <= new Date()) return err('target_date must be in the future');

    const [exam, subjects, recentResults] = await Promise.all([
      Exam.findById(exam_id).lean(),
      Subject.find({ exam_id, is_active: true }).lean(),
      Result.find({ user_id: session.user.id, exam_id })
        .sort({ created_at: -1 })
        .limit(10)
        .lean(),
    ]);

    if (!exam) return notFound('Exam');
    if (subjects.length === 0) return err('No subjects found for this exam');

    const analytics = generateAnalytics(recentResults as any);
    const syllabusWeights = parseSyllabusWeights((exam as any).syllabus_outline);

    const subjectMeta = new Map<string, any>();
    const subjectsForPlan = subjects.map((s: any) => {
      const slug = String(s.slug ?? s.name.toLowerCase().replace(/\s+/g, '-'));
      const baseWeight =
        syllabusWeights.get(String(s.name).toLowerCase().replace(/\s+/g, ' ').trim()) ??
        (s.weightage_percent || Math.floor(100 / subjects.length));
      const weakBoost = weakTopicSlugs.includes(slug) ? 1.65 : 1;
      subjectMeta.set(String(s._id), {
        slug,
        name: s.name,
      });
      return {
        subject_id: s._id.toString(),
        subject_name: s.name,
        weightage_percent: Math.round(baseWeight * weakBoost),
      };
    });

    const plan = generateStudyPlan({
      exam_id,
      target_date: targetDateObj,
      daily_hours,
      subjects: subjectsForPlan,
      performance: analytics.subject_performance,
      preferences,
    });

    const dailySchedule = plan.daily_schedule.map((day) => {
      const enrichedTasks = day.tasks.map((task) => {
        const meta = subjectMeta.get(String(task.subject_id));
        const minimumQuestions =
          task.task_type === 'mock'
            ? 0
            : Math.max(5, Number((task as any).minimum_questions ?? Math.ceil((task.question_count || 5) * 0.75)));
        const minimumMinutes =
          task.task_type === 'mock'
            ? Math.max(30, Math.round(task.duration_minutes * 0.55))
            : Math.max(15, Number((task as any).minimum_minutes ?? Math.round(task.duration_minutes * 0.6)));
        return {
          ...task,
          subject_slug: meta?.slug ?? String(task.subject_name).toLowerCase().replace(/\s+/g, '-'),
          verification_mode: task.task_type === 'mock' ? 'mock' : task.task_type === 'revision' ? 'revision' : 'questions',
          minimum_questions: minimumQuestions,
          minimum_minutes: minimumMinutes,
          verified_questions: 0,
          verified_minutes: 0,
          verification_source: '',
        };
      });
      const firstStudyTask = enrichedTasks.find((task) => task.task_type !== 'mock');
          const notesTask = firstStudyTask
        ? {
            subject_id: firstStudyTask.subject_id,
            subject_name: firstStudyTask.subject_name,
            subject_slug: `${firstStudyTask.subject_slug}-notes`,
            task_type: 'notes',
            duration_minutes: Math.min(30, Math.max(15, Math.round(Number(firstStudyTask.duration_minutes ?? 45) * 0.35))),
            question_count: 0,
            verification_mode: 'notes',
            minimum_questions: 0,
            minimum_minutes: Math.min(25, Math.max(10, Math.round(Number(firstStudyTask.duration_minutes ?? 45) * 0.25))),
            verified_questions: 0,
            verified_minutes: 0,
            verification_source: '',
          }
        : null;

      return {
        ...day,
        tasks: notesTask ? [...enrichedTasks, notesTask] : enrichedTasks,
        total_minutes: day.total_minutes + Number(notesTask?.duration_minutes ?? 0),
        verified_question_count: 0,
        verified_minutes: 0,
      };
    });

    // Deactivate any existing active plan for this exam
    await StudyPlan.updateMany(
      { user_id: session.user.id, exam_id, is_active: true },
      { is_active: false }
    );

    const savedPlan = await StudyPlan.create({
      user_id: session.user.id,
      exam_id,
      title: `${(exam as any).name} ${plan.title}`,
      target_date: plan.target_date,
      daily_hours: plan.daily_hours,
      daily_schedule: dailySchedule,
      streak_days: 0,
      is_active: true,
    });

    return created(savedPlan);
  } catch (e) {
    return serverError(e);
  }
}
