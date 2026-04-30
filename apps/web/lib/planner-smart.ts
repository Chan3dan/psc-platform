import { Result, RevisionLog, StudyPlan, StudySession, Subject, User } from '@psc/shared/models';

export type PlannerSubject = {
  _id: string;
  name: string;
  slug: string;
  weightage_percent?: number;
};

export type PlannerExam = {
  _id: string;
  name: string;
  slug: string;
};

export type PlannerTodayPayload = {
  plan: any | null;
  exam: PlannerExam | null;
  subjects: PlannerSubject[];
  today: {
    date: string;
    scheduleIndex: number;
    schedule: any | null;
    topics: any[];
  };
  dueRevisions: any[];
  topicProgress: any[];
  userStats: {
    current_streak: number;
    longest_streak: number;
  };
  offlineGeneratedAt: string;
};

export function getDayBounds(dateLike: Date | string = new Date()) {
  const start = new Date(dateLike);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getNextRevisionDate(revisionCount: number, fromDate = new Date()) {
  const intervals = [3, 7, 14];
  const days = intervals[Math.min(Math.max(revisionCount - 1, 0), intervals.length - 1)];
  const next = new Date(fromDate);
  next.setHours(9, 0, 0, 0);
  next.setDate(next.getDate() + days);
  return next;
}

function compact(value: any) {
  return JSON.parse(JSON.stringify(value));
}

function sameDay(a: Date | string, b: Date | string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function normalizeSubject(subject: any): PlannerSubject {
  return {
    _id: String(subject._id),
    name: String(subject.name ?? 'Topic'),
    slug: String(subject.slug ?? String(subject.name ?? 'topic').toLowerCase().replace(/\s+/g, '-')),
    weightage_percent: Number(subject.weightage_percent ?? 0),
  };
}

function makeSubjectMaps(subjects: PlannerSubject[]) {
  const byId = new Map<string, PlannerSubject>();
  const byName = new Map<string, PlannerSubject>();
  for (const subject of subjects) {
    byId.set(subject._id, subject);
    byName.set(subject.name.toLowerCase().replace(/\s+/g, ' ').trim(), subject);
  }
  return { byId, byName };
}

function findTodayScheduleIndex(schedule: any[]) {
  const today = new Date();
  const todayIndex = schedule.findIndex((day) => sameDay(day.date, today));
  if (todayIndex >= 0) return todayIndex;
  const upcoming = schedule.findIndex((day) => new Date(day.date) >= getDayBounds(today).start && !day.is_completed);
  if (upcoming >= 0) return upcoming;
  const pending = schedule.findIndex((day) => !day.is_completed);
  return pending >= 0 ? pending : 0;
}

function buildTopicProgress({
  subjects,
  results,
  revisionLogs,
  exam,
}: {
  subjects: PlannerSubject[];
  results: any[];
  revisionLogs: any[];
  exam: PlannerExam | null;
}) {
  const progress = new Map<string, any>();
  const revisionBySlug = new Map<string, any>();
  for (const revision of revisionLogs) revisionBySlug.set(String(revision.topic_slug), revision);

  for (const subject of subjects) {
    progress.set(subject._id, {
      subject_id: subject._id,
      subject_name: subject.name,
      subject_slug: subject.slug,
      attempted: 0,
      correct: 0,
      accuracy_percent: 0,
      revision_count: Number(revisionBySlug.get(subject.slug)?.revision_count ?? 0),
      due_for_revision: revisionBySlug.has(subject.slug)
        ? new Date(revisionBySlug.get(subject.slug).next_revision) <= new Date()
        : false,
      practiceHref: exam ? `/practice/${exam.slug}/${subject.slug}` : '/practice',
    });
  }

  for (const result of results) {
    for (const breakdown of result.subject_breakdown ?? []) {
      const subjectId = String(breakdown.subject_id ?? '');
      const entry = progress.get(subjectId);
      if (!entry) continue;
      entry.attempted += Number(breakdown.attempted ?? 0);
      entry.correct += Number(breakdown.correct ?? 0);
    }
  }

  return [...progress.values()].map((entry) => ({
    ...entry,
    accuracy_percent: entry.attempted > 0 ? Math.round((entry.correct / entry.attempted) * 100) : 0,
  }));
}

export async function getPlannerTodayPayload(userId: string): Promise<PlannerTodayPayload> {
  const plan = await StudyPlan.findOne({ user_id: userId, is_active: true })
    .populate('exam_id', 'name slug')
    .lean();
  const user = await User.findById(userId).select('stats').lean() as any;

  if (!plan) {
    return {
      plan: null,
      exam: null,
      subjects: [],
      today: {
        date: getDayBounds().start.toISOString(),
        scheduleIndex: -1,
        schedule: null,
        topics: [],
      },
      dueRevisions: [],
      topicProgress: [],
      userStats: {
        current_streak: Number(user?.stats?.current_streak ?? 0),
        longest_streak: Number(user?.stats?.longest_streak ?? 0),
      },
      offlineGeneratedAt: new Date().toISOString(),
    };
  }

  const examDoc = (plan as any).exam_id;
  const exam: PlannerExam | null = examDoc
    ? { _id: String(examDoc._id), name: String(examDoc.name), slug: String(examDoc.slug) }
    : null;
  const examId = String(examDoc?._id ?? (plan as any).exam_id);
  const { start, end } = getDayBounds();

  const [subjectDocs, sessions, revisionLogs, results] = await Promise.all([
    Subject.find({ exam_id: examId, is_active: true }).select('_id name slug weightage_percent').lean(),
    StudySession.find({ user_id: userId, date: { $gte: start, $lte: end } }).lean(),
    RevisionLog.find({ user_id: userId, exam_id: examId }).sort({ next_revision: 1 }).lean(),
    Result.find({ user_id: userId, exam_id: examId })
      .select('subject_breakdown accuracy_percent created_at')
      .sort({ created_at: -1 })
      .limit(50)
      .lean(),
  ]);

  const subjects = subjectDocs.map(normalizeSubject);
  const { byId, byName } = makeSubjectMaps(subjects);
  const sessionBySlug = new Map<string, any>();
  for (const session of sessions) sessionBySlug.set(String(session.topic_slug), session);

  const schedule = Array.isArray((plan as any).daily_schedule) ? (plan as any).daily_schedule : [];
  const scheduleIndex = schedule.length ? findTodayScheduleIndex(schedule) : -1;
  const todaySchedule = scheduleIndex >= 0 ? schedule[scheduleIndex] : null;

  const topics = (todaySchedule?.tasks ?? []).map((task: any) => {
    const subject =
      byId.get(String(task.subject_id ?? '')) ??
      byName.get(String(task.subject_name ?? '').toLowerCase().replace(/\s+/g, ' ').trim());
    const topicSlug = String(task.subject_slug ?? subject?.slug ?? String(task.subject_name ?? 'topic').toLowerCase().replace(/\s+/g, '-'));
    const session = sessionBySlug.get(topicSlug);
    const revision = revisionLogs.find((item: any) => String(item.topic_slug) === topicSlug);
    return {
      ...compact(task),
      subject_id: subject?._id ?? String(task.subject_id ?? ''),
      subject_slug: topicSlug,
      topic_slug: topicSlug,
      topic_name:
        task.verification_mode === 'notes' || task.task_type === 'notes'
          ? `${subject?.name ?? String(task.subject_name ?? 'Topic')} notes`
          : subject?.name ?? String(task.subject_name ?? 'Topic'),
      session_minutes: Number(session?.duration_minutes ?? 0),
      session_completed: Boolean(session?.completed),
      due_for_revision: revision ? new Date(revision.next_revision) <= end : false,
      next_revision: revision?.next_revision ? new Date(revision.next_revision).toISOString() : null,
    };
  });

  const dueRevisions = revisionLogs
    .filter((revision: any) => new Date(revision.next_revision) <= end)
    .map((revision: any) => compact(revision));

  return {
    plan: compact(plan),
    exam,
    subjects,
    today: {
      date: start.toISOString(),
      scheduleIndex,
      schedule: todaySchedule ? compact(todaySchedule) : null,
      topics,
    },
    dueRevisions,
    topicProgress: buildTopicProgress({ subjects, results, revisionLogs, exam }),
    userStats: {
      current_streak: Number(user?.stats?.current_streak ?? (plan as any).streak_days ?? 0),
      longest_streak: Number(user?.stats?.longest_streak ?? 0),
    },
    offlineGeneratedAt: new Date().toISOString(),
  };
}
