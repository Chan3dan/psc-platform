import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Exam, MockTest, Question, Subject } from '@psc/shared/models';
import { ok, err, unauthorized, notFound, serverError } from '@/lib/apiResponse';
import { shuffleArray } from '@psc/shared/utils/scoring';
import { Types } from 'mongoose';

function normalizeNegativePercent(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 20;
  return value <= 1 ? value * 100 : value;
}

function normalizeOptions(raw: any[] = []) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((opt: any, idx: number) => {
      if (typeof opt === 'string') return { index: idx, text: opt };
      if (opt && typeof opt === 'object') {
        return {
          index: typeof opt.index === 'number' ? opt.index : idx,
          text: typeof opt.text === 'string' ? opt.text : '',
          image_url: opt.image_url ?? undefined,
        };
      }
      return { index: idx, text: '' };
    })
    .filter((o: any) => typeof o.text === 'string');
}

function pickRandom<T>(arr: T[], count: number) {
  if (count <= 0 || arr.length === 0) return [] as T[];
  const shuffled = shuffleArray([...arr]);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    await connectDB();
    const body = await req.json();
    const {
      test_id,
      test_type = 'mock',
      subject_id,
      exam_id,
      count = 20,
      difficulty,
      question_ids = [],
    } = body;

    let questions: any[] = [];
    let config: Record<string, unknown> = {};

    if (test_type === 'mock') {
      // ── MOCK TEST MODE ──────────────────────────────────────
      if (!test_id) return err('test_id is required for mock test');

      const mockTest = await MockTest.findById(test_id)
        .populate('exam_id')
        .lean() as any;
      if (!mockTest) return notFound('Mock test');

      config = {
        test_id: mockTest._id.toString(),
        exam_id: mockTest.exam_id._id.toString(),
        title: mockTest.title,
        duration_minutes: mockTest.duration_minutes,
        total_marks: mockTest.total_marks,
        total_questions: mockTest.total_questions,
        negative_marking: parseFloat((((mockTest.total_marks / mockTest.total_questions) * normalizeNegativePercent(mockTest.negative_marking)) / 100).toFixed(4)),
        negative_marking_percent: normalizeNegativePercent(mockTest.negative_marking),
        marks_per_question: mockTest.total_marks / mockTest.total_questions,
        test_type: 'mock',
      };

      if (mockTest.config.auto_generate) {
        for (const dist of mockTest.config.subject_distribution) {
          const total = Math.max(0, Number(dist.count ?? 0));
          if (!total) continue;

          const baseMatch: Record<string, unknown> = { is_active: true };
          if (Types.ObjectId.isValid(String(dist.subject_id))) {
            baseMatch.subject_id = new Types.ObjectId(String(dist.subject_id));
          } else {
            baseMatch.subject_id = dist.subject_id;
          }

          const subjectPool = await Question.find(baseMatch).lean();
          if (subjectPool.length === 0) continue;

          const easyPool = subjectPool.filter((q: any) => q.difficulty === 'easy');
          const mediumPool = subjectPool.filter((q: any) => q.difficulty === 'medium');
          const hardPool = subjectPool.filter((q: any) => q.difficulty === 'hard');

          const easyPct = Number(dist.difficulty_split?.easy ?? 0);
          const mediumPct = Number(dist.difficulty_split?.medium ?? 0);
          const hardPct = Number(dist.difficulty_split?.hard ?? 0);

          let easyTarget = Math.floor((easyPct / 100) * total);
          let mediumTarget = Math.floor((mediumPct / 100) * total);
          let hardTarget = total - easyTarget - mediumTarget;
          if (hardTarget < 0) hardTarget = 0;

          const selectedEasy = pickRandom(easyPool, easyTarget);
          const selectedMedium = pickRandom(mediumPool, mediumTarget);
          const selectedHard = pickRandom(hardPool, hardTarget);

          const chosen = [...selectedEasy, ...selectedMedium, ...selectedHard];
          const chosenIds = new Set(chosen.map((q: any) => String(q._id)));
          if (chosen.length < total) {
            const remainderPool = subjectPool.filter((q: any) => !chosenIds.has(String(q._id)));
            const remainder = pickRandom(remainderPool, total - chosen.length);
            chosen.push(...remainder);
          }

          questions.push(...chosen.slice(0, total));
        }

        // Keep the mock question count consistent with configured total_questions.
        const targetTotal = Number(mockTest.total_questions ?? 0);
        const uniqueMap = new Map<string, any>();
        for (const q of questions) uniqueMap.set(String(q._id), q);
        questions = Array.from(uniqueMap.values());

        if (targetTotal > 0 && questions.length < targetTotal) {
          const remaining = targetTotal - questions.length;
          const excludeIds = questions.map((q: any) => q._id);
          const extra = await Question.aggregate([
            {
              $match: {
                exam_id: mockTest.exam_id._id,
                is_active: true,
                _id: { $nin: excludeIds },
              },
            },
            { $sample: { size: remaining } },
          ]);
          questions.push(...extra);
        }

        if (targetTotal > 0 && questions.length > targetTotal) {
          questions = shuffleArray(questions).slice(0, targetTotal);
        }

        const finalTotal = questions.length;
        const marksPerQuestion = finalTotal > 0
          ? parseFloat((Number(mockTest.total_marks) / Number(mockTest.total_questions || finalTotal)).toFixed(4))
          : 0;
        config = {
          ...config,
          total_questions: finalTotal,
          total_marks: parseFloat((marksPerQuestion * finalTotal).toFixed(2)),
          marks_per_question: marksPerQuestion,
        };
      } else {
        questions = await Question.find({
          _id: { $in: mockTest.config.question_ids },
        }).lean();
      }

      MockTest.findByIdAndUpdate(test_id, { $inc: { attempt_count: 1 } }).exec();

    } else {
      // ── PRACTICE / DRILL MODE ────────────────────────────────
      // Supports: subject_id (topic practice), exam_id only (drill/random), or both
      const filter: Record<string, unknown> = { is_active: true };
      const customIds = Array.isArray(question_ids)
        ? question_ids.filter((id: unknown) => typeof id === 'string' && Types.ObjectId.isValid(id))
        : [];
      let resolvedExamId = exam_id;
      if (!resolvedExamId && subject_id) {
        const subject = await Subject.findById(subject_id).select('exam_id').lean() as any;
        resolvedExamId = subject?.exam_id?.toString() ?? null;
      }

      if (subject_id && Types.ObjectId.isValid(subject_id)) filter.subject_id = new Types.ObjectId(subject_id);
      if (resolvedExamId && !subject_id && Types.ObjectId.isValid(resolvedExamId)) {
        filter.exam_id = new Types.ObjectId(resolvedExamId);
      }
      if (!subject_id && !exam_id && customIds.length === 0) {
        return err('subject_id or exam_id is required for practice');
      }
      if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) filter.difficulty = difficulty;

      if (customIds.length > 0) {
        const docs = await Question.find({
          _id: { $in: customIds.map((id: string) => new Types.ObjectId(id)) },
          is_active: true,
        }).lean();
        if (docs.length === 0) return err('No questions found for the provided bookmark list.');
        const firstExamId = (docs[0] as any)?.exam_id?.toString?.() ?? null;
        const sameExamDocs = firstExamId
          ? docs.filter((q: any) => q?.exam_id?.toString?.() === firstExamId)
          : docs;
        questions = shuffleArray(sameExamDocs).slice(0, 50);
        if (!resolvedExamId) resolvedExamId = firstExamId;
      } else {
        const safeCount = Math.min(Math.max(1, count), 50);
        questions = await Question.aggregate([
          { $match: filter },
          { $sample: { size: safeCount } },
        ]);
      }

      const safeCount = Math.min(Math.max(1, questions.length || count), 50);
      const examDoc = resolvedExamId
        ? await Exam.findById(resolvedExamId).select('total_marks total_questions negative_marking').lean() as any
        : null;
      const marksPerQuestion = examDoc?.total_questions
        ? parseFloat((examDoc.total_marks / examDoc.total_questions).toFixed(4))
        : 1;
      const negativePercent = normalizeNegativePercent(examDoc?.negative_marking);
      const negativePerWrong = parseFloat(((marksPerQuestion * negativePercent) / 100).toFixed(4));

      config = {
        test_id: null,
        exam_id: resolvedExamId ?? null,
        title: customIds.length > 0 ? 'Bookmark Practice Session' : 'Practice Session',
        duration_minutes: Math.ceil(safeCount * 1.5), // ~1.5 min per question
        total_marks: parseFloat((safeCount * marksPerQuestion).toFixed(2)),
        total_questions: safeCount,
        negative_marking: negativePerWrong,
        negative_marking_percent: negativePercent,
        marks_per_question: marksPerQuestion,
        test_type: 'practice',
      };
    }

    if (questions.length === 0) {
      return err('No questions found for the selected criteria. Please add more questions first.');
    }

    const shuffled = shuffleArray(questions);

    // Strip answers — NEVER send correct_answer to client during test
    const sanitized = shuffled
      .map((q) => {
        const options = normalizeOptions(q.options);
        if (!q?._id || !q?.question_text || options.length < 2) return null;
        const normalizedSubjectId =
          typeof q.subject_id === 'string'
            ? q.subject_id
            : q.subject_id?._id
              ? String(q.subject_id._id)
              : String(q.subject_id ?? '');
        return {
          _id: String(q._id),
          question_text: q.question_text,
          question_image_url: q.question_image_url ?? null,
          options,
          subject_id: normalizedSubjectId,
          difficulty: q.difficulty,
        };
      })
      .filter(Boolean) as Array<{
        _id: string;
        question_text: string;
        question_image_url: string | null;
        options: { index: number; text: string; image_url?: string }[];
        subject_id: string;
        difficulty: string;
      }>;

    if (sanitized.length === 0) {
      return err('No valid questions found for this test. Please regenerate mocks or review question data.');
    }

    return ok({
      config: {
        ...config,
        total_questions: sanitized.length,
      },
      questions: sanitized,
      total: sanitized.length,
      started_at: new Date().toISOString(),
    });
  } catch (e) {
    return serverError(e);
  }
}
