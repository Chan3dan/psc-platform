import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { MockTest } from '@psc/shared/models';
import { ok, err, unauthorized, forbidden, notFound, serverError } from '@/lib/apiResponse';
import { Types } from 'mongoose';

function normalizeNegativePercent(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 20;
  return value <= 1 ? value * 100 : value;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();

    const body = await req.json();
    await connectDB();
    if (!Types.ObjectId.isValid(params.id)) return err('Invalid mock test id');

    const updateSet: Record<string, any> = {};
    if (typeof body.is_active === 'boolean') updateSet.is_active = body.is_active;
    if (body.title) updateSet.title = String(body.title).trim();
    if (body.slug) updateSet.slug = String(body.slug).trim();
    if (body.exam_id) {
      if (!Types.ObjectId.isValid(body.exam_id)) return err('Invalid exam_id');
      updateSet.exam_id = body.exam_id;
    }
    if (body.duration_minutes !== undefined) updateSet.duration_minutes = Number(body.duration_minutes);
    if (body.total_questions !== undefined) updateSet.total_questions = Number(body.total_questions);
    if (body.total_marks !== undefined) updateSet.total_marks = Number(body.total_marks);
    if (body.negative_marking !== undefined) {
      updateSet.negative_marking = normalizeNegativePercent(Number(body.negative_marking));
    }

    if (body.subject_distribution !== undefined) {
      if (!Array.isArray(body.subject_distribution) || body.subject_distribution.length === 0) {
        return err('At least one subject distribution is required');
      }
      const parsedDistribution = body.subject_distribution.map((d: any) => ({
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
      updateSet['config.auto_generate'] = true;
      updateSet['config.subject_distribution'] = parsedDistribution;
    }

    const updated = await MockTest.findByIdAndUpdate(
      params.id,
      { $set: updateSet },
      { new: true }
    )
      .populate('exam_id', 'name slug')
      .populate('config.subject_distribution.subject_id', 'name slug')
      .lean();

    if (!updated) return notFound('Mock test');
    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();
    if (session.user.role !== 'admin') return forbidden();

    await connectDB();
    const deleted = await MockTest.findByIdAndDelete(params.id).lean();
    if (!deleted) return notFound('Mock test');
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
