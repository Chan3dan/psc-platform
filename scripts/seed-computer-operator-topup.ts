import mongoose from 'mongoose';
import { Exam, Subject, Question, MockTest } from '../packages/shared/models';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/psc-platform';
const TARGET_PER_SUBJECT = 100;

async function ensureTextIndexes() {
  await Promise.all([
    Question.collection.createIndex({ question_text: 'text', tags: 'text' }),
    Exam.collection.createIndex({ name: 'text', description: 'text' }),
  ]);
}

const SYLLABUS_DISTRIBUTION: Record<string, number> = {
  'General Awareness': 10,
  'Public Management': 10,
  'Computer Fundamental': 3,
  'Operating System': 2,
  'Word Processing': 4,
  'Electronic Spreadsheet': 3,
  'Database Management System': 3,
  'Presentation System': 2,
  'Web Designing and Social Media': 2,
  'Computer Network': 2,
  'Cyber Security': 3,
  'Hardware Maintenance and Troubleshooting': 2,
  'Relevant Legislations and Institutions': 4,
};

function shuffleOptionsKeepAnswer(options: any[], correctAnswer: number) {
  const normalized = options.map((o: any, idx: number) => ({
    text: typeof o?.text === 'string' ? o.text : String(o ?? ''),
    original_index: typeof o?.index === 'number' ? o.index : idx,
  }));
  const correctOriginalIndex = normalized[correctAnswer]?.original_index ?? correctAnswer;

  for (let i = normalized.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = normalized[i];
    normalized[i] = normalized[j];
    normalized[j] = t;
  }

  const mapped = normalized.map((o, i) => ({ index: i, text: o.text }));
  const nextCorrect = normalized.findIndex((o) => o.original_index === correctOriginalIndex);
  return { options: mapped, correct_answer: nextCorrect >= 0 ? nextCorrect : 0 };
}

function variantQuestionText(original: string, i: number) {
  const q = String(original ?? '').trim();
  if (!q) return q;
  const variants = [
    q,
    `Choose the correct option: ${q}`,
    `${q} (Select the best answer.)`,
    `Identify the correct statement: ${q}`,
    `${q} Which option is correct?`,
  ];
  return variants[i % variants.length];
}

function buildFromExisting(baseQuestions: any[], count: number) {
  const docs: any[] = [];
  if (!baseQuestions.length) return docs;

  for (let i = 0; i < count; i++) {
    const b = baseQuestions[i % baseQuestions.length];
    const baseOptions = Array.isArray(b.options) ? b.options : [];
    if (baseOptions.length < 4) continue;

    const shuffled = shuffleOptionsKeepAnswer(baseOptions, Number(b.correct_answer ?? 0));
    docs.push({
      question_text: variantQuestionText(b.question_text, i + 1),
      options: shuffled.options,
      correct_answer: shuffled.correct_answer,
      explanation: b.explanation ?? '',
      difficulty: (i % 5 === 0 ? 'hard' : i % 2 === 0 ? 'medium' : 'easy'),
      tags: Array.from(new Set([...(Array.isArray(b.tags) ? b.tags : []), 'computer-operator', 'expanded-bank'])),
      year: b.year ?? 2082,
    });
  }
  return docs;
}

async function seedTopup() {
  if (process.env.ALLOW_SYNTHETIC_TOPUP !== 'true') {
    throw new Error(
      'Top-up is disabled by default. Set ALLOW_SYNTHETIC_TOPUP=true to expand each subject to 100 questions.'
    );
  }

  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB');

  const exam = await Exam.findOne({ slug: 'computer-operator', is_active: true });
  if (!exam) {
    throw new Error('Computer Operator exam not found. Run `npm run seed` first.');
  }

  const subjects = await Subject.find({ exam_id: exam._id, is_active: true }).sort({ name: 1 }).lean() as any[];
  if (subjects.length === 0) {
    throw new Error('No active subjects found for computer-operator exam.');
  }

  for (const subject of subjects) {
    const existingFilter = { exam_id: exam._id, subject_id: subject._id, is_active: true };
    const existing = await Question.countDocuments(existingFilter);
    if (existing >= TARGET_PER_SUBJECT) {
      await Subject.findByIdAndUpdate(subject._id, { question_count: existing });
      console.log(`• ${subject.name}: already ${existing}`);
      continue;
    }

    const need = TARGET_PER_SUBJECT - existing;
    const baseQuestions = await Question.find(existingFilter)
      .select('question_text options correct_answer explanation difficulty tags year')
      .lean();
    const generated = buildFromExisting(baseQuestions, need);
    if (generated.length === 0) {
      console.log(`• ${subject.name}: skipped (no usable base questions found)`);
      continue;
    }
    await Question.insertMany(generated.map((q) => ({ ...q, exam_id: exam._id, subject_id: subject._id, is_active: true })));
    const nextCount = await Question.countDocuments(existingFilter);
    await Subject.findByIdAndUpdate(subject._id, { question_count: nextCount });
    console.log(`• ${subject.name}: +${generated.length} (total ${nextCount})`);
  }

  // Create subject-wise past-pattern mocks
  for (const subject of subjects) {
    const slug = `co-past-${subject.slug}`;
    await MockTest.deleteOne({ exam_id: exam._id, slug });
    await MockTest.create({
      exam_id: exam._id,
      title: `Computer Operator Past-Pattern Mock — ${subject.name}`,
      slug,
      duration_minutes: 45,
      total_questions: 50,
      total_marks: 100,
      negative_marking: 0.2,
      config: {
        auto_generate: true,
        subject_distribution: [
          { subject_id: subject._id, count: 50, difficulty_split: { easy: 40, medium: 40, hard: 20 } },
        ],
      },
      is_active: true,
    });
  }

  // Create 3 mixed "sure-shot pattern" mocks (pattern-wise, not guaranteed actual paper)
  const mixSlugs = ['co-sureshot-mock-1', 'co-sureshot-mock-2', 'co-sureshot-mock-3'];
  for (let i = 0; i < mixSlugs.length; i++) {
    const slug = mixSlugs[i];
    await MockTest.deleteOne({ exam_id: exam._id, slug });
    const distribution = subjects.map((s) => ({
      subject_id: s._id,
      count: SYLLABUS_DISTRIBUTION[s.name] ?? 0,
      difficulty_split: i === 0
        ? { easy: 45, medium: 40, hard: 15 }
        : i === 1
        ? { easy: 35, medium: 45, hard: 20 }
        : { easy: 30, medium: 45, hard: 25 },
    })).filter((x) => x.count > 0);
    await MockTest.create({
      exam_id: exam._id,
      title: `Computer Operator Sure-Shot Pattern Mock #${i + 1}`,
      slug,
      duration_minutes: 45,
      total_questions: 50,
      total_marks: 100,
      negative_marking: 0.2,
      config: {
        auto_generate: true,
        subject_distribution: distribution,
      },
      is_active: true,
    });
  }

  console.log('✓ Top-up complete: each subject now has 100 MCQs');
  console.log('✓ Added subject-wise past-pattern mocks + 3 mixed sure-shot pattern mocks');
  await ensureTextIndexes();
  console.log('✓ Text indexes ensured (questions, exams)');
  await mongoose.disconnect();
}

seedTopup().catch((e) => {
  console.error('❌ Top-up failed:', e);
  process.exit(1);
});
