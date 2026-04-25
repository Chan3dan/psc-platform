import { unstable_cache } from 'next/cache';
import { connectDB } from '@/lib/db';
import { Exam, MockTest, Subject } from '@psc/shared/models';

const EXAM_SELECT =
  'name slug description duration_minutes total_marks total_questions negative_marking thumbnail_url syllabus_outline syllabus_pdf_url pattern_config';

export const getActiveExams = unstable_cache(
  async () => {
    try {
      await connectDB();
      return Exam.find({ is_active: true }).select(EXAM_SELECT).lean();
    } catch (error) {
      console.warn('[catalog] active exams unavailable', error);
      return [];
    }
  },
  ['catalog:active-exams'],
  { revalidate: 300 }
);

export async function getExamCatalogBySlug(slug: string) {
  return unstable_cache(
    async () => {
      try {
        await connectDB();
        const exam = (await Exam.findOne({ slug, is_active: true }).lean()) as any;
        if (!exam) return null;

        const [subjects, mockTests] = await Promise.all([
          Subject.find({ exam_id: exam._id, is_active: true })
            .select('name slug weightage_percent question_count description')
            .lean(),
          MockTest.find({ exam_id: exam._id, is_active: true })
            .select('_id title slug duration_minutes total_questions attempt_count total_marks')
            .lean(),
        ]);

        return { exam, subjects, mockTests };
      } catch (error) {
        console.warn(`[catalog] exam ${slug} unavailable`, error);
        return null;
      }
    },
    [`catalog:exam:${slug}`],
    { revalidate: 300 }
  )();
}

export const getActiveMockTests = unstable_cache(
  async () => {
    try {
      await connectDB();
      return MockTest.find({ is_active: true })
        .select('_id title slug duration_minutes total_questions attempt_count exam_id total_marks')
        .populate('exam_id', 'name slug')
        .sort({ created_at: -1 })
        .lean();
    } catch (error) {
      console.warn('[catalog] active mock tests unavailable', error);
      return [];
    }
  },
  ['catalog:active-mock-tests'],
  { revalidate: 300 }
);
