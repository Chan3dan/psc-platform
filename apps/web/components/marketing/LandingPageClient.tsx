'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AppIcon } from '@/components/icons/AppIcon';
import { BrandMark } from '@/components/branding/BrandMark';
import { InstallAppButton } from '@/components/marketing/InstallAppButton';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import type { SiteSettings } from '@/lib/site-settings-config';
import { UPCOMING_EXAM_TRACKS } from '@/lib/exam-tracks';

const COPY = {
  en: {
    languageLabel: 'नेपाली',
    signIn: 'Sign in',
    getStarted: 'Get Started',
    browseExams: 'Browse Exams',
    installApp: 'Install App',
    whyLabel: 'Why learners stay',
    whyTitle: 'Focused preparation feels lighter when the platform knows your exam',
    whyItems: [
      'Choose your target exam after login and keep the dashboard focused',
      'Practice only the subjects that matter for your current exam',
      'Open notes, syllabus, mocks, and planner without switching tools',
      'Send feedback and request upcoming exam tracks from one place',
    ],
    cta: 'Start with',
    stats: [
      ['Computer Operator', 'Live track'],
      ['NaSu + Kharidar', 'Coming soon'],
      ['Notes + Syllabus', 'Inside the app'],
      ['Feedback inbox', 'Admin-managed'],
    ],
    featuresTitle: 'One focused workflow, not scattered resources',
    featuresBody: 'Built around the way Loksewa learners actually prepare day to day.',
    features: [
      ['Exam-first dashboard', 'After login, choose your exam and keep the whole app centered on that target.'],
      ['Mock and practice flow', 'Switch between full mocks and subject practice without losing momentum.'],
      ['Notes and syllabus reader', 'Read PDFs inside the app with a clean mobile and desktop study experience.'],
      ['Request next exam', 'If your exam is not live yet, ask the admin to add it and track demand properly.'],
    ],
    tracksTitle: 'Exam tracks',
    tracksBody: 'Live preparation today, expansion path for the next batches.',
    live: 'Live',
    comingSoon: 'Coming soon',
    requestExam: 'Request this exam',
    faqTitle: 'Frequently asked questions',
    faq: [
      ['Which exam is fully supported right now?', 'Computer Operator is the active full track today, including mock tests, subject practice, notes, syllabus, planner, and analytics.'],
      ['What happens after I log in?', 'You choose your target exam first. The app then shows a focused dashboard and study flow for that selected exam instead of mixing every exam together.'],
      ['Can I request NaSu or Kharidar?', 'Yes. Use the request exam form on the home page or inside the dashboard. The request goes to the admin feedback inbox for prioritization.'],
      ['Is Nepali supported?', 'Yes. The landing page now supports Nepali, and the app is being expanded in the same direction for a more local exam-prep experience.'],
    ],
    feedbackTitle: 'Feedback and exam requests',
    feedbackBody: 'Tell us what to improve, what feels slow, or which exam you need next.',
    footerLead: 'Prepare smart. Stay focused. Get',
  },
  ne: {
    languageLabel: 'English',
    signIn: 'लगइन',
    getStarted: 'सुरु गर्नुहोस्',
    browseExams: 'परीक्षा हेर्नुहोस्',
    installApp: 'एप इन्स्टल गर्नुहोस्',
    builtFor: 'गम्भीर लोकसेवा तयारीका लागि',
    heroTitlePrefix: 'नियमित मेहनतलाई',
    heroTitleHighlight: 'र्याङ्कमा बदल्ने तयारी प्रणाली',
    heroBody:
      'Niyukta ले एक समयमा एउटै वास्तविक लक्ष्य परीक्षामा केन्द्रित तयारी गर्न मद्दत गर्छ। मोक टेस्ट, नोट्स, पाठ्यक्रम, रिभिजन र एनालिटिक्स सबै एउटै कार्यक्षेत्रमा छन्।',
    heroSupport:
      'Computer Operator अहिले लाइभ छ। NaSu, Kharidar र अन्य सरकारी पदका ट्र्याकहरू सीधै प्लेटफर्मबाट अनुरोध गर्न सकिन्छ।',
    whyLabel: 'किन उपयोगी छ',
    whyTitle: 'प्लेटफर्मले तपाईंको परीक्षा चिनेपछि तयारी अझ व्यवस्थित हुन्छ',
    whyItems: [
      'लगइनपछि आफ्नो लक्ष्य परीक्षा छान्नुहोस् र सोही अनुसार ड्यासबोर्ड पाउनुहोस्',
      'तपाईंको परीक्षासँग सम्बन्धित विषय मात्र प्राथमिकतामा देखिन्छन्',
      'नोट्स, पाठ्यक्रम, मोक टेस्ट र प्लानर एउटै ठाउँमा खोल्न सकिन्छ',
      'फिडब्याक दिन र नयाँ परीक्षा ट्र्याक माग्न एउटै प्रणाली प्रयोग हुन्छ',
    ],
    cta: 'सुरु गर्नुहोस्',
    stats: [
      ['Computer Operator', 'अहिले लाइभ'],
      ['NaSu + Kharidar', 'चाँडै आउँदै'],
      ['Notes + Syllabus', 'एपभित्र'],
      ['Feedback inbox', 'एडमिनले हेर्ने'],
    ],
    featuresTitle: 'छरिएका सामग्री होइन, एउटै केन्द्रित तयारी प्रवाह',
    featuresBody: 'लोकसेवा अभ्यर्थीले दैनिक गर्ने वास्तविक तयारीलाई ध्यानमा राखेर बनाइएको।',
    features: [
      ['परीक्षा-केन्द्रित ड्यासबोर्ड', 'लगइनपछि परीक्षा छानेपछि सोही लक्ष्यअनुसार पूरा एप व्यवस्थित हुन्छ।'],
      ['मोक र अभ्यास प्रवाह', 'पूर्ण मोक र विषयगत अभ्यासबीच सहज रूपमा जान सकिन्छ।'],
      ['नोट्स र पाठ्यक्रम रिडर', 'मोबाइल र डेस्कटप दुवैमा एपभित्रै PDF अध्ययन गर्न सकिन्छ।'],
      ['अर्को परीक्षा माग गर्नुहोस्', 'तपाईंको परीक्षा लाइभ छैन भने एडमिनलाई अनुरोध पठाउन सकिन्छ।'],
    ],
    tracksTitle: 'परीक्षा ट्र्याकहरू',
    tracksBody: 'आजको लाइभ तयारी र भोलिका आउने ट्र्याकहरूको स्पष्ट योजना।',
    live: 'लाइभ',
    comingSoon: 'चाँडै आउँदै',
    requestExam: 'यो परीक्षा माग गर्नुहोस्',
    faqTitle: 'प्रायः सोधिने प्रश्नहरू',
    faq: [
      ['अहिले कुन परीक्षा पूर्ण रूपमा उपलब्ध छ?', 'Computer Operator अहिले पूर्ण रूपमा उपलब्ध छ, जसमा मोक टेस्ट, विषयगत अभ्यास, नोट्स, पाठ्यक्रम, प्लानर र एनालिटिक्स छन्।'],
      ['लगइनपछि के हुन्छ?', 'पहिले आफ्नो लक्ष्य परीक्षा छान्नुहुन्छ। त्यसपछि एपले सोही परीक्षाअनुसार केन्द्रित ड्यासबोर्ड र अध्ययन प्रवाह देखाउँछ।'],
      ['NaSu वा Kharidar माग्न पाइन्छ?', 'पाइन्छ। होम पेज वा ड्यासबोर्डबाट exam request पठाउन सकिन्छ। त्यो अनुरोध एडमिन feedback inbox मा जान्छ।'],
      ['नेपाली भाषा समर्थन छ?', 'छ। होम पेजमा नेपाली उपलब्ध छ, र एपका अन्य भागहरूमा पनि त्यसै दिशामा विस्तार भइरहेको छ।'],
    ],
    feedbackTitle: 'फिडब्याक र परीक्षा अनुरोध',
    feedbackBody: 'के सुधार चाहिन्छ, के ढिलो छ, र कुन परीक्षा चाहिन्छ हामीलाई लेखेर पठाउनुहोस्।',
    footerLead: 'स्मार्ट तयारी गर्नुहोस्। केन्द्रित रहनुहोस्।',
  },
} as const;

