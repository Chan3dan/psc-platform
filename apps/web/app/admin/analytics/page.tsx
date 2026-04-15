import { connectDB } from '@/lib/db';
import {
  getDailyAttempts,
  getDailyRegistrations,
  getExamAccuracy,
  getMostAttemptedQuestions,
  getSubjectDifficultyHeatmap,
} from '@/lib/adminAnalytics';
import { AnalyticsDashboardCharts } from '@/components/admin/AnalyticsDashboardCharts';

export default async function AdminAnalyticsPage() {
  await connectDB();
  const [dailyRegistrations, dailyAttempts, topQuestions, examAccuracy, subjectHeatmap] = await Promise.all([
    getDailyRegistrations(30),
    getDailyAttempts(30),
    getMostAttemptedQuestions(10),
    getExamAccuracy(),
    getSubjectDifficultyHeatmap(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--text)]">Analytics</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Platform-wide analytics over registrations, attempts, question usage, and accuracy trends.
        </p>
      </div>

      <AnalyticsDashboardCharts
        dailyRegistrations={dailyRegistrations as any}
        dailyAttempts={dailyAttempts as any}
        topQuestions={topQuestions as any}
        examAccuracy={examAccuracy as any}
        subjectHeatmap={subjectHeatmap as any}
      />
    </div>
  );
}

