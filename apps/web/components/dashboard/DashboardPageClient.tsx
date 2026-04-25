'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DashboardCharts } from '@/components/analytics/DashboardCharts';
import { AppIcon } from '@/components/icons/AppIcon';
import { formatDuration } from '@/lib/results';

const DASHBOARD_COPY = {
  en: {
    welcomeBadge: 'Welcome',
    welcomeTitle: 'Let’s set up your exam focus',
    welcomeBody:
      'Choose the exam you are preparing for first. After that, your dashboard, mocks, practice, notes, planner, and leaderboard will stay centered on that target.',
    commandCenter: 'Your Command Center',
    language: 'Language',
    hello: 'Hello',
    streakMessage: (streak: number) =>
      `You are on a ${streak}-day streak. Stay consistent and keep momentum high.`,
    noStreak: 'Start a practice session today to begin your streak and unlock momentum.',
    focus: 'Focus',
    dayStreak: 'day streak',
    testsTracked: 'tests tracked',
    startPractice: 'Start Practice',
    takeMock: 'Take Mock Test',
    openPlanner: 'Open Planner',
    examReadiness: 'Exam Readiness',
    readinessBody: (exam: string) =>
      `Based on your ${exam} accuracy, mock attempts, consistency, and review backlog.`,
    ready: 'Ready',
    building: 'Building',
    needsFocus: 'Needs focus',
    reviewItems: 'review items',
    mocksThisWeek: 'mocks this week',
    learningMissions: 'Today’s Learning Missions',
    learningMissionsBody: 'Small daily actions that compound into exam confidence.',
    dailyFeed: 'Daily Updates',
    dailyFeedBody: 'Your exam feed combines today’s question, planner status, and urgent review signals.',
    questionOfDay: 'Question of the Day',
    questionOfDayBody: 'A focused daily question pulled from your selected exam track.',
    answerNow: 'Answer now',
    submitAnswer: 'Submit answer',
    correctAnswer: 'Correct answer',
    explanation: 'Explanation',
    alreadyAnswered: 'Already answered today',
    chooseOption: 'Choose one option to submit today’s answer.',
    smartReview: 'Smart review',
    testsTaken: 'Tests Taken',
    avgScore: 'Avg Score',
    accuracy: 'Accuracy',
    questionsSolved: 'Questions Solved',
    currentExamFocus: 'Your current exam focus',
    currentExamBody:
      'Change your target exam here whenever you switch preparation. Live areas will update around the chosen exam.',
    updateExamFocus: 'Update exam focus',
    quickDrill: 'Quick Drill',
    quickDrillBody: (count: number) => `5 questions in 5 minutes. ${count} completed today.`,
    startSpeedDrill: 'Start Speed Drill',
    milestoneRewards: 'Milestone Rewards',
    milestoneRewardsBody: 'Achievement signals that keep preparation motivating.',
    viewProgress: 'View progress',
    unlocked: 'Unlocked',
    progress: (value: number) => `${value}% progress`,
    performanceInsights: 'Performance Insights',
    insights: 'insights',
    insightsEmpty: 'Complete a few tests to generate personalized insight cards.',
    quickActions: 'Quick Actions',
    practiceBySubject: 'Practice by subject',
    checkLeaderboard: 'Check leaderboard',
    reviseNotes: 'Revise notes',
    priorityWeakTopics: 'Priority Weak Topics',
    activeStudyPlan: 'Active Study Plan',
    viewFullPlan: 'View full plan',
    target: 'Target',
    noActiveStudyPlan: 'No Active Study Plan',
    noActiveStudyPlanBody:
      'Create a plan to get a personalized day-by-day preparation roadmap.',
    createPlan: 'Create Plan',
    recentAttempts: 'Recent Test Attempts',
    viewAll: 'View all',
    noAttempts: 'No attempts yet',
    noAttemptsBody:
      'Start a practice set or mock test to unlock analytics and insight tracking.',
    beginPractice: 'Begin Practice',
  },
  ne: {
    welcomeBadge: 'स्वागत',
    welcomeTitle: 'आफ्नो लक्ष्य परीक्षा छान्नुहोस्',
    welcomeBody:
      'पहिले आफूले तयारी गरिरहेको परीक्षा छान्नुहोस्। त्यसपछि ड्यासबोर्ड, मोक, अभ्यास, नोट्स, प्लानर र लिडरबोर्ड सोही लक्ष्यमा केन्द्रित रहनेछन्।',
    commandCenter: 'तपाईंको कमाण्ड सेन्टर',
    language: 'भाषा',
    hello: 'नमस्ते',
    streakMessage: (streak: number) =>
      `तपाईं ${streak} दिनको streak मा हुनुहुन्छ। निरन्तरता कायम राख्नुहोस्।`,
    noStreak: 'आज अभ्यास सुरु गरेर आफ्नो streak र momentum बनाउनुहोस्।',
    focus: 'लक्ष्य',
    dayStreak: 'दिन streak',
    testsTracked: 'टेस्ट ट्र्याक गरिएको',
    startPractice: 'अभ्यास सुरु गर्नुहोस्',
    takeMock: 'मोक टेस्ट दिनुहोस्',
    openPlanner: 'प्लानर खोल्नुहोस्',
    examReadiness: 'परीक्षा तयारी स्कोर',
    readinessBody: (exam: string) =>
      `${exam} मा तपाईंको accuracy, mock, consistency र review backlog को आधारमा।`,
    ready: 'तयार',
    building: 'बन्दैछ',
    needsFocus: 'ध्यान चाहिन्छ',
    reviewItems: 'review item',
    mocksThisWeek: 'यो हप्ता mock',
    learningMissions: 'आजका अध्ययन लक्ष्य',
    learningMissionsBody: 'सानो दैनिक कामले ठूलो तयारी बनाउँछ।',
    dailyFeed: 'दैनिक अपडेट',
    dailyFeedBody: 'आजको प्रश्न, planner status र urgent review संकेत यहीँ देखिन्छन्।',
    questionOfDay: 'आजको प्रश्न',
    questionOfDayBody: 'तपाईंको चयन गरिएको परीक्षाबाट आजको focused question।',
    answerNow: 'अहिले उत्तर दिनुहोस्',
    submitAnswer: 'उत्तर पठाउनुहोस्',
    correctAnswer: 'सही उत्तर',
    explanation: 'व्याख्या',
    alreadyAnswered: 'आजको उत्तर दिइसक्नुभयो',
    chooseOption: 'आजको प्रश्न पठाउन एउटा option छान्नुहोस्।',
    smartReview: 'स्मार्ट review',
    testsTaken: 'दिएका टेस्ट',
    avgScore: 'औसत स्कोर',
    accuracy: 'शुद्धता',
    questionsSolved: 'समाधान गरिएका प्रश्न',
    currentExamFocus: 'हालको लक्ष्य परीक्षा',
    currentExamBody:
      'तपाईंको तयारी परिवर्तन भएमा यहाँबाट लक्ष्य परीक्षा बदल्न सक्नुहुन्छ।',
    updateExamFocus: 'लक्ष्य परीक्षा बदल्नुहोस्',
    quickDrill: 'छिटो Drill',
    quickDrillBody: (count: number) => `५ मिनेटमा ५ प्रश्न। आज ${count} पटक पूरा भयो।`,
    startSpeedDrill: 'Speed Drill सुरु गर्नुहोस्',
    milestoneRewards: 'Milestone Rewards',
    milestoneRewardsBody: 'प्रेरणा जोगाइराख्ने उपलब्धि संकेतहरू।',
    viewProgress: 'प्रगति हेर्नुहोस्',
    unlocked: 'Unlocked',
    progress: (value: number) => `${value}% प्रगति`,
    performanceInsights: 'Performance Insights',
    insights: 'insight',
    insightsEmpty: 'केही टेस्ट पूरा गरेपछि व्यक्तिगत insight cards देखिन्छन्।',
    quickActions: 'Quick Actions',
    practiceBySubject: 'विषयगत अभ्यास',
    checkLeaderboard: 'Leaderboard हेर्नुहोस्',
    reviseNotes: 'नोट्स दोहोर्याउनुहोस्',
    priorityWeakTopics: 'प्राथमिक कमजोर विषय',
    activeStudyPlan: 'सक्रिय अध्ययन योजना',
    viewFullPlan: 'पूरा plan हेर्नुहोस्',
    target: 'लक्ष्य',
    noActiveStudyPlan: 'सक्रिय योजना छैन',
    noActiveStudyPlanBody:
      'व्यक्तिगत दिन-प्रतिदिन roadmap पाउन नयाँ योजना बनाउनुहोस्।',
    createPlan: 'योजना बनाउनुहोस्',
    recentAttempts: 'हालैका टेस्ट प्रयास',
    viewAll: 'सबै हेर्नुहोस्',
    noAttempts: 'अहिलेसम्म प्रयास छैन',
    noAttemptsBody:
      'Analytics र insight tracking खोल्न अभ्यास वा mock सुरु गर्नुहोस्।',
    beginPractice: 'अभ्यास सुरु गर्नुहोस्',
  },
} as const;

