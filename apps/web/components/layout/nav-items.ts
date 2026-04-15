export interface AppNavItem {
  href: string;
  label: string;
  icon: string;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '◎' },
  { href: '/exams', label: 'Exams', icon: '📋' },
  { href: '/practice', label: 'Practice', icon: '✏️' },
  { href: '/mock', label: 'Mock Tests', icon: '⏱' },
  { href: '/drill', label: 'Speed Drill', icon: '⚡' },
  { href: '/planner', label: 'Study Planner', icon: '📅' },
  { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { href: '/notes', label: 'Notes', icon: '📚' },
  { href: '/bookmarks', label: 'Bookmarks', icon: '🔖' },
];
