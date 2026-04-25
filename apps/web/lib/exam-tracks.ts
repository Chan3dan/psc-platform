export interface UpcomingExamTrack {
  slug: string;
  name: string;
  shortName: string;
  status: 'live' | 'coming_soon';
  description: string;
}

export const UPCOMING_EXAM_TRACKS: UpcomingExamTrack[] = [
  {
    slug: 'computer-operator',
    name: 'Computer Operator',
    shortName: 'Computer Operator',
    status: 'live',
    description: 'Full practice, mock tests, notes, syllabus, analytics, and planner flow are live.',
  },
  {
    slug: 'nasu',
    name: 'NaSu',
    shortName: 'NaSu',
    status: 'coming_soon',
    description: 'Administrative service preparation track with model sets, notes, and performance review.',
  },
  {
    slug: 'kharidar',
    name: 'Kharidar',
    shortName: 'Kharidar',
    status: 'coming_soon',
    description: 'Core objective practice and exam-mode mocks tailored for Kharidar preparation.',
  },
  {
    slug: 'assistant',
    name: 'Assistant / Sahayak',
    shortName: 'Assistant',
    status: 'coming_soon',
    description: 'Targeted job-based knowledge, GK, and office workflow practice for assistant posts.',
  },
];

export function getTrackMetaBySlug(slug: string | null | undefined) {
  if (!slug) return null;
  return UPCOMING_EXAM_TRACKS.find((track) => track.slug === slug) ?? null;
}
