import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Question } from '@psc/shared/models';
import { ok, err, unauthorized, forbidden, serverError } from '@/lib/apiResponse';
import { Types } from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const subject_id = searchParams.get('subject_id');
    const exam_id = searchParams.get('exam_id');
    const difficulty = searchParams.get('difficulty');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const page = parseInt(searchParams.get('page') ?? '1');
    const random = searchParams.get('random') === 'true';
    const tag = searchParams.get('tag');
    const question_id = searchParams.get('question_id');
    const exclude_ids = (searchParams.get('exclude_ids') ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (!subject_id && !exam_id) {
      return err('subject_id or exam_id is required');
    }

    await connectDB();

    const filter: Record<string, unknown> = { is_active: true };
    if (subject_id && Types.ObjectId.isValid(subject_id)) filter.subject_id = new Types.ObjectId(subject_id);
    if (exam_id && Types.ObjectId.isValid(exam_id)) filter.exam_id = new Types.ObjectId(exam_id);
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) filter.difficulty = difficulty;
    if (tag) filter.tags = tag;
    if (question_id && Types.ObjectId.isValid(question_id)) {
      filter._id = new Types.ObjectId(question_id);
    } else if (exclude_ids.length) {
      const validExclude = exclude_ids
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));
      if (validExclude.length) filter._id = { $nin: validExclude };
    }

    if (random) {
      const questions = await Question.aggregate([
        { $match: filter },
        { $sample: { size: limit } },
        {
          $project: {
            correct_answer: 0,
            explanation: 0,
          },
        },
      ]);
      return ok({ data: questions, total: questions.length });
    }

    const [total, questions] = await Promise.all([
      Question.countDocuments(filter),
      Question.find(filter)
        .select('-correct_answer -explanation')
        .populate('subject_id', 'name slug')
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return ok({
      data: questions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return serverError(e);
  }
}
