import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Question, Subject } from '@psc/shared/models';
import { ok, err, unauthorized, forbidden, serverError } from '@/lib/apiResponse';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();

    await connectDB();
    const { questions } = await req.json();

    if (!Array.isArray(questions) || questions.length === 0) {
      return err('questions array is required and must not be empty');
    }
    if (questions.length > 500) {
      return err('Maximum 500 questions per bulk upload');
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text?.trim()) return err(`Question ${i + 1}: question_text is required`);
      if (!Array.isArray(q.options) || q.options.length !== 4)
        return err(`Question ${i + 1}: must have exactly 4 options`);
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        if (!opt || typeof opt.text !== 'string' || !opt.text.trim()) {
          return err(`Question ${i + 1}: option ${j + 1} text is required`);
        }
      }
      if (typeof q.correct_answer !== 'number' || q.correct_answer < 0 || q.correct_answer > 3)
        return err(`Question ${i + 1}: correct_answer must be 0, 1, 2, or 3`);
      if (!q.exam_id) return err(`Question ${i + 1}: exam_id is required`);
      if (!q.subject_id) return err(`Question ${i + 1}: subject_id is required`);
    }

    const normalized = questions.map((q) => ({
      exam_id: q.exam_id,
      subject_id: q.subject_id,
      question_text: String(q.question_text).trim(),
      question_image_url: q.question_image_url ? String(q.question_image_url).trim() : undefined,
      options: q.options.map((o: any, idx: number) => ({
        index: typeof o.index === 'number' ? o.index : idx,
        text: String(o.text ?? '').trim(),
        image_url: o.image_url ? String(o.image_url).trim() : undefined,
      })),
      correct_answer: Number(q.correct_answer),
      explanation: q.explanation ? String(q.explanation).trim() : '',
      difficulty: q.difficulty ?? 'medium',
      year: q.year ? Number(q.year) : undefined,
      tags: Array.isArray(q.tags) ? q.tags.map((t: any) => String(t).trim()).filter(Boolean) : [],
      is_active: true,
    }));

    const result = await Question.insertMany(normalized, { ordered: false });

    // Update subject question counts (non-blocking)
    const subjectIds = [...new Set(normalized.map((q) => q.subject_id?.toString()))];
    Promise.all(
      subjectIds.map(async (sid) => {
        const count = await Question.countDocuments({ subject_id: sid, is_active: true });
        await Subject.findByIdAndUpdate(sid, { question_count: count });
      })
    ).catch(console.error);

    return ok({
      inserted: result.length,
      message: `${result.length} questions uploaded successfully`,
    });
  } catch (e: any) {
    // Handle partial insert (ordered: false)
    if (e.code === 11000) {
      return ok({ inserted: e.result?.nInserted ?? 0, message: 'Some duplicates skipped' });
    }
    return serverError(e);
  }
}
