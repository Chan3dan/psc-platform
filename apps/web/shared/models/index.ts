// ============================================================
// PSC PLATFORM — COMPLETE MONGOOSE SCHEMAS
// ============================================================

import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IExam extends Document {
  name: string;
  slug: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  total_questions: number;
  negative_marking: number;
  passing_marks: number;
  pattern_config: {
    sections: Array<{
      name: string;
      subject_id?: Types.ObjectId;
      questions_count: number;
      marks_per_question: number;
      negative_marks_per_wrong: number;
    }>;
    shuffle_questions: boolean;
    shuffle_options: boolean;
  };
  is_active: boolean;
  thumbnail_url?: string;
  syllabus_outline?: string;
  syllabus_pdf_url?: string;
  created_at: Date;
  updated_at: Date;
}

const ExamSchema = new Schema<IExam>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    duration_minutes: { type: Number, required: true },
    total_marks: { type: Number, required: true },
    total_questions: { type: Number, required: true },
    negative_marking: { type: Number, default: 0.25 },
    passing_marks: { type: Number, required: true },
    pattern_config: {
      sections: [
        {
          name: String,
          subject_id: { type: Schema.Types.ObjectId, ref: 'Subject' },
          questions_count: Number,
          marks_per_question: Number,
          negative_marks_per_wrong: Number,
        },
      ],
      shuffle_questions: { type: Boolean, default: true },
      shuffle_options: { type: Boolean, default: true },
    },
    is_active: { type: Boolean, default: true },
    thumbnail_url: String,
    syllabus_outline: { type: String, default: '' },
    syllabus_pdf_url: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);
ExamSchema.index({ slug: 1 });
ExamSchema.index({ name: 'text', description: 'text' });

export interface ISubject extends Document {
  exam_id: Types.ObjectId;
  name: string;
  slug: string;
  weightage_percent: number;
  description?: string;
  question_count: number;
  is_active: boolean;
}

const SubjectSchema = new Schema<ISubject>(
  {
    exam_id: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true },
    weightage_percent: { type: Number, default: 0 },
    description: String,
    question_count: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
SubjectSchema.index({ exam_id: 1, slug: 1 }, { unique: true });

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface IQuestion extends Document {
  exam_id: Types.ObjectId;
  subject_id: Types.ObjectId;
  question_text: string;
  question_image_url?: string;
  options: Array<{
    index: number;
    text: string;
    image_url?: string;
  }>;
  correct_answer: number;
  explanation: string;
  explanation_image_url?: string;
  difficulty: Difficulty;
  year?: number;
  tags: string[];
  is_active: boolean;
  attempt_count: number;
  correct_count: number;
  created_at: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    exam_id: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    subject_id: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    question_text: { type: String, required: true },
    question_image_url: String,
    options: [
      {
        index: Number,
        text: String,
        image_url: String,
      },
    ],
    correct_answer: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, default: '' },
    explanation_image_url: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    year: Number,
    tags: [String],
    is_active: { type: Boolean, default: true },
    attempt_count: { type: Number, default: 0 },
    correct_count: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'created_at' } }
);
QuestionSchema.index({ exam_id: 1, subject_id: 1, difficulty: 1 });
QuestionSchema.index({ exam_id: 1, tags: 1 });
QuestionSchema.index({ question_text: 'text', tags: 'text' });

export interface IMockTest extends Document {
  exam_id: Types.ObjectId;
  title: string;
  slug: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  negative_marking: number;
  config: {
    question_ids?: Types.ObjectId[];
    auto_generate: boolean;
    subject_distribution: Array<{
      subject_id: Types.ObjectId;
      count: number;
      difficulty_split: { easy: number; medium: number; hard: number };
    }>;
  };
  is_active: boolean;
  attempt_count: number;
  created_at: Date;
}

const MockTestSchema = new Schema<IMockTest>(
  {
    exam_id: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, lowercase: true },
    duration_minutes: { type: Number, required: true },
    total_questions: { type: Number, required: true },
    total_marks: { type: Number, required: true },
    negative_marking: { type: Number, default: 0.25 },
    config: {
      question_ids: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
      auto_generate: { type: Boolean, default: true },
      subject_distribution: [
        {
          subject_id: { type: Schema.Types.ObjectId, ref: 'Subject' },
          count: Number,
          difficulty_split: {
            easy: { type: Number, default: 20 },
            medium: { type: Number, default: 60 },
            hard: { type: Number, default: 20 },
          },
        },
      ],
    },
    is_active: { type: Boolean, default: true },
    attempt_count: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'created_at' } }
);
MockTestSchema.index({ exam_id: 1, slug: 1 }, { unique: true });

