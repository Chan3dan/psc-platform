import type { Metadata } from 'next';
import { LandingPageClient } from '@/components/marketing/LandingPageClient';
import { getActiveExams } from '@/lib/catalog-data';
import { getSiteSettings } from '@/lib/site-settings';
import { joinSiteUrl, SEO_KEYWORDS } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = `${settings.brandName} | Loksewa, Computer Operator & PSC Exam Preparation in Nepal`;
  const description = `${settings.heroDescription} Prepare for Loksewa, Computer Operator, and Nepal civil service exams with mock tests, notes, analytics, study plans, and exam-focused practice on ${settings.brandName}.`;

  return {
    title,
    description,
    keywords: [
      ...SEO_KEYWORDS,
      `${settings.brandName} Loksewa`,
      `${settings.brandName} Computer Operator`,
      `${settings.brandName} Nepal exam prep`,
      'NaSu preparation Nepal',
      'Kharidar preparation Nepal',
      'Loksewa app Nepal',
    ],
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title,
      description,
      url: '/',
      type: 'website',
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
          target: `${joinSiteUrl('/')}search?q={search_term_string}`,
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
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Which exam is fully supported right now?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Computer Operator is the active full track today, including mock tests, subject practice, notes, syllabus, planner, and analytics.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I request NaSu or Kharidar?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. You can request upcoming exam tracks directly from the home page or dashboard feedback flow.',
            },
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: 'Featured exam preparation tracks',
        itemListElement: [
          { '@type': 'ListItem', position: 1, url: joinSiteUrl('/computer-operator'), name: 'Computer Operator Preparation' },
          { '@type': 'ListItem', position: 2, url: joinSiteUrl('/na-su'), name: 'NaSu Preparation' },
          { '@type': 'ListItem', position: 3, url: joinSiteUrl('/kharidar'), name: 'Kharidar Preparation' },
          { '@type': 'ListItem', position: 4, url: joinSiteUrl('/loksewa'), name: 'Loksewa Preparation' },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPageClient
        settings={settings}
        exams={exams.map((exam: any) => ({
          _id: String(exam._id),
          name: exam.name,
          slug: exam.slug,
          description: exam.description ?? '',
          duration_minutes: exam.duration_minutes,
          total_questions: exam.total_questions,
        }))}
      />
    </>
  );
}
