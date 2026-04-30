'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cacheTodayPlan, readCachedTodayPlan } from '@/lib/offline-planner-cache';
import type { PlannerTodayPayload } from '@/lib/planner-smart';

type Props = {
  initialToday: PlannerTodayPayload;
  onPlanSynced?: (plan: any) => void;
};

async function fetchTodayPlan() {
  const response = await fetch('/api/planner/today');
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Could not load today’s planner.');
  return data.data as PlannerTodayPayload;
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function DailySession({ initialToday, onPlanSynced }: Props) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [offlinePayload, setOfflinePayload] = useState<PlannerTodayPayload | null>(null);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const todayQuery = useQuery({
    queryKey: ['planner', 'today'],
    queryFn: fetchTodayPlan,
    initialData: initialToday,
  });

  useEffect(() => {
    if (todayQuery.data) cacheTodayPlan(todayQuery.data);
  }, [todayQuery.data]);

  useEffect(() => {
    if (!todayQuery.isError) return;
    readCachedTodayPlan().then((entry) => {
      if (entry?.payload) setOfflinePayload(entry.payload);
    });
  }, [todayQuery.isError]);

  useEffect(() => {
    if (!activeSlug || !startedAt) return undefined;
    const id = window.setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [activeSlug, startedAt]);

  const data = offlinePayload ?? todayQuery.data;
  const isOffline = Boolean(offlinePayload && todayQuery.isError);
  const topics = useMemo(() => data?.today.topics ?? [], [data?.today.topics]);

  const sessionMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch('/api/planner/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Could not save study session.');
      return result.data as PlannerTodayPayload;
    },
    onSuccess: (payload) => {
      setOfflinePayload(null);
      cacheTodayPlan(payload);
      queryClient.setQueryData(['planner', 'today'], payload);
    },
  });

  const strictSync = useMutation({
    mutationFn: async () => {
      if (!data?.plan?._id) throw new Error('No active study plan found.');
      const response = await fetch(`/api/planner/${data.plan._id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          data.today.scheduleIndex >= 0 ? { day_index: data.today.scheduleIndex } : {}
        ),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Could not sync MCQ progress.');
      return result.data;
    },
    onSuccess: (syncedPlan) => {
      onPlanSynced?.(syncedPlan);
      queryClient.invalidateQueries({ queryKey: ['planner', 'today'] });
    },
  });

  useEffect(() => {
    if (!data?.plan?._id || data.today.scheduleIndex < 0 || isOffline) return;
    strictSync.mutate();
  // Run only once per loaded plan/day pair.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.plan?._id, data?.today.scheduleIndex, isOffline]);

  const totalTarget = useMemo(
    () => topics.reduce((sum: number, topic: any) => sum + Number(topic.duration_minutes ?? 0), 0),
    [topics]
  );
  const completedCount = topics.filter((topic: any) => topic.session_completed || topic.is_completed).length;
  const dayProgress = topics.length ? Math.round((completedCount / topics.length) * 100) : 0;

  function startTimer(slug: string) {
    setActiveSlug(slug);
    setStartedAt(Date.now());
    setElapsed(0);
  }

  function stopTimer(topic: any) {
    const minutes = Math.max(1, Math.round(elapsed / 60));
    setActiveSlug(null);
    setStartedAt(null);
    setElapsed(0);
    sessionMutation.mutate({
      examId: data?.exam?._id,
      subjectId: topic.subject_id,
      topicSlug: topic.topic_slug,
      topicName: topic.topic_name,
      durationMinutes: minutes,
      completed: true,
    });
  }

  return (
    <section className="card p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Daily session</p>
          <h2 className="mt-2 text-xl font-bold text-[var(--text)]">
            {session?.user?.name ? `${session.user.name.split(' ')[0]}, today’s focus` : 'Today’s focus'}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {topics.length
              ? `${completedCount}/${topics.length} topics checked in · ${formatMinutes(totalTarget)} target`
              : 'Generate a study plan to start tracking today.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isOffline && (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-500">
              Offline mode
            </span>
          )}
          <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
            Streak {data?.userStats.current_streak ?? 0}
          </span>
          <button
            type="button"
            className="btn-secondary text-xs"
            disabled={strictSync.isPending || isOffline || !data?.plan?._id}
            onClick={() => strictSync.mutate()}
          >
            {strictSync.isPending ? 'Syncing...' : 'Sync MCQ progress'}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-xs text-[var(--muted)]">
          <span>Today’s activity progress</span>
          <span>{dayProgress}%</span>
        </div>
        <progress
          className="h-2.5 w-full overflow-hidden rounded-full accent-blue-600"
          value={dayProgress}
          max={100}
        />
      </div>

      <div className="mt-5 space-y-3">
        {topics.map((topic: any) => {
          const running = activeSlug === topic.topic_slug;
          const completed = topic.session_completed || topic.is_completed;
          return (
            <article key={topic.topic_slug} className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-[var(--text)]">{topic.topic_name}</h3>
                    <span className="rounded-full bg-[var(--bg)] px-2 py-1 text-[11px] font-semibold text-[var(--muted)]">
                      {topic.task_type}
                    </span>
                    {topic.due_for_revision && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-500">
                        Due for revision today
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Target {formatMinutes(Number(topic.duration_minutes ?? 0))}
                    {topic.verification_mode === 'notes'
                      ? ` · ${topic.minimum_minutes || 10}+ manual notes minutes`
                      : topic.minimum_questions
                      ? ` · ${topic.minimum_questions}+ verified questions`
                      : ''}
                    {topic.session_minutes ? ` · ${formatMinutes(Number(topic.session_minutes))} logged` : ''}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {topic.verification_mode === 'notes'
                      ? 'Notes study is timer/manual because reading cannot be verified from MCQ results.'
                      : 'MCQ progress is strict and updates only from real answered questions.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {running ? (
                    <button type="button" className="btn-primary" onClick={() => stopTimer(topic)}>
                      Stop · {formatMinutes(Math.max(1, Math.round(elapsed / 60)))}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={sessionMutation.isPending || isOffline}
                      onClick={() => startTimer(topic.topic_slug)}
                    >
                      Start timer
                    </button>
                  )}
                  <button
                    type="button"
                    className={completed ? 'btn-secondary opacity-70' : 'btn-primary'}
                    disabled={sessionMutation.isPending || isOffline}
                    onClick={() => {
                      if (topic.verification_mode !== 'notes' && topic.task_type !== 'notes') {
                        strictSync.mutate();
                        return;
                      }
                      sessionMutation.mutate({
                        examId: data?.exam?._id,
                        subjectId: topic.subject_id,
                        topicSlug: topic.topic_slug,
                        topicName: topic.topic_name,
                        durationMinutes: Math.max(0, Number(topic.minimum_minutes ?? 0)),
                        completed: true,
                      });
                    }}
                  >
                    {completed ? 'Checked in' : topic.verification_mode === 'notes' ? 'Mark notes studied' : 'Check MCQ result'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {topics.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg-elev)] p-6 text-center text-sm text-[var(--muted)]">
          No daily topics yet. Generate a smart plan below and this tracker will start working immediately.
        </div>
      )}

      {sessionMutation.isError && (
        <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {(sessionMutation.error as Error).message}
        </p>
      )}
    </section>
  );
}
