import mongoose from 'mongoose';
import { Exam, Question } from '../packages/shared/models';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/psc-platform';

async function cleanPrefix() {
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB');

  const exam = await Exam.findOne({ slug: 'computer-operator' }).select('_id').lean() as any;
  if (!exam?._id) throw new Error('Computer Operator exam not found');

  const subjects = await mongoose.model('Subject').find({ exam_id: exam._id }).select('name').lean() as any[];
  const escaped = subjects
    .map((s: any) => String(s.name ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter(Boolean);
  const subjectPrefix = escaped.length ? new RegExp(`^(?:${escaped.join('|')})\\s+Q\\d+:\\s*`, 'i') : null;
  const patternPast = /^\[Past-Pattern Model\]\s*/i;

  const rows = await Question.find({ exam_id: exam._id })
    .select('_id question_text')
    .lean() as any[];

  if (rows.length === 0) {
    console.log('✓ No questions found.');
    await mongoose.disconnect();
    return;
  }

  let changed = 0;
  for (const row of rows) {
    const original = String(row.question_text ?? '');
    let next = original.replace(patternPast, '');
    if (subjectPrefix) next = next.replace(subjectPrefix, '');
    next = next.trim();
    if (next && next !== original) {
      await Question.findByIdAndUpdate(row._id, { question_text: next });
      changed += 1;
    }
  }

  console.log(`✓ Cleaned prefix from ${changed} questions`);
  await mongoose.disconnect();
}

cleanPrefix().catch((e) => {
  console.error('❌ Cleanup failed:', e);
  process.exit(1);
});
