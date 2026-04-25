'use client';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface QuestionOption { index: number; text: string; image_url?: string; }
export interface SessionQuestion { _id: string; question_text: string; question_image_url?: string | null; options: QuestionOption[]; subject_id: string; difficulty: string; }
export interface ExamConfig { test_id: string | null; exam_id: string; title: string; duration_minutes: number; total_marks: number; total_questions: number; negative_marking: number; marks_per_question: number; test_type: string; weekly_context?: { mode?: string | null; week?: string | null }; }
export interface ExamSession { config: ExamConfig; questions: SessionQuestion[]; started_at: string; }
export interface AnswerRecord {
  question_id: string;
  selected_option: number | null;
  time_spent_seconds: number;
  flagged: boolean;
  visited: boolean;
}
export interface ExamResult { result_id: string; score: number; max_score: number; accuracy_percent: number; correct_count: number; wrong_count: number; skipped_count: number; subject_breakdown: any[]; percentile: number; correct_answers: Record<string, number>; explanations: Record<string, string>; }

interface ExamStoreState {
  session: ExamSession | null;
  answers: Map<string, AnswerRecord>;
  currentIndex: number;
  timeRemainingSeconds: number;
  isRunning: boolean;
  isSubmitted: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  result: ExamResult | null;
  questionStartTime: number;
  startSession: (session: ExamSession) => void;
  selectAnswer: (questionId: string, optionIndex: number) => void;
  clearAnswer: (questionId: string) => void;
  flagQuestion: (questionId: string) => void;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  tick: () => void;
  submitExam: () => Promise<void>;
  reset: () => void;
  getStatus: (questionId: string) => 'answered' | 'flagged' | 'skipped' | 'not-visited';
}

export const useExamStore = create<ExamStoreState>()(
  devtools(
    (set, get) => ({
      session: null, answers: new Map(), currentIndex: 0,
      timeRemainingSeconds: 0, isRunning: false, isSubmitted: false,
      isSubmitting: false, submitError: null, result: null, questionStartTime: Date.now(),

      startSession: (session) => {
        const answers = new Map<string, AnswerRecord>();
        for (const q of session.questions) {
          answers.set(q._id, {
            question_id: q._id,
            selected_option: null,
            time_spent_seconds: 0,
            flagged: false,
            visited: false,
          });
        }
        set({ session, answers, currentIndex: 0, timeRemainingSeconds: session.config.duration_minutes * 60, isRunning: true, isSubmitted: false, isSubmitting: false, submitError: null, result: null, questionStartTime: Date.now() });
      },

      selectAnswer: (questionId, optionIndex) => {
        const { answers, questionStartTime } = get();
        const existing = answers.get(questionId);
        if (!existing) return;
        const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
        const updated = new Map(answers);
        updated.set(questionId, {
          ...existing,
          selected_option: optionIndex,
          time_spent_seconds: existing.time_spent_seconds + timeSpent,
          visited: true,
        });
        set({ answers: updated, questionStartTime: Date.now() });
      },

      clearAnswer: (questionId) => {
        const { answers } = get();
        const existing = answers.get(questionId);
        if (!existing) return;
        const updated = new Map(answers);
        updated.set(questionId, { ...existing, selected_option: null, visited: true });
        set({ answers: updated });
      },

      flagQuestion: (questionId) => {
        const { answers } = get();
        const existing = answers.get(questionId);
        if (!existing) return;
        const updated = new Map(answers);
        updated.set(questionId, { ...existing, flagged: !existing.flagged, visited: true });
        set({ answers: updated });
      },

      goToQuestion: (index) => {
        const { session, answers, currentIndex, questionStartTime } = get();
        if (!session) return;
        const nextIndex = Math.max(0, Math.min(index, session.questions.length - 1));
        if (nextIndex === currentIndex) return;
        const currentQ = session.questions[currentIndex];
        if (currentQ) {
          const timeSpent = Math.round((Date.now() - questionStartTime) / 1000);
          const existing = answers.get(currentQ._id);
          if (existing) {
            const updated = new Map(answers);
            updated.set(currentQ._id, {
              ...existing,
              time_spent_seconds: existing.time_spent_seconds + timeSpent,
              visited: true,
            });
            set({ answers: updated });
          }
        }
        set({ currentIndex: nextIndex, questionStartTime: Date.now() });
      },

      nextQuestion: () => { const { session, currentIndex } = get(); if (session) get().goToQuestion(Math.min(currentIndex + 1, session.questions.length - 1)); },
      prevQuestion: () => { get().goToQuestion(Math.max(get().currentIndex - 1, 0)); },

      tick: () => {
        const { timeRemainingSeconds, isRunning, isSubmitted, isSubmitting } = get();
        if (!isRunning || isSubmitted || isSubmitting) return;
        if (timeRemainingSeconds <= 1) { set({ isRunning: false }); get().submitExam(); }
        else { set({ timeRemainingSeconds: timeRemainingSeconds - 1 }); }
      },

      submitExam: async () => {
        const { session, answers, isSubmitted, isSubmitting, timeRemainingSeconds } = get();
        if (!session || isSubmitted || isSubmitting) return;
        set({ isRunning: false, isSubmitting: true, submitError: null });
        const submittedAnswers = Array.from(answers.values()).map(a => ({
          question_id: typeof a.question_id === 'string'
            ? a.question_id
            : String((a as any).question_id ?? ''),
          selected_option: a.selected_option,
          time_spent_seconds: a.time_spent_seconds,
          flagged: a.flagged,
        }));
        const totalTime = session.config.duration_minutes * 60 - timeRemainingSeconds;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 20000);
          const res = await fetch('/api/tests/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              test_id: session.config.test_id ?? null,
              exam_id: typeof session.config.exam_id === 'string'
                ? session.config.exam_id
                : String((session.config as any).exam_id ?? ''),
              test_type: session.config.test_type,
              answers: submittedAnswers,
              total_time_seconds: totalTime,
              ...(session.config.weekly_context?.mode === 'scheduled'
                ? { weekly: 'scheduled', week: session.config.weekly_context.week }
                : {}),
            }),
          });
          clearTimeout(timeout);
          const data = await res.json();
          if (data.success) set({ result: data.data, isSubmitted: true, isSubmitting: false, submitError: null });
          else set({ isSubmitting: false, submitError: data?.error ?? 'Submission failed. Please try again.' });
        } catch {
          set({ isSubmitting: false, submitError: 'Submission failed. Please check your connection and retry.' });
        }
      },

      reset: () => set({ session: null, answers: new Map(), currentIndex: 0, timeRemainingSeconds: 0, isRunning: false, isSubmitted: false, isSubmitting: false, submitError: null, result: null }),

      getStatus: (questionId) => {
        const a = get().answers.get(questionId);
        if (!a || !a.visited) return 'not-visited';
        if (a.flagged) return 'flagged';
        if (a.selected_option !== null) return 'answered';
        return 'skipped';
      },
    }),
    { name: 'ExamStore' }
  )
);
