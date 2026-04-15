export interface AdminNavItem {
  href: string;
  label: string;
  icon: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin', label: 'Overview', icon: 'dashboard' },
  { href: '/admin/exams', label: 'Exams', icon: 'exams' },
  { href: '/admin/subjects', label: 'Subjects', icon: 'subjects' },
  { href: '/admin/questions', label: 'Questions', icon: 'questions' },
  { href: '/admin/flagged', label: 'Flagged', icon: 'flagged' },
  { href: '/admin/results', label: 'Results', icon: 'results' },
  { href: '/admin/mocks', label: 'Mocks', icon: 'mock' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/notes', label: 'Notes', icon: 'notes' },
];
