'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PlannerTodayPayload } from '@/lib/planner-smart';

type Props = {
  initialToday: PlannerTodayPayload;
};

async function fetchTodayPlan() {
  const response = await fetch('/api/planner/today');
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Could not load revisions.');
  return data.data as PlannerTodayPayload;
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('en-NP', { month: 'short', day: 'numeric' });
}

export function RevisionScheduler({ initialToday }: Props) {
  const queryClient = useQueryClient();
  const todayQuery = useQuery({
    queryKey: ['planner', 'today'],
    queryFn: fetchTodayPlan,
    initialData: initialToday,
  });
  const data = todayQuery.data;

  const revise = useMutation({
    mutationFn: async (item: any) => {
      const response = await fetch('/api/planner/revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: data?.exam?._id,
          subjectId: item.subject_id,
          topicSlug: item.topic_slug,
          topicName: item.topic_name,
        }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Could not mark revision.');
      return result.data as PlannerTodayPayload;
    },
    onSuccess: (payload) => queryClient.setQueryData(['planner', 'today'], payload),
  });

  return (
    <aside className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Spaced repetition</p>
      <h2 className="mt-2 text-xl font-bold text-[var(--text)]">Due for revision</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Studied topics return after 3, 7, then 14 days.</p>

      <div className="mt-5 space-y-3">
        {(data?.dueRevisions ?? []).map((item: any) => (
          <article key={item._id ?? item.topic_slug} className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[11px] font-semibold text-amber-500">
                  Due for revision today
                </span>
                <h3 className="mt-3 font-semibold text-[var(--text)]">{item.topic_name}</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Last studied {dateLabel(item.last_studied)} · {item.revision_count ?? 0} revisions
                </p>
              </div>
              <button
                type="button"
                className="btn-primary text-xs"
                disabled={revise.isPending}
                onClick={() => revise.mutate(item)}
              >
                Revised
              </button>
            </div>
          </article>
        ))}
      </div>

      {(data?.dueRevisions ?? []).length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--bg-elev)] p-5 text-sm text-[var(--muted)]">
          Nothing due right now. New study sessions will automatically schedule future revisions.
        </div>
      )}

      {revise.isError && (
        <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {(revise.error as Error).message}
        </p>
      )}
    </aside>
  );
}
