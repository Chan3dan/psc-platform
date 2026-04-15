import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Exam, Subject, Result, StudyPlan } from '@psc/shared/models';
import { ok, err, created, unauthorized, notFound, serverError } from '@/lib/apiResponse';
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
    const { exam_id, target_date, daily_hours, preferences } = await req.json();

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

    const plan = generateStudyPlan({
      exam_id,
      target_date: targetDateObj,
      daily_hours,
      subjects: subjects.map((s: any) => ({
        subject_id: s._id.toString(),
        subject_name: s.name,
        weightage_percent:
          syllabusWeights.get(String(s.name).toLowerCase().replace(/\s+/g, ' ').trim()) ??
          (s.weightage_percent ||
          Math.floor(100 / subjects.length)),
      })),
      performance: analytics.subject_performance,
      preferences,
    });

    // Deactivate any existing active plan for this exam
    await StudyPlan.updateMany(
      { user_id: session.user.id, exam_id, is_active: true },
      { is_active: false }
    );

    const savedPlan = await StudyPlan.create({
      user_id: session.user.id,
      exam_id,
      title: plan.title,
      target_date: plan.target_date,
      daily_hours: plan.daily_hours,
      daily_schedule: plan.daily_schedule,
      streak_days: 0,
      is_active: true,
    });

    return created(savedPlan);
  } catch (e) {
    return serverError(e);
  }
}
