import mongoose from 'mongoose';
import { Exam, Subject, Question, MockTest } from '../packages/shared/models';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/psc-platform';

function subjectKey(s: any) {
  const slug = String(s?.slug ?? '').trim().toLowerCase();
  if (slug) return slug;
  return String(s?.name ?? '').trim().toLowerCase().replace(/\s+/g, '-');
}

async function syncIntegrity() {
  await mongoose.connect(MONGO_URI);
  console.log('✓ Connected to MongoDB');

  const exams = await Exam.find({}).select('_id slug name').lean() as any[];
  const validExamIds = new Set(exams.map((e) => String(e._id)));

  // Remove orphan subjects/questions not linked to existing exam.
  const allSubjects = await Subject.find({}).select('_id exam_id').lean() as any[];
  const orphanSubjects = allSubjects.filter((s) => !validExamIds.has(String(s.exam_id)));
  if (orphanSubjects.length) {
    const orphanIds = orphanSubjects.map((s) => s._id);
    await Subject.deleteMany({ _id: { $in: orphanIds } });
    await Question.deleteMany({ subject_id: { $in: orphanIds } });
    console.log(`• Removed orphan subjects: ${orphanSubjects.length}`);
  }

  const orphanQuestionResult = await Question.deleteMany({
    exam_id: { $nin: exams.map((e) => e._id) },
  });
  if ((orphanQuestionResult.deletedCount ?? 0) > 0) {
    console.log(`• Removed orphan questions by missing exam: ${orphanQuestionResult.deletedCount}`);
  }

  // Merge duplicate subjects per exam (same slug/name key).
  for (const exam of exams) {
    const subjects = await Subject.find({ exam_id: exam._id }).sort({ createdAt: 1, _id: 1 }).lean() as any[];
    const groups = new Map<string, any[]>();
    for (const s of subjects) {
      const key = subjectKey(s);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s);
    }

    for (const [, group] of groups.entries()) {
      if (group.length <= 1) continue;

      const canonical = group[0];
      const duplicates = group.slice(1);
      const duplicateIds = duplicates.map((d) => d._id);

      await Question.updateMany(
        { exam_id: exam._id, subject_id: { $in: duplicateIds } },
        { $set: { subject_id: canonical._id } }
      );

      const mocks = await MockTest.find({ exam_id: exam._id }).lean() as any[];
      for (const mock of mocks) {
        const dist = Array.isArray(mock?.config?.subject_distribution) ? mock.config.subject_distribution : [];
        let changed = false;
        const merged = new Map<string, any>();
        for (const row of dist) {
          const sid = String(row.subject_id);
          const targetSid = duplicateIds.some((d) => String(d) === sid) ? String(canonical._id) : sid;
          if (targetSid !== sid) changed = true;
          if (!merged.has(targetSid)) {
            merged.set(targetSid, {
              subject_id: new mongoose.Types.ObjectId(targetSid),
              count: Number(row.count ?? 0),
              difficulty_split: {
                easy: Number(row?.difficulty_split?.easy ?? 40),
                medium: Number(row?.difficulty_split?.medium ?? 40),
                hard: Number(row?.difficulty_split?.hard ?? 20),
              },
            });
          } else {
            const prev = merged.get(targetSid);
            prev.count += Number(row.count ?? 0);
          }
        }
        if (changed) {
          await MockTest.findByIdAndUpdate(mock._id, {
            $set: { 'config.subject_distribution': Array.from(merged.values()) },
          });
        }
      }

      await Subject.deleteMany({ _id: { $in: duplicateIds } });
      console.log(`• ${exam.slug}: merged ${duplicates.length} duplicate subject(s) into "${canonical.name}"`);
    }
  }

  // Recompute denormalized subject question counts.
  const subjectsAfter = await Subject.find({}).select('_id').lean() as any[];
  for (const s of subjectsAfter) {
    const c = await Question.countDocuments({ subject_id: s._id, is_active: true });
    await Subject.findByIdAndUpdate(s._id, { question_count: c });
  }
  console.log('✓ Recomputed subject question_count');

  await mongoose.disconnect();
}

syncIntegrity().catch((e) => {
  console.error('❌ Sync failed:', e);
  process.exit(1);
});

