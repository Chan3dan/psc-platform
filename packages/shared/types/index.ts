// ============================================================
// FILE: packages/shared/types/index.ts
// Shared TypeScript types — used by web + mobile
// ============================================================

export type Difficulty = 'easy' | 'medium' | 'hard';
export type UserRole = 'user' | 'admin';
export type AuthProvider = 'email' | 'google';
export type TaskType = 'practice' | 'revision' | 'mock';
export type ContentType = 'pdf' | 'richtext';

export interface Exam {
  _id: string;
  name: string;
  slug: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  total_questions: number;
  negative_marking: number;
  passing_marks: number;
  pattern_config: PatternConfig;
  is_active: boolean;
  thumbnail_url?: string;
  syllabus_outline?: string;
  syllabus_pdf_url?: string;
  created_at: string;
}

export interface PatternConfig {
  sections: Section[];
  shuffle_questions: boolean;
  shuffle_options: boolean;
}

export interface Section {
  name: string;
  subject_id?: string;
  questions_count: number;
  marks_per_question: number;
  negative_marks_per_wrong: number;
}

export interface Subject {
  _id: string;
  exam_id: string;
  name: string;
  slug: string;
  weightage_percent: number;
  description?: string;
  question_count: number;
}

export interface Question {
  _id: string;
  exam_id: string;
  subject_id: string | Subject;
  question_text: string;
  question_image_url?: string;
  options: Option[];
  correct_answer: number;
  explanation: string;
  difficulty: Difficulty;
  year?: number;
  tags: string[];
}

export interface Option {
  index: number;
  text: string;
  image_url?: string;
}

export interface MockTest {
  _id: string;
  exam_id: string;
  title: string;
  slug: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  negative_marking: number;
  attempt_count: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  stats: UserStats;
  preferences: UserPreferences;
}

export interface UserStats {
  total_tests: number;
  total_questions_attempted: number;
  average_accuracy: number;
  current_streak: number;
  longest_streak: number;
  last_active: string;
}

export interface UserPreferences {
  target_exam_id?: string;
  daily_goal_minutes: number;
  notification_enabled: boolean;
}

export interface SubmittedAnswer {
  question_id: string;
  selected_option: number | null;
  time_spent_seconds: number;
}

export interface TestResult {
  result_id: string;
  score: number;
  max_score: number;
  accuracy_percent: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  subject_breakdown: SubjectBreakdown[];
  percentile: number;
  correct_answers: Record<string, number>;
  explanations: Record<string, string>;
}

export interface SubjectBreakdown {
  subject_id: string;
  subject_name: string;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  marks_earned: number;
  accuracy_percent: number;
  avg_time_per_question: number;
}

export interface StudyPlan {
  _id: string;
  user_id: string;
  exam_id: string | Exam;
  title: string;
  target_date: string;
  daily_hours: number;
  daily_schedule: DaySchedule[];
  streak_days: number;
  is_active: boolean;
}

export interface DaySchedule {
  day: number;
  date: string;
  tasks: DailyTask[];
  total_minutes: number;
  is_completed: boolean;
}

export interface DailyTask {
  subject_id: string;
  subject_name: string;
  task_type: TaskType;
  duration_minutes: number;
  question_count: number;
  is_completed: boolean;
  completed_at?: string;
}

export interface PerformanceInsight {
  type: 'weakness' | 'strength' | 'pattern' | 'milestone';
  message: string;
  subject?: string;
  metric?: number;
}

// ============================================================
// FILE: next-auth.d.ts — Extend session types
// ============================================================
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }
  interface User {
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
  }
}
