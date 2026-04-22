import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Result } from '@psc/shared/models';
import { ok, err, unauthorized, serverError } from '@/lib/apiResponse';
import { cacheGet, cacheSet, CacheKeys } from '@/lib/redis';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return unauthorized();

    const { searchParams } = req.nextUrl;
    const test_id = searchParams.get('test_id');
    const exam_id = searchParams.get('exam_id');
    const period = (searchParams.get('period') ?? 'all') as 'all' | 'week' | 'month';
    if (!['all', 'week', 'month'].includes(period)) return err('period must be all|week|month');
    const limit = 20;

    if (!test_id && !exam_id) return err('test_id or exam_id is required');

    const scope: 'test' | 'exam' = test_id ? 'test' : 'exam';
    const cacheKey = CacheKeys.leaderboard(test_id ?? exam_id!, period, scope);
    const cached = await cacheGet(cacheKey);
    if (cached) return ok(cached);

    await connectDB();

    const matchFilter: Record<string, unknown> = {};
    if (test_id) matchFilter.test_id = new mongoose.Types.ObjectId(test_id);
    if (exam_id) matchFilter.exam_id = new mongoose.Types.ObjectId(exam_id);

    if (period === 'week') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      matchFilter.created_at = { $gte: d };
    } else if (period === 'month') {
      const d = new Date(); d.setMonth(d.getMonth() - 1);
      matchFilter.created_at = { $gte: d };
    }

    const [leaderboard, participantAgg] = await Promise.all([
      Result.aggregate([
      { $match: matchFilter },
      { $sort: { score: -1, created_at: 1 } },
      { $group: {
        _id: '$user_id',
        score: { $first: '$score' },
        max_score: { $first: '$max_score' },
        accuracy_percent: { $first: '$accuracy_percent' },
        total_time_seconds: { $first: '$total_time_seconds' },
        created_at: { $first: '$created_at' },
      }},
      { $sort: { score: -1, total_time_seconds: 1 } },
      { $limit: limit },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: {
        _id: 0,
        user_id: '$_id',
        name: {
          $let: {
            vars: { parts: { $split: ['$user.name', ' '] } },
            in: {
              $concat: [
                { $arrayElemAt: ['$$parts', 0] }, ' ',
                { $cond: {
                  if: { $gt: [{ $size: '$$parts' }, 1] },
                  then: { $concat: [{ $substrCP: [{ $arrayElemAt: ['$$parts', 1] }, 0, 1] }, '.'] },
                  else: '',
                }},
              ],
            },
          },
        },
        score: 1,
        max_score: 1,
        accuracy: '$accuracy_percent',
        time_taken: '$total_time_seconds',
        created_at: 1,
      }},
      ]),
      Result.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$user_id' } },
        { $count: 'total' },
      ]),
    ]);

    const ranked = leaderboard.map((entry, i) => ({ ...entry, rank: i + 1 }));

    // Find current user's rank if not in top list
    const userInTop = ranked.find((e: any) => String(e.user_id) === session.user.id);
    let current_user_rank = userInTop ?? null;

    if (!userInTop) {
      const userBest = await Result.findOne({ ...matchFilter, user_id: session.user.id })
        .sort({ score: -1 })
        .select('score max_score accuracy_percent total_time_seconds')
        .lean() as any;
      if (userBest) {
        const above = await Result.aggregate([
          { $match: matchFilter },
          { $sort: { score: -1, created_at: 1 } },
          { $group: { _id: '$user_id', score: { $first: '$score' } } },
          { $match: { score: { $gt: userBest.score } } },
          { $count: 'total' },
        ]);
        const rank = (above[0]?.total ?? 0) + 1;
        current_user_rank = {
          rank,
          user_id: session.user.id,
          name: 'You',
          score: userBest.score,
          max_score: userBest.max_score,
          accuracy: userBest.accuracy_percent,
          time_taken: userBest.total_time_seconds,
        };
      }
    }

    const data = {
      leaderboard: ranked,
      current_user_rank,
      current_user_id: session.user.id,
      total_participants: participantAgg[0]?.total ?? ranked.length,
    };
    await cacheSet(cacheKey, data, 300);
    return ok(data);
  } catch (e) {
    return serverError(e);
  }
}
