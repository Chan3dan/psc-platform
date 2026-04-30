'use client';

import { useMemo, useState } from 'react';
import { DailySession } from '@/components/planner/DailySession';
import { ExamCountdown } from '@/components/planner/ExamCountdown';
import { RevisionScheduler } from '@/components/planner/RevisionScheduler';
import { StudyPlanGenerator } from '@/components/planner/StudyPlanGenerator';
import { TopicProgressRing } from '@/components/planner/TopicProgressRing';
import type { PlannerTodayPayload } from '@/lib/planner-smart';

type ExamOption = { _id: string; name: string; slug: string };
type SubjectOption = { _id: string; name: string; slug: string; weightage_percent?: number };

interface Props {
  initialPlan: any | null;
  exams: ExamOption[];
  subjectsByExam: Record<string, SubjectOption[]>;
  initialToday: PlannerTodayPayload;
  initialExamId?: string;
}

export function PlannerClient({
  initialPlan,
  exams,
  subjectsByExam,
  initialToday,
  initialExamId,
}: Props) {
  const [plan, setPlan] = useState(initialPlan);

  const readinessPercent = useMemo(() => {
    const attempted = initialToday.topicProgress.filter((topic) => topic.attempted > 0);
    if (!attempted.length) return 0;
    return Math.round(
      attempted.reduce((sum, topic) => sum + Number(topic.accuracy_percent ?? 0), 0) / attempted.length
    );
  }, [initialToday.topicProgress]);

  const topicsRemaining = useMemo(() => {
    const incompleteToday = initialToday.today.topics.filter((topic) => !topic.is_completed && !topic.session_completed).length;
    const untouched = initialToday.topicProgress.filter((topic) => topic.attempted === 0).length;
    return incompleteToday + untouched;
  }, [initialToday.today.topics, initialToday.topicProgress]);

  return (
    <div className="space-y-6">
      <ExamCountdown
        examDate={plan?.target_date ?? initialToday.plan?.target_date}
        topicsRemaining={topicsRemaining}
        readinessPercent={readinessPercent}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr),360px]">
        <div className="space-y-6">
          <DailySession initialToday={initialToday} onPlanSynced={setPlan} />
          <StudyPlanGenerator
            exams={exams}
            subjectsByExam={subjectsByExam}
            initialExamId={initialExamId}
            initialPlan={plan}
            onPlanGenerated={setPlan}
          />
          <TopicProgressRing topics={initialToday.topicProgress} />
        </div>
        <RevisionScheduler initialToday={initialToday} />
      </div>
    </div>
  );
}
