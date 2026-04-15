export interface AdminNavItem {
  href: string;
  label: string;
  icon: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin', label: 'Overview', icon: '◎' },
  { href: '/admin/exams', label: 'Exams', icon: '📋' },
  { href: '/admin/subjects', label: 'Subjects', icon: '🧩' },
  { href: '/admin/questions', label: 'Questions', icon: '❓' },
  { href: '/admin/mocks', label: 'Mocks', icon: '⏱' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/notes', label: 'Notes', icon: '📚' },
];
