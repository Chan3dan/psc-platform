'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

type Period = 'all' | 'week' | 'month';

export function LeaderboardClient({ initialExamId = '' }: { initialExamId?: string }) {
  const [examId, setExamId] = useState(initialExamId);
  const [testId, setTestId] = useState('');
  const [tests, setTests] = useState<any[]>([]);
  const [period, setPeriod] = useState<Period>('all');

  const { data: exams = [] } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const r = await fetch('/api/exams');
      const d = await r.json();
      return d.data ?? [];
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  useEffect(() => {
    if (initialExamId && exams.length) {
      void loadTests(initialExamId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialExamId, exams.length]);

  async function loadTests(eid: string) {
    setExamId(eid);
    setTestId('');
    if (!eid) {
      setTests([]);
      return;
    }
    const selected = exams.find((e: any) => e._id === eid);
    if (!selected?.slug) return;
    const r = await fetch(`/api/exams/${selected.slug}`);
    const d = await r.json();
    if (d.success) setTests(d.data?.mock_tests ?? []);
  }

  const { data: lb, isLoading } = useQuery({
    queryKey: ['leaderboard', testId, examId, period],
    queryFn: async () => {
      const p = new URLSearchParams({ period });
      if (testId) p.set('test_id', testId);
      else if (examId) p.set('exam_id', examId);
      const r = await fetch(`/api/leaderboard?${p.toString()}`);
      const d = await r.json();
      return d.success ? d.data : null;
    },
    enabled: !!(testId || examId),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  const medals = ['🥇', '🥈', '🥉'];
  const topIds = new Set((lb?.leaderboard ?? []).map((e: any) => String(e.user_id)));
  const showPinnedUser = lb?.current_user_rank && !topIds.has(String(lb?.current_user_id));

  return (
    <div className="page-wrap max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text)]">Leaderboard</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Top performers by score.</p>
      </div>

      <div className="card p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Exam</label>
            <select value={examId} onChange={e => loadTests(e.target.value)} className="input">
              <option value="">Select exam</option>
              {exams.map((e: any) => <option key={e._id} value={e._id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Test</label>
            <select value={testId} onChange={e => setTestId(e.target.value)} className="input" disabled={!tests.length}>
              <option value="">All tests in exam</option>
              {tests.map((t: any) => <option key={t._id} value={t._id}>{t.title}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            ['week', 'This Week'],
            ['month', 'This Month'],
            ['all', 'All Time'],
          ] as Array<[Period, string]>).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${period === value ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!examId && !testId && (
        <div className="card p-10 text-center">
          <p className="text-sm text-[var(--muted)]">Select an exam or test to view rankings.</p>
        </div>
      )}

      {(examId || testId) && isLoading && (
        <div className="card p-8 text-center text-sm text-[var(--muted)]">Loading leaderboard…</div>
      )}

      {showPinnedUser && (
        <div className="card p-4 mb-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
          <p className="text-xs text-blue-700 dark:text-blue-300">Your Rank</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">#{lb.current_user_rank.rank} {lb.current_user_rank.name}</span>
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{lb.current_user_rank.score}</span>
          </div>
        </div>
      )}

      {lb && !isLoading && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--line)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text)]">Top 20</h2>
            <span className="text-xs text-[var(--muted)]">{lb.total_participants} participants</span>
          </div>
          {lb.leaderboard.length === 0 && (
            <p className="text-center text-sm text-[var(--muted)] py-8">No attempts found for this period.</p>
          )}
          <div className="divide-y divide-[var(--line)]">
            {lb.leaderboard.map((entry: any) => {
              const isMe = String(entry.user_id) === String(lb.current_user_id);
              return (
                <div key={entry.rank} className={`flex items-center gap-4 px-5 py-3 ${isMe ? 'bg-blue-50 dark:bg-blue-950' : ''}`}>
                  <span className="w-8 text-center text-lg">{entry.rank <= 3 ? medals[entry.rank - 1] : `#${entry.rank}`}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isMe ? 'text-blue-700 dark:text-blue-300' : 'text-[var(--text)]'}`}>
                      {entry.name}{isMe ? ' (You)' : ''}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{entry.accuracy}% accuracy · {Math.floor(entry.time_taken / 60)}m {entry.time_taken % 60}s</p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--text)]">{entry.score}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