export interface IUser extends Document {
  name: string;
  email: string;
  password_hash?: string;
  auth_provider: 'email' | 'google';
  role: 'user' | 'admin';
  avatar_url?: string;
  preferences: {
    target_exam_id?: Types.ObjectId;
    daily_goal_minutes: number;
    notification_enabled: boolean;
    language: string;
  };
  stats: {
    total_tests: number;
    total_questions_attempted: number;
    average_accuracy: number;
    current_streak: number;
    longest_streak: number;
    last_active: Date;
  };
  is_active: boolean;
  created_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password_hash: String,
    auth_provider: { type: String, enum: ['email', 'google'], default: 'email' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar_url: String,
    preferences: {
      target_exam_id: { type: Schema.Types.ObjectId, ref: 'Exam' },
      daily_goal_minutes: { type: Number, default: 60 },
      notification_enabled: { type: Boolean, default: true },
      language: { type: String, default: 'en' },
    },
    stats: {
      total_tests: { type: Number, default: 0 },
      total_questions_attempted: { type: Number, default: 0 },
      average_accuracy: { type: Number, default: 0 },
      current_streak: { type: Number, default: 0 },
      longest_streak: { type: Number, default: 0 },
      last_active: { type: Date, default: Date.now },
    },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at' } }
);
UserSchema.index({ email: 1 });

export interface IAnswer {
  question_id: Types.ObjectId;
  selected_option: number | null;
  flagged?: boolean;
  is_correct: boolean;
  marks_awarded: number;
  time_spent_seconds: number;
}

export interface ISubjectBreakdown {
  subject_id: Types.ObjectId;
  subject_name: string;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  marks_earned: number;
  accuracy_percent: number;
  avg_time_per_question: number;
}

export interface IResult extends Document {
  user_id: Types.ObjectId;
  test_id?: Types.ObjectId | null;
  test_type: 'mock' | 'practice';
  exam_id: Types.ObjectId;
  answers: IAnswer[];
  score: number;
  max_score: number;
  accuracy_percent: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  total_time_seconds: number;
  subject_breakdown: ISubjectBreakdown[];
  percentile?: number;
  created_at: Date;
}

const AnswerSchema = new Schema<IAnswer>(
  {
    question_id: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    selected_option: { type: Number, default: null },
    flagged: { type: Boolean, default: false },
    is_correct: { type: Boolean, required: true },
    marks_awarded: { type: Number, required: true },
    time_spent_seconds: { type: Number, default: 0 },
  },
  { _id: false }
);

const ResultSchema = new Schema<IResult>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    test_id: { type: Schema.Types.ObjectId, ref: 'MockTest', required: false, default: null },
    test_type: { type: String, enum: ['mock', 'practice'], default: 'mock' },
    exam_id: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    answers: [AnswerSchema],
    score: { type: Number, required: true },
    max_score: { type: Number, required: true },
    accuracy_percent: { type: Number, required: true },
    correct_count: { type: Number, default: 0 },
    wrong_count: { type: Number, default: 0 },
    skipped_count: { type: Number, default: 0 },
    total_time_seconds: { type: Number, default: 0 },
    subject_breakdown: [
      {
        subject_id: { type: Schema.Types.ObjectId, ref: 'Subject' },
        subject_name: String,
        attempted: Number,
        correct: Number,
        wrong: Number,
        skipped: Number,
        marks_earned: Number,
        accuracy_percent: Number,
        avg_time_per_question: Number,
      },
    ],
    percentile: Number,
  },
  { timestamps: { createdAt: 'created_at' } }
);
ResultSchema.index({ user_id: 1, created_at: -1 });
ResultSchema.index({ test_id: 1 });

export interface ISiteSetting extends Document {
  key: string;
  brand_name: string;
  tagline: string;
  logo_url: string;
  logo_data_url?: string;
  live_label: string;
  hero_badge: string;
  hero_title_prefix: string;
  hero_title_highlight: string;
  hero_description: string;
  footer_text: string;
  updated_at: Date;
}