const FEATURE_ICONS = ['dashboard', 'mock', 'notes', 'idea'] as const;

export function LandingPageClient({
  settings,
  exams,
}: {
  settings: SiteSettings;
  exams: Array<{
    _id: string;
    name: string;
    slug: string;
    description: string;
    duration_minutes: number;
    total_questions: number;
  }>;
}) {
  const [language, setLanguage] = useState<'en' | 'ne'>('en');
  const [openFaq, setOpenFaq] = useState(0);
  const [requestedTrack, setRequestedTrack] = useState<{ name: string; slug: string } | null>(null);
  const englishCopy = {
    ...COPY.en,
    builtFor: settings.heroBadge,
    heroTitlePrefix: settings.heroTitlePrefix,
    heroTitleHighlight: settings.heroTitleHighlight,
    heroBody: settings.heroDescription,
    heroSupport:
      'Computer Operator is live now. NaSu, Kharidar, and additional government exam tracks can be requested directly from the platform.',
  };
  const t = language === 'en' ? englishCopy : COPY.ne;

  const trackCards = useMemo(() => {
    return UPCOMING_EXAM_TRACKS.map((track) => {
      const liveExam = exams.find((exam) => exam.slug === track.slug);
      return {
        ...track,
        liveExam,
      };
    });
  }, [exams]);

  return (
    <div className="min-h-screen">
      <div className="page-wrap pb-2">
        <nav className="card glass px-4 sm:px-5 py-3 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <BrandMark name={settings.brandName} logoUrl={settings.logoUrl} subtitle={settings.tagline} compact />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setLanguage((current) => (current === 'en' ? 'ne' : 'en'))}
              className="btn-secondary !px-4 !py-2 text-sm"
            >
              {t.languageLabel}
            </button>
            <InstallAppButton className="hidden md:inline-flex" />
            <Link href="/login" className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors px-2 py-2">
              {t.signIn}
            </Link>
            <Link href="/register" className="btn-primary !px-5 sm:!px-6">
              {t.getStarted}
            </Link>
          </div>
        </nav>
      </div>

      <section className="page-wrap pt-8 md:pt-10">
        <div className="grid lg:grid-cols-[1.12fr,0.88fr] gap-8 items-stretch">
          <div className="card glass p-6 md:p-8">
            <div className="inline-flex items-center gap-2 bg-[var(--brand-soft)] text-[var(--brand)] text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              {t.builtFor}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-[var(--text)]">
              {t.heroTitlePrefix}
              <span className="block bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
                {t.heroTitleHighlight}
              </span>
            </h1>
            <p className="mt-5 text-lg text-[var(--muted)] max-w-2xl">{t.heroBody}</p>
            <p className="mt-3 text-sm text-[var(--muted)] max-w-2xl">{t.heroSupport}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/register" className="btn-primary text-base px-6 py-3">
                {t.cta} {settings.brandName}
              </Link>
              <Link href="#tracks" className="btn-secondary text-base px-6 py-3">
                {t.browseExams}
              </Link>
              <InstallAppButton className="text-base px-6 py-3" />
            </div>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {t.stats.map(([n, l]) => (
                <div key={l} className="rounded-xl bg-[var(--brand-soft)]/55 px-3 py-2">
                  <p className="text-lg font-bold text-[var(--text)]">{n}</p>
                  <p className="text-xs text-[var(--muted)]">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 md:p-7 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t.whyLabel}</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text)]">{t.whyTitle}</h2>
            </div>
            <div className="mt-5 space-y-3">
              {t.whyItems.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-[var(--line)] px-3 py-2.5">
                  <span className="text-emerald-500">
                    <AppIcon name="check" className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-[var(--text)]">{item}</span>
                </div>
              ))}
            </div>
            <Link href="/register" className="btn-secondary mt-6 w-full">
              {language === 'en' ? 'Create account in 30 seconds' : '३० सेकेन्डमा खाता बनाउनुहोस्'}
            </Link>
          </div>
        </div>
      </section>

      <section className="page-wrap pt-4">
        <h2 className="text-2xl font-semibold text-[var(--text)]">{t.featuresTitle}</h2>
        <p className="text-[var(--muted)] mt-1">{t.featuresBody}</p>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {t.features.map(([title, desc], index) => (
            <div key={title} className="card p-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                <AppIcon name={FEATURE_ICONS[index]} className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-[var(--text)]">{title}</h3>
              <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="tracks" className="page-wrap pt-2">
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text)]">{t.tracksTitle}</h2>
            <p className="text-sm text-[var(--muted)]">{t.tracksBody}</p>
          </div>
          <Link href="/register" className="btn-secondary hidden md:inline-flex">
            {t.getStarted}
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {trackCards.map((track) => (
            <div key={track.slug} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-[var(--text)]">{track.name}</h3>
                <span className={track.status === 'live' ? 'badge-blue' : 'badge-amber'}>
                  {track.status === 'live' ? t.live : t.comingSoon}
                </span>
              </div>
              <p className="text-sm text-[var(--muted)] mt-2 line-clamp-3">{track.description}</p>
              {track.liveExam ? (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <AppIcon name="mock" className="h-3.5 w-3.5" />
                      {track.liveExam.duration_minutes} min
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <AppIcon name="questions" className="h-3.5 w-3.5" />
                      {track.liveExam.total_questions} questions
                    </span>
                  </div>
                  <Link href={`/exam/${track.liveExam.slug}`} className="btn-secondary w-full !justify-center">
                    {language === 'en' ? 'View exam' : 'परीक्षा हेर्नुहोस्'}
                  </Link>
                </div>
              ) : (
                <a
                  href="#feedback"
                  onClick={() => setRequestedTrack({ name: track.name, slug: track.slug })}
                  className="mt-4 inline-flex text-sm font-semibold text-[var(--brand)] hover:underline"
                >
                  {t.requestExam}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="page-wrap pt-2">
        <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="card p-6 md:p-7">
            <h2 className="text-2xl font-semibold text-[var(--text)]">{t.faqTitle}</h2>
            <div className="mt-5 space-y-3">
              {t.faq.map(([question, answer], index) => {
                const open = openFaq === index;
                return (
                  <div key={question} className="rounded-2xl border border-[var(--line)]">
                    <button
                      type="button"
                      onClick={() => setOpenFaq((current) => (current === index ? -1 : index))}
                      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                    >
                      <span className="font-semibold text-[var(--text)]">{question}</span>
                      <span className={`text-sm text-[var(--muted)] transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
                    </button>
                    {open ? <p className="px-4 pb-4 text-sm text-[var(--muted)] leading-relaxed">{answer}</p> : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div id="feedback">
            <FeedbackForm
              title={t.feedbackTitle}
              description={t.feedbackBody}
              defaultCategory={requestedTrack ? 'exam_request' : 'general'}
              defaultExamName={requestedTrack?.name ?? ''}
              defaultExamSlug={requestedTrack?.slug ?? ''}
              defaultMessage={
                requestedTrack
                  ? `Please add ${requestedTrack.name} with syllabus, notes, practice sets, mock tests, and performance tracking.`
                  : ''
              }
              compact
            />
          </div>
        </div>
      </section>

      <footer className="page-wrap pt-2 pb-8 text-center text-sm text-[var(--muted)]">
        {language === 'en' ? settings.footerText : `${t.footerLead} ${settings.brandName}.`}
      </footer>
    </div>
  );
}
