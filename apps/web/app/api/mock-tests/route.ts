import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { MockTest } from '@psc/shared/models';
import { ok, created, err, unauthorized, forbidden, serverError } from '@/lib/apiResponse';
import { Types } from 'mongoose';

function normalizeNegativePercent(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 20;
  return value <= 1 ? value * 100 : value;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();

    await connectDB();
    const mocks = await MockTest.find({})
      .populate('exam_id', 'name slug')
      .populate('config.subject_distribution.subject_id', 'name slug')
      .sort({ created_at: -1 })
      .lean();
    return ok(mocks);
  } catch (e) {
    return serverError(e);
  }
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
      duration_minutes,
      total_questions,
      total_marks,
      negative_marking,
      is_active = true,
      subject_distribution = [],
    } = body ?? {};

    if (!exam_id || !title || !slug) return err('exam_id, title and slug are required');
    if (!Types.ObjectId.isValid(exam_id)) return err('Invalid exam_id');
    if (!Array.isArray(subject_distribution) || subject_distribution.length === 0) {
      return err('At least one subject distribution is required');
    }

    const parsedDistribution = subject_distribution.map((d: any) => ({
      subject_id: d.subject_id,
      count: Number(d.count ?? 0),
      difficulty_split: {
        easy: Number(d?.difficulty_split?.easy ?? 40),
        medium: Number(d?.difficulty_split?.medium ?? 40),
        hard: Number(d?.difficulty_split?.hard ?? 20),
      },
    }));

    const invalid = parsedDistribution.find((d: any) => !d.subject_id || !Types.ObjectId.isValid(d.subject_id) || d.count <= 0);
    if (invalid) return err('Invalid subject distribution rows');

    await connectDB();
    const exists = await MockTest.findOne({ exam_id, slug });
    if (exists) return err('Mock slug already exists for this exam');

    const doc = await MockTest.create({
      exam_id,
      title: String(title).trim(),
      slug: String(slug).trim(),
      duration_minutes: Number(duration_minutes ?? 45),
      total_questions: Number(total_questions ?? 50),
      total_marks: Number(total_marks ?? 100),
      negative_marking: normalizeNegativePercent(Number(negative_marking ?? 20)),
      config: {
        auto_generate: true,
        subject_distribution: parsedDistribution,
      },
      is_active: Boolean(is_active),
    });

    const fresh = await MockTest.findById(doc._id)
      .populate('exam_id', 'name slug')
      .populate('config.subject_distribution.subject_id', 'name slug')
      .lean();
    return created(fresh);
  } catch (e) {
    return serverError(e);
  }
}
