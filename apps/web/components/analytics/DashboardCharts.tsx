'use client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';

interface Props {
  scoreHistory: Array<{ date: string; score_percent: number; accuracy: number }>;
  subjectPerformance: Array<{ subject_name: string; avg_accuracy: number }>;
}

export function DashboardCharts({ scoreHistory, subjectPerformance }: Props) {
  const radarData = subjectPerformance.map((subject) => ({
    subject: subject.subject_name.length > 14 ? `${subject.subject_name.slice(0, 14)}…` : subject.subject_name,
    accuracy: subject.avg_accuracy,
  }));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text)]">Score vs Accuracy Trend</h3>
          <span className="badge-blue">Progress</span>
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={scoreHistory} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(120, 140, 170, 0.22)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8a97ae' }} tickFormatter={(d) => d.slice(5)} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#8a97ae' }} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 10,
                border: '1px solid rgba(140,160,190,0.3)',
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 10px 25px rgba(10,40,90,0.15)',
              }}
              formatter={(v: number) => [`${v}%`]}
            />
            <Line type="monotone" dataKey="score_percent" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} name="Score" />
            <Line type="monotone" dataKey="accuracy" stroke="#0ea5a4" strokeWidth={3} dot={{ r: 3 }} name="Accuracy" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {radarData.length >= 3 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--text)]">Subject Strength Map</h3>
            <span className="badge-amber">Coverage</span>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(120,140,170,0.26)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#8a97ae' }} />
              <Radar
                name="Accuracy"
                dataKey="accuracy"
                stroke="#7c3aed"
                fill="#7c3aed"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
