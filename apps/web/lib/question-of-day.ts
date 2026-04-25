import { Types } from 'mongoose';
import { Exam, Question, QuestionOfDay, Result, Subject } from '@psc/shared/models';

const KATHMANDU_TIMEZONE = 'Asia/Katmandu';

export function getKathmanduDateKey(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: KATHMANDU_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

export function getDateRangeForKathmanduDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  return { start, end };
}

function buildSeededIndex(length: number, seed: string) {
  if (length <= 0) return 0;
  const total = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return total % length;
}

async function pickSubjectForDailyQuestion(examId: string) {
  const subjects = await Subject.find({ exam_id: examId, is_active: true })
    .select('_id name')
    .sort({ name: 1 })
    .lean() as any[];

  if (!subjects.length) return null;

  const recent = await QuestionOfDay.find({ exam_id: examId })
    .sort({ prompt_date: -1 })
    .limit(subjects.length * 2)
    .select('subject_id')
    .lean() as any[];

  const recentCounts = new Map<string, number>();
  for (const item of recent) {
    const subjectId = String(item.subject_id);
    recentCounts.set(subjectId, (recentCounts.get(subjectId) ?? 0) + 1);
  }

  const sortedSubjects = [...subjects].sort((a: any, b: any) => {
    const countA = recentCounts.get(String(a._id)) ?? 0;
    const countB = recentCounts.get(String(b._id)) ?? 0;
    if (countA !== countB) return countA - countB;
    return String(a.name).localeCompare(String(b.name));
  });

  return sortedSubjects[0] as any;
}

async function pickQuestionForDailyQuestion(examId: string, subjectId: string, dateKey: string) {
  const recent = await QuestionOfDay.find({ exam_id: examId })
    .sort({ prompt_date: -1 })
    .limit(30)
    .select('question_id')
    .lean() as any[];

  const recentQuestionIds = recent.map((item) => new Types.ObjectId(String(item.question_id)));

  let questions = await Question.find({
    exam_id: examId,
    subject_id: subjectId,
    is_active: true,
    ...(recentQuestionIds.length ? { _id: { $nin: recentQuestionIds } } : {}),
  })
    .select('_id')
    .sort({ attempt_count: 1, created_at: 1 })
    .lean() as any[];

  if (!questions.length) {
    questions = await Question.find({
      exam_id: examId,
      subject_id: subjectId,
      is_active: true,
    })
      .select('_id')
      .sort({ attempt_count: 1, created_at: 1 })
      .lean() as any[];
  }

  if (!questions.length) return null;
  return questions[buildSeededIndex(questions.length, `${dateKey}:${subjectId}`)] as any;
}

export async function getOrCreateQuestionOfDay(input: { examId?: string | null }) {
  const examId = input.examId;
  if (!examId || !Types.ObjectId.isValid(examId)) return null;

  const promptDateKey = getKathmanduDateKey();
  const existing = await QuestionOfDay.findOne({ exam_id: examId, prompt_date_key: promptDateKey })
    .populate('exam_id', 'name slug')
    .populate('subject_id', 'name')
    .populate('question_id', 'question_text options correct_answer explanation difficulty')
    .lean() as any;

  if (existing) return existing as any;

  const exam = await Exam.findById(examId).select('_id name slug').lean() as any;
  if (!exam) return null;

  const subject = await pickSubjectForDailyQuestion(examId);
  if (!subject) return null;

  const question = await pickQuestionForDailyQuestion(examId, String(subject._id), promptDateKey);
  if (!question) return null;

  const created = await QuestionOfDay.findOneAndUpdate(
    { exam_id: examId, prompt_date_key: promptDateKey },
    {
      $setOnInsert: {
        exam_id: exam._id,
        subject_id: subject._id,
        question_id: question._id,
        prompt_date_key: promptDateKey,
        prompt_date: new Date(),
      },
    },
    { upsert: true, new: true }
  )
    .populate('exam_id', 'name slug')
    .populate('subject_id', 'name')
    .populate('question_id', 'question_text options correct_answer explanation difficulty')
    .lean() as any;

  return created as any;
}

export async function getQuestionOfDayAttempt(questionOfDayId: string, userId: string) {
  return Result.findOne({
    user_id: userId,
    'result_context.question_of_day_id': questionOfDayId,
  })
    .select(
      'score max_score accuracy_percent answers.selected_option answers.is_correct answers.question_id created_at result_context'
    )
    .lean();
}

export function serializeQuestionOfDay(questionOfDay: any, attempt?: any) {
  if (!questionOfDay?.question_id) return null;

  const question = questionOfDay.question_id;
  const answer = attempt?.answers?.[0];

  return {
    _id: String(questionOfDay._id),
    promptDateKey: questionOfDay.prompt_date_key,
    exam: questionOfDay.exam_id
      ? {
          _id: String(questionOfDay.exam_id._id),
          name: questionOfDay.exam_id.name,
          slug: questionOfDay.exam_id.slug,
        }
      : null,
    subject: questionOfDay.subject_id
      ? {
          _id: String(questionOfDay.subject_id._id),
          name: questionOfDay.subject_id.name,
        }
      : null,
    question: {
      _id: String(question._id),
      question_text: question.question_text,
      options: question.options ?? [],
      difficulty: question.difficulty ?? 'medium',
      explanation: answer ? question.explanation ?? '' : '',
      correct_answer: answer ? question.correct_answer : undefined,
    },
    attempt: attempt
      ? {
          result_id: String(attempt._id),
          selected_option: answer?.selected_option ?? null,
          is_correct: Boolean(answer?.is_correct),
          submitted_at: attempt.created_at,
          accuracy_percent: attempt.accuracy_percent ?? 0,
        }
      : null,
  };
}
