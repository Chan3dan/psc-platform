import mongoose from 'mongoose';
import { Exam, Subject, Question } from '../packages/shared/models';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/psc-platform';

async function cleanSampledQuestions() {
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB');

  const exam = await Exam.findOne({ slug: 'computer-operator' }).select('_id').lean() as any;
  if (!exam?._id) throw new Error('Computer Operator exam not found');

  const filter: any = {
    exam_id: exam._id,
    is_active: true,
    $or: [
      { tags: { $in: ['model-mcq', 'expanded-bank'] } },
      { question_text: /^Which statement best matches/i },
      { question_text: /core concept under .*syllabus/i },
      { 'options.text': /only applies to entertainment software/i },
      { 'options.text': /unrelated to office ICT operations/i },
      { 'options.text': /only a hardware brand name/i },
    ],
  };

  const before = await Question.countDocuments({ exam_id: exam._id, is_active: true });
  const sampledCount = await Question.countDocuments(filter);
  const del = await Question.deleteMany(filter);
  const after = await Question.countDocuments({ exam_id: exam._id, is_active: true });

  const subjects = await Subject.find({ exam_id: exam._id, is_active: true }).select('_id name').lean() as any[];
  for (const s of subjects) {
    const c = await Question.countDocuments({ exam_id: exam._id, subject_id: s._id, is_active: true });
    await Subject.findByIdAndUpdate(s._id, { question_count: c });
  }

  console.log(`✓ Sampled candidates matched: ${sampledCount}`);
  console.log(`✓ Deleted: ${del.deletedCount ?? 0}`);
  console.log(`✓ Questions before: ${before}, after: ${after}`);

  await mongoose.disconnect();
}

cleanSampledQuestions().catch((e) => {
  console.error('❌ Cleanup failed:', e);
  process.exit(1);
});

