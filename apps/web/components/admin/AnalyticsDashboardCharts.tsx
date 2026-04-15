'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type DailyPoint = { date: string; count: number };
type AttemptedQuestion = {
  _id: string;
  question_text: string;
  attempt_count: number;
  correct_count: number;
  subject_name?: string;
};
type ExamAccuracy = {
  exam_id: string;
  exam_name: string;
  attempts: number;
  avg_accuracy: number;
  avg_score_percent: number;
};
type HeatmapRow = {
  exam_id: string;
  subject_id: string;
  exam_name: string;
  subject_name: string;
  attempts: number;
  correct: number;
  accuracy: number;
};

function truncate(text: string, max = 56) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function heatColor(accuracy: number) {
  if (accuracy >= 80) return '#10b981';
  if (accuracy >= 60) return '#22c55e';
  if (accuracy >= 45) return '#f59e0b';
  if (accuracy >= 30) return '#f97316';
  return '#ef4444';
}

function exportCsv(sections: Record<string, any[]>) {
  const chunks: string[] = [];
  for (const [title, rows] of Object.entries(sections)) {
    chunks.push(title);
    if (!rows.length) {
      chunks.push('No Data');
      chunks.push('');
      continue;
    }
    const headers = Object.keys(rows[0]);
    chunks.push(headers.join(','));
    rows.forEach((row) => {
      const line = headers
        .map((h) => {
          const val = row[h] ?? '';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',');
      chunks.push(line);
    });
    chunks.push('');
  }
  const blob = new Blob([chunks.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `psc-admin-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function DashboardCharts({
  dailyRegistrations,
  dailyAttempts,
  topQuestions,
  examAccuracy,
  subjectHeatmap,
}: {
  dailyRegistrations: DailyPoint[];
  dailyAttempts: DailyPoint[];
  topQuestions: AttemptedQuestion[];
  examAccuracy: ExamAccuracy[];
  subjectHeatmap: HeatmapRow[];
}) {
  const topQuestionChart = topQuestions.map((q) => ({
    ...q,
    label: truncate(q.question_text, 44),
    accuracy: q.attempt_count > 0 ? Number(((q.correct_count / q.attempt_count) * 100).toFixed(2)) : 0,
  }));

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          className="btn-primary"
          onClick={() => exportCsv({
            daily_registrations: dailyRegistrations,
            daily_attempts: dailyAttempts,
            most_attempted_questions: topQuestions,
            exam_accuracy: examAccuracy,
            subject_difficulty_heatmap: subjectHeatmap,
          })}
        >
          Export Analytics CSV
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Daily New Registrations (30 days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyRegistrations} margin={{ top: 8, right: 10, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,140,170,0.25)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8a97ae' }} tickFormatter={(v) => String(v).slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#8a97ae' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Tests Attempted Per Day (30 days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyAttempts} margin={{ top: 8, right: 10, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,140,170,0.25)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8a97ae' }} tickFormatter={(v) => String(v).slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#8a97ae' }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0ea5a4" strokeWidth={3} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Most Attempted Questions (Top 10)</h3>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={topQuestionChart} layout="vertical" margin={{ top: 8, right: 16, left: 12, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,140,170,0.25)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#8a97ae' }} />
              <YAxis type="category" dataKey="label" width={220} tick={{ fontSize: 11, fill: '#8a97ae' }} />
              <Tooltip />
              <Bar dataKey="attempt_count" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Average Accuracy by Exam</h3>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={examAccuracy} margin={{ top: 8, right: 16, left: -16, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,140,170,0.25)" />
              <XAxis dataKey="exam_name" tick={{ fontSize: 11, fill: '#8a97ae' }} interval={0} angle={-12} textAnchor="end" height={58} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#8a97ae' }} />
              <Tooltip formatter={(value: any) => `${value}%`} />
              <Legend />
              <Bar dataKey="avg_accuracy" fill="#10b981" name="Avg Accuracy %" radius={[6, 6, 0, 0]} />
              <Bar dataKey="avg_score_percent" fill="#3b82f6" name="Avg Score %" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-[var(--text)] mb-3">Subject Difficulty Heatmap (accuracy %)</h3>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={subjectHeatmap} margin={{ top: 8, right: 16, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,140,170,0.25)" />
            <XAxis dataKey="subject_name" tick={{ fontSize: 11, fill: '#8a97ae' }} interval={0} angle={-18} textAnchor="end" height={80} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#8a97ae' }} />
            <Tooltip
              formatter={(value: any, _name, payload: any) => [`${value}%`, `${payload?.payload?.exam_name ?? 'Exam'}`]}
              labelFormatter={(label: any) => `Subject: ${label}`}
            />
            <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
              {subjectHeatmap.map((row) => (
                <Cell key={`${row.exam_id}-${row.subject_id}`} fill={heatColor(row.accuracy)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const AnalyticsDashboardCharts = DashboardCharts;