function DashboardLoadingState() {
  return (
    <div className="page-wrap space-y-6">
      <section className="card glass p-6 md:p-7">
        <div className="space-y-3">
          <div className="h-6 w-40 rounded-full bg-[var(--brand-soft)]/70 animate-pulse" />
          <div className="h-10 w-64 rounded-2xl bg-[var(--line)] animate-pulse" />
          <div className="h-5 w-full max-w-xl rounded-xl bg-[var(--line)] animate-pulse" />
        </div>
      </section>
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card p-4 space-y-2">
            <div className="h-4 w-20 rounded bg-[var(--line)] animate-pulse" />
            <div className="h-8 w-24 rounded bg-[var(--line)] animate-pulse" />
          </div>
        ))}
      </section>
      <section className="card p-5 h-32 animate-pulse bg-[var(--brand-soft)]/15" />
    </div>
  );
}

export function DashboardPageClient() {
  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [questionOfDay, setQuestionOfDay] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/summary');
      const payload = await response.json();
      return payload.data;
    },
    staleTime: 45_000,
    gcTime: 5 * 60_000,
  });

  const t = DASHBOARD_COPY[language];
  const preferredExam = data?.preferredExam ?? null;

  useEffect(() => {
    if (!data) return;
    setLanguage(data.user?.preferences?.language === 'ne' ? 'ne' : 'en');
  }, [data]);

  useEffect(() => {
    setQuestionOfDay(data.questionOfDay ?? null);
    setSelectedOption(data.questionOfDay?.attempt?.selected_option ?? null);
  }, [data?.questionOfDay]);

  async function updateLanguage(nextLanguage: 'en' | 'ne') {
    if (nextLanguage === language) return;
    setLanguage(nextLanguage);
    setSavingLanguage(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: nextLanguage }),
      });
      const payload = await response.json();
      if (!payload?.success) {
        throw new Error(payload?.error ?? 'Could not update language');
      }
    } catch {
      setLanguage(data.user?.preferences?.language === 'ne' ? 'ne' : 'en');
    } finally {
      setSavingLanguage(false);
    }
  }

  const submitQuestionOfDay = useMutation({
    mutationFn: async () => {
      if (!questionOfDay?._id || selectedOption === null) {
        throw new Error(t.chooseOption);
      }

      const response = await fetch('/api/question-of-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_of_day_id: questionOfDay._id,
          selected_option: selectedOption,
          time_spent_seconds: 45,
        }),
      });
      const payload = await response.json();
      if (!payload?.success) {
        throw new Error(payload?.error ?? 'Could not submit today’s question');
      }
      return payload.data.questionOfDay;
    },
    onSuccess: (nextQuestion) => {
      setQuestionOfDay(nextQuestion);
      setSelectedOption(nextQuestion?.attempt?.selected_option ?? null);
    },
  });

  if (isLoading || !data) {
    return <DashboardLoadingState />;
  }

  const analytics = data.analytics;
  const engagement = data.engagement ?? {};
  const firstName = data.user?.name?.split?.(' ')?.[0] ?? 'there';
  const streak = data.user?.stats?.current_streak ?? 0;
  const readinessScore = Number(engagement.readinessScore ?? 0);

  if (!preferredExam) {
    return (
      <div className="page-wrap space-y-6">
        <section className="card glass p-6 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
                <AppIcon name="dashboard" className="h-3.5 w-3.5" />
                {t.welcomeBadge}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)]">{t.welcomeTitle}</h1>
              <p className="text-sm text-[var(--muted)] max-w-2xl">
                {t.welcomeBody}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t.language}</span>
              <button type="button" onClick={() => void updateLanguage('en')} disabled={savingLanguage} className={language === 'en' ? 'btn-primary !px-4 !py-2 text-sm' : 'btn-secondary !px-4 !py-2 text-sm'}>English</button>
              <button type="button" onClick={() => void updateLanguage('ne')} disabled={savingLanguage} className={language === 'ne' ? 'btn-primary !px-4 !py-2 text-sm' : 'btn-secondary !px-4 !py-2 text-sm'}>नेपाली</button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
              <AppIcon name="settings" className="h-3.5 w-3.5" />
              {t.currentExamFocus}
            </div>
            <Link href="/settings" className="btn-primary inline-flex items-center gap-2">
              <AppIcon name="settings" className="h-4 w-4" />
              {t.updateExamFocus}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const statCards = [
    { label: t.testsTaken, value: analytics.total_tests, tone: 'text-blue-600' },
    { label: t.avgScore, value: `${analytics.avg_score_percent}%`, tone: 'text-emerald-600' },
    { label: t.accuracy, value: `${analytics.overall_accuracy}%`, tone: 'text-indigo-600' },
    { label: t.questionsSolved, value: analytics.total_questions.toLocaleString(), tone: 'text-amber-600' },
  ];

  return (
    <div className="page-wrap space-y-6">
      <section className="card glass p-6 md:p-7">
        <div className="flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--brand)]">
              <AppIcon name="dashboard" className="h-3.5 w-3.5" />
              {t.commandCenter}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] mt-1">{t.hello}, {firstName}</h1>
            <p className="text-sm text-[var(--muted)] mt-2">
              {streak > 0
                ? t.streakMessage(streak)
                : t.noStreak}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="badge-blue inline-flex items-center gap-1.5">
                <AppIcon name="exams" className="h-3.5 w-3.5" />
                {t.focus}: {preferredExam.name}
              </span>
              <span className="badge-amber inline-flex items-center gap-1.5">
                <AppIcon name="leaderboard" className="h-3.5 w-3.5" />
                {streak} {t.dayStreak}
              </span>
              <span className="badge-gray inline-flex items-center gap-1.5">
                <AppIcon name="analytics" className="h-3.5 w-3.5" />
                {analytics.total_tests} {t.testsTracked}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t.language}</span>
              <button type="button" onClick={() => void updateLanguage('en')} disabled={savingLanguage} className={language === 'en' ? 'btn-primary !px-4 !py-2 text-sm' : 'btn-secondary !px-4 !py-2 text-sm'}>English</button>
              <button type="button" onClick={() => void updateLanguage('ne')} disabled={savingLanguage} className={language === 'ne' ? 'btn-primary !px-4 !py-2 text-sm' : 'btn-secondary !px-4 !py-2 text-sm'}>नेपाली</button>
            </div>
            <div className="flex flex-wrap gap-3">
            <Link href="/exams" className="btn-primary inline-flex items-center gap-2">
              <AppIcon name="practice" className="h-4 w-4" />
              {t.startPractice}
            </Link>
            <Link href="/mock" className="btn-secondary inline-flex items-center gap-2">
              <AppIcon name="mock" className="h-4 w-4" />
              {t.takeMock}
            </Link>
            <Link href="/planner" className="btn-secondary inline-flex items-center gap-2">
              <AppIcon name="planner" className="h-4 w-4" />
              {t.openPlanner}
            </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[0.85fr,1.15fr] gap-4">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide font-semibold text-[var(--muted)]">{t.examReadiness}</p>
              <h2 className="mt-1 text-3xl font-bold text-[var(--text)]">{readinessScore}%</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {t.readinessBody(preferredExam.name)}
              </p>
            </div>
            <span className={`badge ${readinessScore >= 70 ? 'badge-green' : readinessScore >= 45 ? 'badge-amber' : 'badge-red'}`}>
              {readinessScore >= 70 ? t.ready : readinessScore >= 45 ? t.building : t.needsFocus}
            </span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500"
              style={{ width: `${readinessScore}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <Link href="/review" className="rounded-xl border border-[var(--line)] px-3 py-2 hover:bg-[var(--brand-soft)]/45">
              {engagement.reviewQueueCount ?? 0} {t.reviewItems}
            </Link>
            <Link href="/mock" className="rounded-xl border border-[var(--line)] px-3 py-2 hover:bg-[var(--brand-soft)]/45">
              {engagement.weeklyMockCount ?? 0} {t.mocksThisWeek}
            </Link>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text)]">{t.learningMissions}</h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">{t.learningMissionsBody}</p>
            </div>
            <Link href="/review" className="hidden sm:inline-flex text-xs text-[var(--brand)] hover:underline">{t.smartReview}</Link>
          </div>
          <div className="space-y-3">
            {(engagement.dailyMissions ?? []).map((mission: any) => (
              <Link key={mission.id} href={mission.href} className="block rounded-2xl border border-[var(--line)] p-3 hover:border-[var(--brand)]/50 hover:bg-[var(--brand-soft)]/25 transition-colors">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl ${mission.completed ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 'bg-[var(--brand-soft)] text-[var(--brand)]'}`}>
                    <AppIcon name={mission.completed ? 'check' : mission.type === 'mock' ? 'mock' : mission.type === 'review' ? 'bookmarks' : 'drill'} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[var(--text)]">{mission.title}</span>
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">{mission.description}</span>
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                      <span className={`block h-full rounded-full ${mission.completed ? 'bg-emerald-500' : 'bg-[var(--brand)]'}`} style={{ width: `${mission.progress ?? 0}%` }} />
                    </span>
                  </span>
                  <span className={`badge shrink-0 ${mission.completed ? 'badge-green' : 'badge-blue'}`}>{mission.cta}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[0.95fr,1.05fr] gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text)]">{t.dailyFeed}</h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">{t.dailyFeedBody}</p>
            </div>
            <span className="badge-blue">{(engagement.dailyFeed ?? []).length}</span>
          </div>
          <div className="space-y-3">
            {(engagement.dailyFeed ?? []).map((item: any) => (
              <Link
                key={item.id}
                href={item.href}
                className="block rounded-2xl border border-[var(--line)] p-3 hover:border-[var(--brand)]/45 hover:bg-[var(--brand-soft)]/25 transition-colors"
              >
                <p className="text-sm font-semibold text-[var(--text)]">{item.title}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{item.body}</p>
                <p className="mt-2 text-xs font-semibold text-[var(--brand)]">{item.status}</p>
              </Link>
            ))}
          </div>
        </div>

        <div id="question-of-day" className="card p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text)]">{t.questionOfDay}</h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">{t.questionOfDayBody}</p>
            </div>
            {questionOfDay?.subject?.name && <span className="badge-blue">{questionOfDay.subject.name}</span>}
          </div>

          {questionOfDay ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]/85 p-4">
                <p className="text-sm font-medium text-[var(--text)]">{questionOfDay.question.question_text}</p>
              </div>

              <div className="space-y-2">
                {(questionOfDay.question.options ?? []).map((option: any) => {
                  const isSelected = selectedOption === option.index;
                  const isLocked = Boolean(questionOfDay.attempt);
                  const isCorrect =
                    questionOfDay.attempt && questionOfDay.question.correct_answer === option.index;
                  const isWrongPick =
                    questionOfDay.attempt &&
                    questionOfDay.attempt.selected_option === option.index &&
                    questionOfDay.question.correct_answer !== option.index;

                  return (
                    <button
                      key={option.index}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setSelectedOption(option.index)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : isWrongPick
                            ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : isSelected
                              ? 'border-[var(--brand)] bg-[var(--brand-soft)]/45 text-[var(--text)]'
                              : 'border-[var(--line)] bg-[var(--bg-elev)]/75 text-[var(--text)]'
                      } ${isLocked ? 'cursor-default' : 'hover:border-[var(--brand)]/45'}`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        Option {String.fromCharCode(65 + Number(option.index))}
                      </span>
                      <span className="mt-1 block text-sm">{option.text}</span>
                    </button>
                  );
                })}
              </div>

              {questionOfDay.attempt ? (
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--brand-soft)]/20 p-4 space-y-2">
                  <p className="text-sm font-semibold text-[var(--text)]">{t.alreadyAnswered}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {t.correctAnswer}: Option {String.fromCharCode(65 + Number(questionOfDay.question.correct_answer ?? 0))}
                  </p>
                  {questionOfDay.question.explanation && (
                    <p className="text-sm text-[var(--muted)]">
                      <span className="font-semibold text-[var(--text)]">{t.explanation}: </span>
                      {questionOfDay.question.explanation}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {submitQuestionOfDay.isError ? (
                    <p className="text-sm text-red-500">{(submitQuestionOfDay.error as Error).message}</p>
                  ) : (
                    <p className="text-xs text-[var(--muted)]">{t.answerNow}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => submitQuestionOfDay.mutate()}
                    disabled={selectedOption === null || submitQuestionOfDay.isPending}
                    className="btn-primary disabled:opacity-50"
                  >
                    {submitQuestionOfDay.isPending ? 'Submitting…' : t.submitAnswer}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">Question of the day will appear once your exam focus is available.</p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-4">
            <p className="text-xs uppercase tracking-wide font-semibold text-[var(--muted)]">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text)]">{t.currentExamFocus}</h2>
            <p className="text-sm text-[var(--muted)] mt-1">{t.currentExamBody}</p>
          </div>
          <Link href="/settings" className="btn-secondary inline-flex items-center gap-2">
            <AppIcon name="settings" className="h-4 w-4" />
            {t.updateExamFocus}
          </Link>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-[var(--text)]">{t.quickDrill}</h2>
            <p className="text-sm text-[var(--muted)] mt-1">{t.quickDrillBody(data.drillsToday)}</p>
          </div>
          <Link href="/drill" className="btn-primary inline-flex items-center gap-2">
            <AppIcon name="drill" className="h-4 w-4" />
            {t.startSpeedDrill}
          </Link>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text)]">{t.milestoneRewards}</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">{t.milestoneRewardsBody}</p>
          </div>
          <Link href="/results" className="text-xs text-[var(--brand)] hover:underline">{t.viewProgress}</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {(engagement.milestones ?? []).map((milestone: any) => (
            <div key={milestone.label} className="rounded-2xl border border-[var(--line)] p-3">
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${milestone.completed ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  <AppIcon name={milestone.completed ? 'check' : 'leaderboard'} className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm font-medium text-[var(--text)]">{milestone.label}</p>
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">{milestone.completed ? t.unlocked : t.progress(Math.round(milestone.progress ?? 0))}</p>
            </div>
          ))}
        </div>
      </section>


      <section className="grid grid-cols-1 xl:grid-cols-[1.25fr,0.75fr] gap-4">
        {analytics.insights.length > 0 ? (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--text)]">{t.performanceInsights}</h2>
              <span className="badge-blue">{analytics.insights.length} {t.insights}</span>
            </div>
            <div className="space-y-2.5">
              {analytics.insights.map((ins: any, i: number) => (
                <div
                  key={i}
                  className={`rounded-xl px-3 py-2.5 text-sm flex items-start gap-2 ${
                    ins.type === 'weakness'
                      ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                      : ins.type === 'strength'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : ins.type === 'milestone'
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  <span className="shrink-0 mt-0.5">
                    <AppIcon
                      name={
                        ins.type === 'weakness'
                          ? 'alert'
                          : ins.type === 'strength'
                            ? 'check'
                            : ins.type === 'milestone'
                              ? 'leaderboard'
                              : 'idea'
                      }
                      className="h-4 w-4"
                    />
                  </span>
                  <span>{ins.message}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--text)]">{t.performanceInsights}</h2>
            <p className="text-sm text-[var(--muted)] mt-2">{t.insightsEmpty}</p>
          </div>
        )}

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-[var(--text)]">{t.quickActions}</h2>
          <div className="mt-3 space-y-2">
            <Link href="/practice" className="flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--brand-soft)]/50 transition-colors">
              {t.practiceBySubject} <AppIcon name="arrow-right" className="h-4 w-4" />
            </Link>
            <Link href="/leaderboard" className="flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--brand-soft)]/50 transition-colors">
              {t.checkLeaderboard} <AppIcon name="arrow-right" className="h-4 w-4" />
            </Link>
            <Link href="/notes" className="flex items-center justify-between rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--brand-soft)]/50 transition-colors">
              {t.reviseNotes} <AppIcon name="arrow-right" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {analytics.score_history.length > 1 && (
        <DashboardCharts scoreHistory={analytics.score_history} subjectPerformance={analytics.subject_performance} />
      )}

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {analytics.weak_topics.length > 0 && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--text)] mb-3">{t.priorityWeakTopics}</h2>
            <div className="space-y-2.5">
              {analytics.weak_topics.slice(0, 6).map((topic: any) => (
                <div key={topic.subject_id} className="rounded-2xl border border-[var(--line)] p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-red-400 shrink-0"><AppIcon name="alert" className="h-4 w-4" /></span>
                    <span className="text-sm font-medium text-[var(--text)] flex-1 truncate">{topic.subject_name}</span>
                    <span className="text-xs text-red-500 font-semibold shrink-0">{topic.avg_accuracy}%</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${topic.avg_accuracy}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.plan ? (
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text)]">{t.activeStudyPlan}</h2>
              <Link href="/planner" className="inline-flex items-center gap-1 text-xs text-[var(--brand)] hover:opacity-90">
                {t.viewFullPlan}
                <AppIcon name="arrow-right" className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="text-base font-semibold text-[var(--text)] mt-3">{data.plan.examName}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
              <span className="badge-amber inline-flex items-center gap-1.5"><AppIcon name="drill" className="h-3.5 w-3.5" /> {data.plan.streakDays} day streak</span>
              <span className="badge-gray inline-flex items-center gap-1.5"><AppIcon name="planner" className="h-3.5 w-3.5" /> {t.target}: {data.plan.targetDate ? new Date(data.plan.targetDate).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        ) : (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--text)]">{t.noActiveStudyPlan}</h2>
            <p className="text-sm text-[var(--muted)] mt-2">{t.noActiveStudyPlanBody}</p>
            <Link href="/planner" className="btn-secondary mt-4">{t.createPlan}</Link>
          </div>
        )}
      </section>

      {data.recentResults.length > 0 ? (
        <section className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--line)] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text)]">{t.recentAttempts}</h2>
            <Link href="/results" className="text-xs text-[var(--brand)] hover:underline">{t.viewAll}</Link>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {data.recentResults.map((result: any) => {
              const pct = result.maxScore > 0 ? ((result.score / result.maxScore) * 100).toFixed(0) : '0';
              return (
                <Link
                  key={result._id}
                  href={`/results/${result._id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[var(--brand-soft)]/45 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{result.title}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      {formatDuration(result.totalTimeSeconds)} · {result.correctCount} correct · {result.wrongCount} wrong · {result.skippedCount} skipped
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${Number(pct) >= 40 ? 'text-emerald-600' : 'text-red-500'}`}>{pct}%</span>
                    <p className="text-xs text-[var(--muted)]">{new Date(result.createdAt).toLocaleDateString()}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="card p-10 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <AppIcon name="notes" className="h-7 w-7" />
          </div>
          <h3 className="font-semibold text-[var(--text)] mb-1">{t.noAttempts}</h3>
          <p className="text-sm text-[var(--muted)] mb-4">{t.noAttemptsBody}</p>
          <Link href="/exams" className="btn-primary inline-flex">{t.beginPractice}</Link>
        </section>
      )}
    </div>
  );
}
