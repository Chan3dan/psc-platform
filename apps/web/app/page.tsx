import type { Metadata } from 'next';
import Link from 'next/link';
import { AppIcon } from '@/components/icons/AppIcon';
import { BrandMark } from '@/components/branding/BrandMark';
import { InstallAppButton } from '@/components/marketing/InstallAppButton';
import { getSiteSettings } from '@/lib/site-settings';
import { getActiveExams } from '@/lib/catalog-data';
import { joinSiteUrl, SEO_KEYWORDS } from '@/lib/seo';

const FEATURES = [
  {
    icon: 'drill',
    title: 'Adaptive Practice Engine',
    desc: 'Subject-wise MCQs with instant explanation, confidence tracking, and weak-topic suggestions.',
  },
  {
    icon: 'practice',
    title: 'Real Exam Mock Mode',
    desc: 'Time-locked mock tests with negative marking, realistic difficulty mix, and result review.',
  },
  {
    icon: 'analytics',
    title: 'Analytics That Guide Action',
    desc: 'Performance trends, subject heatmaps, and insight cards that tell you what to do next.',
  },
  {
    icon: 'planner',
    title: 'Smart Study Planner',
    desc: 'Personalized daily plan based on your exam target, available time, and weak areas.',
  },
  {
    icon: 'notes',
    title: 'Structured Notes Library',
    desc: 'Subject-focused notes and revision material organized to match Loksewa prep flow.',
  },
  {
    icon: 'leaderboard',
    title: 'Consistency System',
    desc: 'Streak motivation, quick-start actions, and progress loops that improve daily discipline.',
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = `${settings.brandName} | Loksewa, Computer Operator & PSC Exam Preparation in Nepal`;
  const description = `${settings.heroDescription} Prepare for Loksewa, Computer Operator, and Nepal civil service exams with mock tests, notes, analytics, and study plans on ${settings.brandName}.`;

  return {
    title,
    description,
    keywords: [
      ...SEO_KEYWORDS,
      `${settings.brandName} Loksewa`,
      `${settings.brandName} Computer Operator`,
      'PSC preparation Nepal',
      'Computer Operator Loksewa Nepal',
    ],
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title,
      description,
      url: '/',
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function LandingPage() {
  const settings = await getSiteSettings();
  const exams = (await getActiveExams()) as any[];
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: settings.brandName,
        url: joinSiteUrl('/'),
        logo: joinSiteUrl(settings.logoUrl),
        description: settings.tagline,
      },
      {
        '@type': 'WebSite',
        name: settings.brandName,
        url: joinSiteUrl('/'),
        potentialAction: {
          '@type': 'SearchAction',
          target: `${joinSiteUrl('/')}?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: settings.brandName,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        description: settings.heroDescription,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'NPR',
        },
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
            <InstallAppButton className="hidden md:inline-flex" />
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
        <div className="grid lg:grid-cols-[1.15fr,0.85fr] gap-8 items-stretch">
          <div className="card glass p-6 md:p-8">
            <div className="inline-flex items-center gap-2 bg-[var(--brand-soft)] text-[var(--brand)] text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              {settings.heroBadge}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-[var(--text)]">
              {settings.heroTitlePrefix}
              <span className="block bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
                {settings.heroTitleHighlight}
              </span>
            </h1>
            <p className="mt-5 text-lg text-[var(--muted)] max-w-2xl">
              {settings.heroDescription}
            </p>
            <p className="mt-3 text-sm text-[var(--muted)] max-w-2xl">
              Built for aspirants targeting Loksewa, Computer Operator, and other Nepal civil service exams.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/register" className="btn-primary text-base px-6 py-3">
                Start with {settings.brandName}
              </Link>
              <Link href="#exams" className="btn-secondary text-base px-6 py-3">
                Browse Exams
              </Link>
              <InstallAppButton className="text-base px-6 py-3" />
            </div>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['10,000+', 'Questions'],
                ['50+', 'Mock Tests'],
                ['5,000+', 'Learners'],
                ['4', 'Exam Tracks'],
              ].map(([n, l]) => (
                <div key={l} className="rounded-xl bg-[var(--brand-soft)]/55 px-3 py-2">
                  <p className="text-lg font-bold text-[var(--text)]">{n}</p>
                  <p className="text-xs text-[var(--muted)]">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 md:p-7 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Why it works</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">A complete feedback loop for top performance</h2>
            </div>
            <div className="mt-5 space-y-3">
              {[
                'Attempt targeted practice sets',
                'Review AI-driven performance insights',
                'Fix weak subjects with guided revision',
                'Retest under exam pressure mode',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-[var(--line)] px-3 py-2.5">
                  <span className="text-emerald-500">
                    <AppIcon name="check" className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-[var(--text)]">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/register" className="btn-secondary mt-6 w-full">
              Create Account in 30 Seconds
            </Link>
          </div>
        </div>
      </section>

      <section className="page-wrap pt-4">
        <h2 className="text-2xl font-semibold text-[var(--text)]">Everything you need, in one workspace</h2>
        <p className="text-[var(--muted)] mt-1">Designed for speed, consistency, and exam-focused outcomes.</p>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                <AppIcon name={feature.icon as any} className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-[var(--text)]">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="exams" className="page-wrap pt-2">
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text)]">Available Exams</h2>
            <p className="text-sm text-[var(--muted)]">Pick your target and start focused practice.</p>
          </div>
          <Link href="/register" className="btn-secondary hidden md:inline-flex">Join Now</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {exams.map((exam: any) => (
            <Link key={exam.slug} href={`/exam/${exam.slug}`} className="card p-5 group">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-[var(--text)] group-hover:text-[var(--brand)] transition-colors">
                  {exam.name}
                </h3>
                <span className="badge-blue">Live</span>
              </div>
              <p className="text-sm text-[var(--muted)] mt-2 line-clamp-2">{exam.description}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-[var(--muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <AppIcon name="mock" className="h-3.5 w-3.5" />
                  {exam.duration_minutes} min
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <AppIcon name="questions" className="h-3.5 w-3.5" />
                  {exam.total_questions} questions
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-wrap pt-2">
        <div className="card p-6 md:p-7">
          <h2 className="text-2xl font-semibold text-[var(--text)]">Who Niyukta is for</h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Computer Operator Aspirants',
                desc: 'Practice topic-wise MCQs, timed mocks, and revision notes tuned for Computer Operator recruitment exams.',
              },
              {
                title: 'Loksewa Candidates',
                desc: 'Use mock tests, analytics, and study plans designed around Loksewa preparation flow and common weak areas.',
              },
              {
                title: 'Nepal PSC Learners',
                desc: 'Track streaks, improve subject accuracy, and prepare with a focused system instead of scattered resources.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-[var(--line)] p-4">
                <h3 className="font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="mt-2 text-sm text-[var(--muted)]">{item.desc}</p>
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
