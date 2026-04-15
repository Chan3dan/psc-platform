import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Exam, MockTest, Question, Subject } from '@psc/shared/models';
import { ok, err, unauthorized, forbidden, serverError } from '@/lib/apiResponse';
import { Types } from 'mongoose';

function normalizeNegativePercent(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 20;
  return value <= 1 ? value * 100 : value;
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();

    const body = await req.json();
    const {
      exam_id,
      title,
      slug,
      duration_minutes = 45,
      total_marks,
      negative_marking = 20,
      default_subject_id,
      questions = [],
    } = body ?? {};

    if (!exam_id || !Types.ObjectId.isValid(exam_id)) return err('Valid exam_id is required');
    if (!title || !String(title).trim()) return err('title is required');
    if (!Array.isArray(questions) || questions.length === 0) return err('questions array is required');
    if (questions.length > 500) return err('Maximum 500 questions per import');
    if (default_subject_id && !Types.ObjectId.isValid(default_subject_id)) return err('default_subject_id is invalid');

    await connectDB();

    const exam = await Exam.findById(exam_id).select('_id total_marks total_questions').lean() as any;
    if (!exam?._id) return err('Exam not found');

    const finalSlug = String(slug ?? '').trim() || slugify(String(title));
    if (!finalSlug) return err('Could not generate slug. Please provide title/slug.');

    const existing = await MockTest.findOne({ exam_id, slug: finalSlug }).lean();
    if (existing) return err('Mock slug already exists for this exam');

    const subjects = await Subject.find({ exam_id, is_active: true }).select('_id name').lean() as any[];
    const byName = new Map<string, string>();
    for (const s of subjects) byName.set(String(s.name).trim().toLowerCase(), String(s._id));

    const normalized = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q?.question_text || !String(q.question_text).trim()) return err(`Question ${i + 1}: question_text required`);
      if (!Array.isArray(q.options) || q.options.length !== 4) return err(`Question ${i + 1}: exactly 4 options required`);
      if (typeof q.correct_answer !== 'number' || q.correct_answer < 0 || q.correct_answer > 3) {
        return err(`Question ${i + 1}: correct_answer must be 0-3`);
      }

      let subject_id = q.subject_id;
      if (!subject_id && q.subject_name) subject_id = byName.get(String(q.subject_name).trim().toLowerCase());
      if (!subject_id && q.subject) subject_id = byName.get(String(q.subject).trim().toLowerCase());
      if (!subject_id) subject_id = default_subject_id;
      if (!subject_id || !Types.ObjectId.isValid(String(subject_id))) {
        return err(`Question ${i + 1}: subject missing. Provide subject_name in file or select fallback subject.`);
      }

      normalized.push({
        exam_id,
        subject_id,
        question_text: String(q.question_text).trim(),
        question_image_url: q.question_image_url ? String(q.question_image_url).trim() : undefined,
        options: q.options.map((o: any, idx: number) => ({
          index: typeof o.index === 'number' ? o.index : idx,
          text: String(o?.text ?? '').trim(),
          image_url: o?.image_url ? String(o.image_url).trim() : undefined,
        })),
        correct_answer: Number(q.correct_answer),
        explanation: q.explanation ? String(q.explanation).trim() : '',
        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
        year: q.year ? Number(q.year) : undefined,
        tags: Array.isArray(q.tags) ? q.tags.map((t: any) => String(t).trim()).filter(Boolean) : ['past-question'],
        is_active: true,
      });
    }

    const inserted = await Question.insertMany(normalized, { ordered: true });
    const insertedIds = inserted.map((d: any) => d._id);

    const qCount = inserted.length;
    const marksPerQ = exam.total_questions ? exam.total_marks / exam.total_questions : 2;
    const computedTotalMarks = total_marks ? Number(total_marks) : Number((marksPerQ * qCount).toFixed(2));

    const mock = await MockTest.create({
      exam_id,
      title: String(title).trim(),
      slug: finalSlug,
      duration_minutes: Number(duration_minutes),
      total_questions: qCount,
      total_marks: computedTotalMarks,
      negative_marking: normalizeNegativePercent(Number(negative_marking)),
      config: {
        auto_generate: false,
        question_ids: insertedIds,
        subject_distribution: [],
      },
      is_active: true,
    });

    const touchedSubjectIds = [...new Set(normalized.map((q) => String(q.subject_id)))];
    await Promise.all(
      touchedSubjectIds.map(async (sid) => {
        const count = await Question.countDocuments({ subject_id: sid, is_active: true });
        await Subject.findByIdAndUpdate(sid, { question_count: count });
      })
    );

    const fresh = await MockTest.findById(mock._id)
      .populate('exam_id', 'name slug')
      .lean();

    return ok({
      inserted_questions: qCount,
      mock: fresh,
    });
  } catch (e) {
    return serverError(e);
  }
}
