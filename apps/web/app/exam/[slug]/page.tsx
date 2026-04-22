import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppIcon } from '@/components/icons/AppIcon';
import { getExamCatalogBySlug } from '@/lib/catalog-data';
import { getSiteSettings } from '@/lib/site-settings';
import { joinSiteUrl, SEO_KEYWORDS } from '@/lib/seo';

type ExamPageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: ExamPageProps): Promise<Metadata> {
  const [settings, data] = await Promise.all([getSiteSettings(), getExamCatalogBySlug(params.slug)]);
  if (!data) {
    return {
      title: `Exam Not Found | ${settings.brandName}`,
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { exam } = data as any;
  const title = `${exam.name} Preparation | ${settings.brandName}`;
  const description = `${exam.description} Practice ${exam.name} with MCQs, mock tests, notes, and analytics on ${settings.brandName}. Strong fit for Loksewa and Computer Operator aspirants in Nepal.`;

  return {
    title,
    description,
    keywords: [...SEO_KEYWORDS, exam.name, `${exam.name} preparation`, `${exam.name} mock test`],
    alternates: {
      canonical: `/exam/${exam.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/exam/${exam.slug}`,
      type: 'article',
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function PublicExamPage({ params }: ExamPageProps) {
  const [settings, data] = await Promise.all([getSiteSettings(), getExamCatalogBySlug(params.slug)]);
  if (!data) notFound();

  const { exam, subjects, mockTests } = data as any;
  const marksPerQuestion = exam.total_questions ? exam.total_marks / exam.total_questions : 1;
  const negativePercent = exam.negative_marking <= 1 ? exam.negative_marking * 100 : exam.negative_marking;
  const negativePerWrong = (marksPerQuestion * negativePercent) / 100;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `${exam.name} preparation`,
    description: exam.description,
    provider: {
      '@type': 'Organization',
      name: settings.brandName,
      url: joinSiteUrl('/'),
    },
    educationalCredentialAwarded: exam.name,
    about: [
      'Loksewa preparation',
      'Computer Operator preparation',
      'Nepal civil service exam preparation',
    ],
    url: joinSiteUrl(`/exam/${exam.slug}`),
  };

  return (
    <div className="min-h-screen">
      <div className="page-wrap space-y-8 py-6 md:py-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <div className="card glass p-6 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)]">
                Home
              </Link>
              <span className="badge-blue">Public Exam Guide</span>
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--text)]">{exam.name}</h1>
              <p className="max-w-3xl text-sm md:text-base text-[var(--muted)]">{exam.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <AppIcon name="mock" className="h-4 w-4" />
                  <strong>{exam.duration_minutes}</strong> min
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <AppIcon name="questions" className="h-4 w-4" />
                  <strong>{exam.total_questions}</strong> questions
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <AppIcon name="analytics" className="h-4 w-4" />
                  <strong>{exam.total_marks}</strong> marks
                </span>
                <span className="inline-flex items-center gap-1.5 text-red-500">
                  <AppIcon name="alert" className="h-4 w-4" />
                  <strong>{negativePercent}%</strong> ({negativePerWrong.toFixed(2)} per wrong)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary">
                Start Preparing
              </Link>
              <Link href="/login" className="btn-secondary">
                Sign In
              </Link>
            </div>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-[1fr,0.9fr]">
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-[var(--text)]">Subjects Covered</h2>
            <p className="text-sm text-[var(--muted)] mt-1">Topic coverage for {exam.name} practice and revision.</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(subjects as any[]).map((subject) => (
                <div key={subject._id} className="rounded-2xl border border-[var(--line)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-[var(--text)]">{subject.name}</h3>
                    <span className="badge-blue">{subject.weightage_percent}%</span>
                  </div>
                  {subject.description && (
                    <p className="text-xs text-[var(--muted)] mt-2">{subject.description}</p>
                  )}
                  <p className="text-xs text-[var(--muted)] mt-2">{subject.question_count} questions</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-semibold text-[var(--text)]">Why prepare with {settings.brandName}?</h2>
            <div className="mt-4 space-y-3">
              {[
                'Realistic Loksewa-style MCQ practice with timer-based sessions',
                'Computer Operator and civil service exam mock tests with negative marking',
                'Revision notes, analytics, and weak-topic tracking in one place',
                'Designed for Nepal aspirants who want focused rank improvement',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-[var(--line)] px-4 py-3">
                  <span className="text-emerald-500 mt-0.5">
                    <AppIcon name="check" className="h-4 w-4" />
                  </span>
                  <p className="text-sm text-[var(--text)]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text)]">Available Mock Tests</h2>
              <p className="text-sm text-[var(--muted)] mt-1">Preview the mock tests available after sign in.</p>
            </div>
            <Link href="/register" className="btn-secondary hidden md:inline-flex">
              Unlock All
            </Link>
          </div>

          {mockTests.length === 0 ? (
            <p className="text-sm text-[var(--muted)] mt-4">No mock tests available yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {(mockTests as any[]).map((mockTest) => (
                <div key={mockTest._id} className="rounded-2xl border border-[var(--line)] p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-medium text-[var(--text)]">{mockTest.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[var(--muted)]">
                      <span className="inline-flex items-center gap-1">
                        <AppIcon name="mock" className="h-3.5 w-3.5" />
                        {mockTest.duration_minutes} min
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <AppIcon name="questions" className="h-3.5 w-3.5" />
                        {mockTest.total_questions} questions
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <AppIcon name="users" className="h-3.5 w-3.5" />
                        {mockTest.attempt_count} attempts
                      </span>
                    </div>
                  </div>
                  <Link href="/register" className="btn-primary text-sm">
                    Start with {settings.brandName}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
