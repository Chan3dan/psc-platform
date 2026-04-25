export interface AppNavItem {
  href: string;
  label: string;
  icon: string;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/feed', label: 'Newsfeed', icon: 'idea' },
  { href: '/exams', label: 'Exams', icon: 'exams' },
  { href: '/practice', label: 'Practice', icon: 'practice' },
  { href: '/mock', label: 'Mock Tests', icon: 'mock' },
  { href: '/drill', label: 'Speed Drill', icon: 'drill' },
  { href: '/review', label: 'Review Queue', icon: 'bookmarks' },
  { href: '/planner', label: 'Study Planner', icon: 'planner' },
  { href: '/results', label: 'Results', icon: 'results' },
  { href: '/leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
  { href: '/notes', label: 'Notes', icon: 'notes' },
  { href: '/bookmarks', label: 'Bookmarks', icon: 'bookmarks' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];
