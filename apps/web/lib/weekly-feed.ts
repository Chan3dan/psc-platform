import { MockTest, Result } from '@psc/shared/models';

const KATHMANDU_OFFSET_MINUTES = 345;

function toKathmanduLocalDate(date = new Date()) {
  return new Date(date.getTime() + KATHMANDU_OFFSET_MINUTES * 60_000);
}

function formatDateKeyFromLocal(localDate: Date) {
  const year = localDate.getUTCFullYear();
  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localDateKeyToUtc(dateKey: string, endOfDay = false) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const localUtcMs = Date.UTC(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );
  return new Date(localUtcMs - KATHMANDU_OFFSET_MINUTES * 60_000);
}

function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days, 0, 0, 0, 0));
  return formatDateKeyFromLocal(next);
}

function seededIndex(length: number, seed: string) {
  if (length <= 0) return 0;
  return seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % length;
}

export function getKathmanduWeekWindows(date = new Date()) {
  const local = toKathmanduLocalDate(date);
  const localDay = local.getUTCDay();
  const todayKey = formatDateKeyFromLocal(local);
  const currentStartKey = addDaysToDateKey(todayKey, -localDay);
  const currentEndKey = addDaysToDateKey(currentStartKey, 6);
  const publishedStartKey = addDaysToDateKey(currentStartKey, -7);
  const publishedEndKey = addDaysToDateKey(currentStartKey, -1);

  return {
    todayKey,
    current: {
      key: currentStartKey,
      startKey: currentStartKey,
      endKey: currentEndKey,
      startUtc: localDateKeyToUtc(currentStartKey),
      endUtc: localDateKeyToUtc(currentEndKey, true),
    },
    published: {
      key: publishedStartKey,
      startKey: publishedStartKey,
      endKey: publishedEndKey,
      startUtc: localDateKeyToUtc(publishedStartKey),
      endUtc: localDateKeyToUtc(publishedEndKey, true),
    },
  };
}

export async function buildWeeklyFeedForExam(exam: any) {
  if (!exam?._id) {
    return {
      weeklyMock: null,
      publishedResult: null,
    };
  }

  const windows = getKathmanduWeekWindows();
  const mockTests = await MockTest.find({ exam_id: exam._id, is_active: true })
    .select('_id title slug duration_minutes total_questions total_marks attempt_count')
    .sort({ created_at: 1 })
    .lean() as any[];

  if (!mockTests.length) {
    return {
      weeklyMock: null,
      publishedResult: null,
    };
  }

  const activeMock = mockTests[seededIndex(mockTests.length, `${exam._id}:${windows.current.key}`)];
  const publishedMock = mockTests[seededIndex(mockTests.length, `${exam._id}:${windows.published.key}`)];

  const rows = await Result.find({
    test_type: 'mock',
    exam_id: exam._id,
    test_id: publishedMock._id,
    created_at: { $gte: windows.published.startUtc, $lte: windows.published.endUtc },
  })
    .select('score max_score accuracy_percent total_time_seconds created_at user_id')
    .populate('user_id', 'name email')
    .sort({ score: -1, total_time_seconds: 1, created_at: 1 })
    .limit(20)
    .lean() as any[];

  return {
    weeklyMock: {
      _id: String(activeMock._id),
      title: activeMock.title,
      duration_minutes: activeMock.duration_minutes,
      total_questions: activeMock.total_questions,
      total_marks: activeMock.total_marks,
      week_start: windows.current.startKey,
      week_end: windows.current.endKey,
      href: `/mock/${exam.slug}?test=${String(activeMock._id)}`,
    },
    publishedResult: {
      title: `${publishedMock.title} rankings`,
      week_start: windows.published.startKey,
      week_end: windows.published.endKey,
      published_at_label: `${addDaysToDateKey(windows.published.endKey, 1)} 00:00 NPT`,
      total_attempts: rows.length,
      rows: rows.map((result, index) => ({
        rank: index + 1,
        result_id: String(result._id),
        user_name: result.user_id?.name ?? 'Unknown user',
        user_email: result.user_id?.email ?? '',
        score: result.score,
        max_score: result.max_score,
        accuracy_percent: result.accuracy_percent ?? 0,
        total_time_seconds: result.total_time_seconds ?? 0,
        submitted_at: result.created_at,
      })),
    },
  };
}
