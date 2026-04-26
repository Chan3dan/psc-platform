import type { Metadata } from 'next';
import Link from 'next/link';
import { AppIcon } from '@/components/icons/AppIcon';
import { BrandMark } from '@/components/branding/BrandMark';
import { getSiteSettings } from '@/lib/site-settings';
import { getActiveExams } from '@/lib/catalog-data';
import { getTopicLandingPage, type TopicLandingPage } from '@/lib/seo-landing-pages';
import { joinSiteUrl, SEO_KEYWORDS } from '@/lib/seo';

type ExamLike = {
  slug: string;
  name: string;
  description?: string;
  duration_minutes?: number;
  total_questions?: number;
};

function pickRelevantExams(exams: ExamLike[], keywords: string[]) {
  const normalizedKeywords = keywords.map((value) => value.toLowerCase());
  const matches = exams.filter((exam) => {
    const haystack = `${exam.name} ${exam.description ?? ''}`.toLowerCase();
    return normalizedKeywords.some((keyword) => haystack.includes(keyword));
  });

  return (matches.length > 0 ? matches : exams).slice(0, 6);
}

function normalizeExams(input: unknown): ExamLike[] {
  if (!Array.isArray(input)) return [];

  const exams: Array<ExamLike | null> = input
    .map((item) => {
      const exam = item as Record<string, unknown>;
      const slug = typeof exam.slug === 'string' ? exam.slug : '';
      const name = typeof exam.name === 'string' ? exam.name : '';

      if (!slug || !name) {
        return null;
      }

      return {
        slug,
        name,
        description: typeof exam.description === 'string' ? exam.description : undefined,
        duration_minutes:
          typeof exam.duration_minutes === 'number' ? exam.duration_minutes : undefined,
        total_questions:
          typeof exam.total_questions === 'number' ? exam.total_questions : undefined,
      };
    });

  return exams.filter((exam): exam is ExamLike => exam !== null);
}

export async function buildTopicMetadata(slug: TopicLandingPage['slug']): Promise<Metadata> {
  const settings = await getSiteSettings();
  const topic = getTopicLandingPage(slug);

  if (!topic) {
    return {};
  }

  const title = `${topic.title} | ${settings.brandName}`;
  const description = `${topic.description} Prepare smarter with ${settings.brandName}.`;

  return {
    title,
    description,
    keywords: [...SEO_KEYWORDS, ...topic.keywords, `${settings.brandName} ${topic.slug}`],
    alternates: {
      canonical: `/${topic.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/${topic.slug}`,
    },
    twitter: {
      title,
      description,
    },
  };
}

export async function PublicTopicPage({ slug }: { slug: TopicLandingPage['slug'] }) {
  const [settings, exams] = await Promise.all([getSiteSettings(), getActiveExams()]);
  const topic = getTopicLandingPage(slug);

  if (!topic) {
    return null;
  }

  const relevantExams = pickRelevantExams(normalizeExams(exams), topic.examKeywords);
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: settings.brandName,
            item: joinSiteUrl('/'),
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: topic.title,
            item: joinSiteUrl(`/${topic.slug}`),
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: topic.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
      {
        '@type': 'WebPage',
        name: topic.title,
        url: joinSiteUrl(`/${topic.slug}`),
        description: topic.description,
        inLanguage: 'en-NP',
      },
      {
        '@type': 'Course',
        name: `${topic.title} course path`,
        description: topic.description,
        provider: {
          '@type': 'Organization',
          name: settings.brandName,
          url: joinSiteUrl('/'),
        },
        about: topic.keywords,
        url: joinSiteUrl(`/${topic.slug}`),
      },
    ],
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="page-wrap pb-2">
        <nav className="card glass px-4 sm:px-5 py-3 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <BrandMark
              name={settings.brandName}
              logoUrl={settings.logoUrl}
              subtitle={settings.tagline}
              compact
            />
          </div>
          <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
            <Link href="/login" className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors px-2 py-2">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary !px-5 sm:!px-6">
              Get Started
            </Link>
          </div>
        </nav>
      </div>

      <section className="page-wrap pt-8 md:pt-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="card glass p-6 md:p-8">
            <div className="inline-flex items-center gap-2 bg-[var(--brand-soft)] text-[var(--brand)] text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              {topic.badge}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-[var(--text)]">
              {topic.heading}
            </h1>
            <p className="mt-5 text-lg text-[var(--muted)] max-w-3xl">
              {topic.intro}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary text-base px-6 py-3">
                Start with {settings.brandName}
              </Link>
              <Link href="/#exams" className="btn-secondary text-base px-6 py-3">
                Browse Live Exams
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {topic.valueProps.map((item) => (
                <div key={item} className="rounded-2xl bg-[var(--brand-soft)]/55 px-4 py-3">
                  <p className="text-sm font-medium text-[var(--text)] leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 md:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Study flow</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">How to use this track effectively</h2>
            <div className="mt-5 space-y-3">
              {topic.studyPoints.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-[var(--line)] px-3 py-3">
                  <span className="mt-0.5 text-emerald-500">
                    <AppIcon name="check" className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-[var(--text)] leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-wrap pt-3">
        <div className="card p-6 md:p-7">
          <div className="flex items-end justify-between gap-3 mb-5">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--text)]">Recommended exams and practice paths</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                These links help search visitors move from reading into actual preparation.
              </p>
            </div>
            <Link href="/register" className="btn-secondary hidden md:inline-flex">
              Create free account
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {relevantExams.map((exam) => (
              <Link key={exam.slug} href={`/exam/${exam.slug}`} className="card p-5 group">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-[var(--text)] group-hover:text-[var(--brand)] transition-colors">
                    {exam.name}
                  </h3>
                  <span className="badge-blue">Live</span>
                </div>
                <p className="text-sm text-[var(--muted)] mt-2 line-clamp-3">{exam.description}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-[var(--muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <AppIcon name="mock" className="h-3.5 w-3.5" />
                    {exam.duration_minutes ?? 0} min
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <AppIcon name="questions" className="h-3.5 w-3.5" />
                    {exam.total_questions ?? 0} questions
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-wrap pt-3">
        <div className="grid gap-5 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="card p-6 md:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Search intent coverage</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">{topic.title}</h2>
            <p className="mt-3 text-[var(--muted)] leading-relaxed">
              {topic.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {topic.keywords.map((keyword) => (
                <span key={keyword} className="badge-gray">
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-6 md:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Related preparation pages</p>
            <div className="mt-4 space-y-3">
              {topic.relatedRoutes.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-start gap-3 rounded-xl border border-[var(--line)] px-4 py-3 hover:border-[var(--brand)] transition-colors">
                  <span className="mt-0.5 text-[var(--brand)]">
                    <AppIcon name="arrow-right" className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-[var(--text)]">{item.label}</span>
                    <span className="mt-1 block text-sm text-[var(--muted)] leading-relaxed">{item.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="page-wrap pt-3">
        <div className="card p-6 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">FAQ</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">Common questions</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {topic.faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-[var(--line)] p-4">
                <h3 className="font-semibold text-[var(--text)]">{faq.question}</h3>
                <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="page-wrap pt-2 pb-8 text-center text-sm text-[var(--muted)]">
        {settings.footerText}
      </footer>
    </div>
  );
}