const SiteSettingSchema = new Schema<ISiteSetting>(
  {
    key: { type: String, required: true, unique: true, default: 'site' },
    brand_name: { type: String, required: true, default: 'Niyukta' },
    tagline: { type: String, default: 'Prepare Smart. Get Niyukta.' },
    logo_url: { type: String, default: '/brand/niyukta-logo.jpeg' },
    logo_data_url: { type: String, default: '' },
    live_label: { type: String, default: 'Live' },
    hero_badge: { type: String, default: 'Built for Loksewa Aspirants' },
    hero_title_prefix: { type: String, default: 'Modern exam prep that turns' },
    hero_title_highlight: { type: String, default: 'study time into rank gain' },
    hero_description: {
      type: String,
      default: 'Practice smarter with adaptive MCQs, full mock tests, and advanced analytics designed for Nepal civil service exam success.',
    },
    footer_text: { type: String, default: 'Prepare Smart. Get Niyukta.' },
  },
  { timestamps: { updatedAt: 'updated_at' } }
);

export interface IDailyTask {
  subject_id: Types.ObjectId;
  subject_name: string;
  task_type: 'practice' | 'revision' | 'mock';
  duration_minutes: number;
  question_count?: number;
  is_completed: boolean;
  completed_at?: Date;
}

export interface IStudyPlan extends Document {
  user_id: Types.ObjectId;
  exam_id: Types.ObjectId;
  title: string;
  target_date: Date;
  daily_hours: number;
  daily_schedule: Array<{
    day: number;
    date: Date;
    tasks: IDailyTask[];
    total_minutes: number;
    is_completed: boolean;
  }>;
  streak_days: number;
  last_active_date?: Date;
  is_active: boolean;
  created_at: Date;
}

const StudyPlanSchema = new Schema<IStudyPlan>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    exam_id: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    title: { type: String, required: true },
    target_date: { type: Date, required: true },
    daily_hours: { type: Number, required: true },
    daily_schedule: [
      {
        day: Number,
        date: Date,
        tasks: [
          {
            subject_id: { type: Schema.Types.ObjectId, ref: 'Subject' },
            subject_name: String,
            task_type: { type: String, enum: ['practice', 'revision', 'mock'] },
            duration_minutes: Number,
            question_count: Number,
            is_completed: { type: Boolean, default: false },
            completed_at: Date,
          },
        ],
        total_minutes: Number,
        is_completed: { type: Boolean, default: false },
      },
    ],
    streak_days: { type: Number, default: 0 },
    last_active_date: Date,
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at' } }
);
StudyPlanSchema.index({ user_id: 1, is_active: 1 });

const BookmarkSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    question_id: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    note: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at' } }
);
BookmarkSchema.index({ user_id: 1, question_id: 1 }, { unique: true });

const NoteSchema = new Schema(
  {
    exam_id: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    subject_id: { type: Schema.Types.ObjectId, ref: 'Subject' },
    title: { type: String, required: true },
    content_type: { type: String, enum: ['pdf', 'richtext'], default: 'pdf' },
    content_url: String,
    content_html: String,
    uploaded_by: { type: Schema.Types.ObjectId, ref: 'User' },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);
NoteSchema.index({ exam_id: 1, subject_id: 1 });

export const Exam = mongoose.models.Exam || mongoose.model<IExam>('Exam', ExamSchema);
export const Subject = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);
export const Question = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
export const MockTest = mongoose.models.MockTest || mongoose.model<IMockTest>('MockTest', MockTestSchema);
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
if (mongoose.models.Result) {
  const existingResultModel = mongoose.models.Result as mongoose.Model<IResult>;
  const existingPath: any = existingResultModel.schema.path('test_id');
  if (existingPath && typeof existingPath.required === 'function') {
    existingPath.required(false);
  }
}

export const Result = mongoose.models.Result || mongoose.model<IResult>('Result', ResultSchema);
export const SiteSetting =
  mongoose.models.SiteSetting || mongoose.model<ISiteSetting>('SiteSetting', SiteSettingSchema);
export const StudyPlan = mongoose.models.StudyPlan || mongoose.model<IStudyPlan>('StudyPlan', StudyPlanSchema);
export const Bookmark = mongoose.models.Bookmark || mongoose.model('Bookmark', BookmarkSchema);
export const Note = mongoose.models.Note || mongoose.model('Note', NoteSchema);
