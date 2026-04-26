export type TopicLandingPage = {
  slug: 'computer-operator' | 'loksewa' | 'gk' | 'ict' | 'na-su' | 'kharidar';
  title: string;
  description: string;
  keywords: string[];
  badge: string;
  heading: string;
  intro: string;
  valueProps: string[];
  studyPoints: string[];
  faqs: { question: string; answer: string }[];
  relatedRoutes: Array<{
    href: '/computer-operator' | '/loksewa' | '/gk' | '/ict' | '/na-su' | '/kharidar';
    label: string;
    description: string;
  }>;
  examKeywords: string[];
};

export const TOPIC_LANDING_PAGES: Record<TopicLandingPage['slug'], TopicLandingPage> = {
  'computer-operator': {
    slug: 'computer-operator',
    title: 'Computer Operator Preparation in Nepal',
    description:
      'Practice Computer Operator MCQs, timed mock tests, syllabus-based revision, and result analysis for Nepal Loksewa and PSC exams.',
    keywords: [
      'computer operator preparation Nepal',
      'computer operator loksewa preparation',
      'computer operator mock test Nepal',
      'computer operator MCQ Nepal',
      'computer operator syllabus Nepal',
    ],
    badge: 'Computer Operator Rank Prep',
    heading: 'Computer Operator preparation built for real exam scoring',
    intro:
      'Train with syllabus-aware practice, full-length mocks, and revision loops that match how Computer Operator aspirants actually prepare for Nepal government job exams.',
    valueProps: [
      'Topic-wise practice for office package, database, networking, operating systems, and ICT fundamentals.',
      'Timed mock tests with accuracy, skipped-question review, and negative-marking awareness.',
      'Result review that helps you find weak chapters before your next attempt.',
    ],
    studyPoints: [
      'Use daily MCQ practice to improve recall speed for theory-heavy sections.',
      'Take full mock tests weekly to build stamina and reduce careless mistakes.',
      'Review flagged and incorrect questions to build a tighter revision cycle.',
    ],
    faqs: [
      {
        question: 'Is this page useful for Computer Operator Loksewa preparation?',
        answer:
          'Yes. It is designed around the preparation pattern most Computer Operator aspirants follow: syllabus coverage, MCQ practice, timed mocks, and focused revision.',
      },
      {
        question: 'Can I practice subject-wise before taking a full mock test?',
        answer:
          'Yes. You can build fundamentals through practice and then move into timed mocks once your accuracy and speed improve.',
      },
      {
        question: 'Does result review help improve score?',
        answer:
          'Yes. Reviewing answered, skipped, and flagged questions makes it easier to identify weak sections and reduce repeated mistakes.',
      },
    ],
    relatedRoutes: [
      {
        href: '/loksewa',
        label: 'Loksewa Preparation',
        description: 'Explore broader Loksewa exam strategy, mocks, and preparation flow.',
      },
      {
        href: '/ict',
        label: 'ICT Preparation',
        description: 'Strengthen your technical fundamentals in computer and information topics.',
      },
      {
        href: '/gk',
        label: 'GK Preparation',
        description: 'Improve general knowledge retention for mixed-question government exams.',
      },
    ],
    examKeywords: ['computer operator'],
  },
  loksewa: {
    slug: 'loksewa',
    title: 'Loksewa Preparation Platform for Nepal Aspirants',
    description:
      'Prepare for Loksewa exams in Nepal with mock tests, subject-wise practice, notes, analytics, and study planning on Niyukta.',
    keywords: [
      'loksewa preparation Nepal',
      'loksewa mock test Nepal',
      'psc exam preparation Nepal',
      'nepal civil service exam preparation',
      'loksewa MCQ practice',
    ],
    badge: 'Loksewa Preparation Hub',
    heading: 'A complete Loksewa preparation system, not just a question bank',
    intro:
      'Niyukta helps Loksewa aspirants combine targeted practice, realistic mocks, and revision structure into one workflow so preparation feels measurable and focused.',
    valueProps: [
      'Prepare with exam-specific practice, timed mocks, revision notes, and progress analytics.',
      'Build a repeatable routine for subject coverage, mock simulation, and score review.',
      'Reduce guesswork by using insights that show where your marks are leaking.',
    ],
    studyPoints: [
      'Start with practice by topic to close knowledge gaps before mock simulation.',
      'Use score trends and review screens to improve both accuracy and time management.',
      'Keep revision notes close to your mock workflow so learning compounds faster.',
    ],
    faqs: [
      {
        question: 'Who is this Loksewa page for?',
        answer:
          'It is for Nepal government exam aspirants who want a structured system for practice, mock testing, and revision instead of scattered resources.',
      },
      {
        question: 'Does this help with Computer Operator too?',
        answer:
          'Yes. Computer Operator is one of the strongest fit use cases, and you can also explore the dedicated Computer Operator landing page.',
      },
      {
        question: 'Can I prepare from mobile as well as desktop?',
        answer:
          'Yes. The platform supports mobile-first preparation, practice sessions, and result review across devices.',
      },
    ],
    relatedRoutes: [
      {
        href: '/computer-operator',
        label: 'Computer Operator',
        description: 'Jump into the Computer Operator exam-specific preparation hub.',
      },
      {
        href: '/gk',
        label: 'GK Practice',
        description: 'Sharpen general knowledge preparation for Loksewa-style questions.',
      },
      {
        href: '/ict',
        label: 'ICT Practice',
        description: 'Build the technical base needed for computer-heavy recruitment exams.',
      },
    ],
    examKeywords: ['loksewa', 'psc', 'public service', 'computer operator'],
  },
  'na-su': {
    slug: 'na-su',
    title: 'NaSu Preparation in Nepal',
    description:
      'Prepare for NaSu Loksewa exams in Nepal with syllabus-focused study flow, model questions, subject practice, mock tests, and revision support.',
    keywords: [
      'na su preparation Nepal',
      'nayab subba preparation Nepal',
      'na su syllabus Nepal',
      'na su mock test Nepal',
      'na su old question Nepal',
    ],
    badge: 'NaSu Exam Track',
    heading: 'NaSu preparation that connects syllabus, model questions, and revision',
    intro:
      'NaSu aspirants usually struggle when preparation is scattered across notices, PDFs, old questions, and random notes. This track is designed to make NaSu preparation in Nepal feel organized and measurable.',
    valueProps: [
      'Prepare around syllabus-aware practice, targeted mock sessions, and revision checkpoints.',
      'Use model-question style practice for public management, awareness, and exam-pattern familiarity.',
      'Reduce last-minute confusion by grouping notes, practice, and score review in one flow.',
    ],
    studyPoints: [
      'Start with the latest NaSu syllabus and build chapter coverage before full mock attempts.',
      'Use old-question style revision to understand recurring patterns in Loksewa exams.',
      'Review low-confidence answers early so theory gaps do not stay hidden until exam day.',
    ],
    faqs: [
      {
        question: 'Is this page useful for NaSu Loksewa preparation in Nepal?',
        answer:
          'Yes. It is built for aspirants preparing for Nayab Subba style exams with a mix of syllabus reading, question practice, and structured revision.',
      },
      {
        question: 'Can I use this even if NaSu content is still expanding?',
        answer:
          'Yes. This landing page helps capture the preparation journey and can be expanded with notes, mock tests, and topic pages as coverage grows.',
      },
      {
        question: 'What should I study first for NaSu preparation?',
        answer:
          'Start with the latest syllabus, identify the high-weight sections, and then move into topic practice and model questions before full mock tests.',
      },
    ],
    relatedRoutes: [
      {
        href: '/loksewa',
        label: 'Loksewa Preparation',
        description: 'See the broader Loksewa preparation flow and how NaSu fits into it.',
      },
      {
        href: '/kharidar',
        label: 'Kharidar Preparation',
        description: 'Compare another major Loksewa exam track with similar preparation needs.',
      },
      {
        href: '/computer-operator',
        label: 'Computer Operator',
        description: 'Explore the current strongest live exam track on Niyukta.',
      },
    ],
    examKeywords: ['na su', 'nayab subba', 'subba', 'administration'],
  },
  kharidar: {
    slug: 'kharidar',
    title: 'Kharidar Preparation in Nepal',
    description:
      'Prepare for Kharidar Loksewa exams in Nepal with syllabus guides, subject practice, model questions, mock tests, and revision tools on Niyukta.',
    keywords: [
      'kharidar preparation Nepal',
      'kharidar syllabus Nepal',
      'kharidar mock test Nepal',
      'kharidar old question Nepal',
      'kharidar model question Nepal',
    ],
    badge: 'Kharidar Exam Track',
    heading: 'Kharidar preparation built around syllabus clarity and repeated practice',
    intro:
      'Kharidar preparation in Nepal works best when candidates combine syllabus understanding, topic revision, and repeated model-question practice instead of relying on passive reading alone.',
    valueProps: [
      'Build preparation around the Kharidar syllabus, public-management style revision, and focused practice.',
      'Move from theory coverage into timed attempts and pattern familiarity with mock support.',
      'Use review-driven learning to improve accuracy and reduce repeated mistakes.',
    ],
    studyPoints: [
      'Break the syllabus into weekly chunks so coverage stays realistic and consistent.',
      'Use repeated model-question practice to improve exam rhythm and question interpretation.',
      'Review wrong answers immediately to turn practice into retention, not just exposure.',
    ],
    faqs: [
      {
        question: 'Can Niyukta support Kharidar preparation in Nepal?',
        answer:
          'Yes. This landing page is structured to support Kharidar-focused preparation with room for mock tests, notes, and syllabus-linked study expansion.',
      },
      {
        question: 'Is Kharidar preparation different from Computer Operator preparation?',
        answer:
          'Yes. Computer Operator is more technical, while Kharidar preparation usually needs stronger general, office, and public-management oriented coverage.',
      },
      {
        question: 'What is the best way to start Kharidar preparation?',
        answer:
          'Start with the official syllabus and create a weekly plan around topic coverage, revision, and repeated question practice.',
      },
    ],
    relatedRoutes: [
      {
        href: '/loksewa',
        label: 'Loksewa Preparation',
        description: 'Understand the wider Loksewa study system used across multiple exams.',
      },
      {
        href: '/na-su',
        label: 'NaSu Preparation',
        description: 'Explore a closely related administrative exam preparation track.',
      },
      {
        href: '/gk',
        label: 'GK Practice',
        description: 'Strengthen the general knowledge base used across many Loksewa exams.',
      },
    ],
    examKeywords: ['kharidar', 'assistant', 'loksewa', 'administration'],
  },
  gk: {
    slug: 'gk',
    title: 'GK Practice and Mock Tests for Nepal Government Exams',
    description:
      'Improve GK preparation for Loksewa and Nepal government exams with MCQ practice, review-driven revision, and mock test support.',
    keywords: [
      'GK preparation Nepal',
      'general knowledge MCQ Nepal',
      'GK mock test Nepal',
      'loksewa gk preparation',
      'general knowledge practice for government exams',
    ],
    badge: 'GK Preparation Track',
    heading: 'GK preparation that improves recall, retention, and test-day confidence',
    intro:
      'General knowledge performance usually improves through repetition and review. This page focuses on a rhythm of practice, timed checks, and revision support that suits Loksewa-style preparation.',
    valueProps: [
      'Practice question formats that reward quick recall and broad topic familiarity.',
      'Review wrong and skipped questions to build stronger memory anchors.',
      'Use analytics to see whether your GK score is rising or staying flat.',
    ],
    studyPoints: [
      'Study in short loops so GK revision stays frequent instead of occasional.',
      'Track skipped questions because they usually reveal low-confidence areas.',
      'Retest after revision to confirm that facts are actually sticking.',
    ],
    faqs: [
      {
        question: 'Why use mock tests for GK preparation?',
        answer:
          'Mock tests expose recall gaps under time pressure and show whether your preparation is improving beyond simple reading.',
      },
      {
        question: 'Is this page only for GK-focused exams?',
        answer:
          'No. It is also useful for mixed-exam preparation where GK is one scoring component among technical or aptitude sections.',
      },
      {
        question: 'How should I revise GK effectively?',
        answer:
          'Frequent low-friction practice, review of wrong answers, and repeated retesting work better than passive reading alone.',
      },
    ],
    relatedRoutes: [
      {
        href: '/loksewa',
        label: 'Loksewa Preparation',
        description: 'See how GK fits into the wider Loksewa preparation workflow.',
      },
      {
        href: '/computer-operator',
        label: 'Computer Operator',
        description: 'Combine GK work with a technical Computer Operator track.',
      },
      {
        href: '/ict',
        label: 'ICT Preparation',
        description: 'Balance knowledge-based prep with ICT subject improvement.',
      },
    ],
    examKeywords: ['gk', 'general knowledge', 'loksewa'],
  },
  ict: {
    slug: 'ict',
    title: 'ICT Preparation for Computer-Based Government Exams in Nepal',
    description:
      'Study ICT topics for Nepal government exams with topic practice, timed mocks, result review, and focused revision support.',
    keywords: [
      'ICT preparation Nepal',
      'ICT MCQ Nepal',
      'computer knowledge preparation Nepal',
      'ICT mock test Nepal',
      'information technology preparation loksewa',
    ],
    badge: 'ICT Skill Building',
    heading: 'ICT preparation with stronger practice loops and better technical recall',
    intro:
      'ICT-heavy exams reward clarity across computer fundamentals, office tools, networking, internet concepts, and digital workflows. This page helps users prepare those topics with a more exam-ready flow.',
    valueProps: [
      'Cover technical concepts with structured question practice and result-based review.',
      'Use timed mocks to build speed on computer knowledge and application questions.',
      'Spot weak ICT areas faster using subject-level performance feedback.',
    ],
    studyPoints: [
      'Prioritize repeated practice on application-oriented questions, not just definitions.',
      'Review flagged questions because ICT errors often come from concept confusion.',
      'Alternate between subject practice and full mocks to improve both depth and pace.',
    ],
    faqs: [
      {
        question: 'What topics does ICT preparation usually include?',
        answer:
          'It commonly includes computer fundamentals, operating systems, office tools, networking, internet concepts, and database-related basics.',
      },
      {
        question: 'Is this useful for Computer Operator exams too?',
        answer:
          'Yes. ICT is one of the core preparation areas for Computer Operator and similar technical recruitment exams.',
      },
      {
        question: 'How do I know if my ICT preparation is improving?',
        answer:
          'Use test review and subject performance trends to compare accuracy, skipped questions, and time pressure over multiple attempts.',
      },
    ],
    relatedRoutes: [
      {
        href: '/computer-operator',
        label: 'Computer Operator',
        description: 'Move from ICT fundamentals into the Computer Operator exam path.',
      },
      {
        href: '/loksewa',
        label: 'Loksewa Preparation',
        description: 'Connect your technical prep with the full Loksewa preparation workflow.',
      },
      {
        href: '/gk',
        label: 'GK Preparation',
        description: 'Pair technical preparation with general knowledge revision.',
      },
    ],
    examKeywords: ['ict', 'computer', 'it', 'computer operator'],
  },
};

export const PUBLIC_TOPIC_ROUTES = Object.keys(TOPIC_LANDING_PAGES).map((slug) => `/${slug}`);

export function getTopicLandingPage(slug: string) {
  return TOPIC_LANDING_PAGES[slug as TopicLandingPage['slug']] ?? null;
}
