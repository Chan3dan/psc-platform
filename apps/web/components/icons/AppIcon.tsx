type IconName =
  | 'dashboard'
  | 'exams'
  | 'practice'
  | 'mock'
  | 'drill'
  | 'planner'
  | 'leaderboard'
  | 'notes'
  | 'bookmarks'
  | 'admin'
  | 'subjects'
  | 'questions'
  | 'analytics'
  | 'users'
  | 'results'
  | 'flagged'
  | 'logout'
  | 'check'
  | 'alert'
  | 'idea'
  | 'upload'
  | 'close'
  | 'arrow-right';

interface AppIconProps {
  name: IconName;
  className?: string;
}

export function AppIcon({ name, className = 'h-5 w-5' }: AppIconProps) {
  const baseProps = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg {...baseProps}>
          <path d="M3 12.5 12 4l9 8.5" />
          <path d="M5.5 10.5V20h13V10.5" />
          <path d="M9.5 20v-5h5v5" />
        </svg>
      );
    case 'exams':
      return (
        <svg {...baseProps}>
          <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
          <path d="M8.5 8h7" />
          <path d="M8.5 12h7" />
          <path d="M8.5 16h4.5" />
        </svg>
      );
    case 'practice':
      return (
        <svg {...baseProps}>
          <path d="m4 20 4.5-1 9-9a2.1 2.1 0 0 0-3-3l-9 9L4 20Z" />
          <path d="m13 7 4 4" />
        </svg>
      );
    case 'mock':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="13" r="7.5" />
          <path d="M12 13V9.5" />
          <path d="M12 13l2.8 2" />
          <path d="M9 3.5h6" />
        </svg>
      );
    case 'drill':
      return (
        <svg {...baseProps}>
          <path d="M13 2 6 13h5l-1 9 8-12h-5l1-8Z" />
        </svg>
      );
    case 'planner':
      return (
        <svg {...baseProps}>
          <rect x="4" y="5" width="16" height="15" rx="2.5" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M4 9.5h16" />
          <path d="M8 13h3" />
          <path d="M13 13h3" />
          <path d="M8 16.5h3" />
        </svg>
      );
    case 'leaderboard':
      return (
        <svg {...baseProps}>
          <path d="M8 20h8" />
          <path d="M12 16v4" />
          <path d="M7 4h10v3a5 5 0 0 1-10 0V4Z" />
          <path d="M7 6H5a2 2 0 0 0 2 2" />
          <path d="M17 6h2a2 2 0 0 1-2 2" />
        </svg>
      );
    case 'notes':
      return (
        <svg {...baseProps}>
          <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5a1.5 1.5 0 0 1 1-1.5Z" />
          <path d="M14 3.5V8h4" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </svg>
      );
    case 'bookmarks':
      return (
        <svg {...baseProps}>
          <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3-6 3V5.5a1 1 0 0 1 1-1Z" />
        </svg>
      );
    case 'admin':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7.8 7.8 0 0 0-1.8-1.1l-.3-2.6H10l-.3 2.6a7.8 7.8 0 0 0-1.8 1.1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7.8 7.8 0 0 0 1.8 1.1l.3 2.6h4.4l.3-2.6a7.8 7.8 0 0 0 1.8-1.1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
        </svg>
      );
    case 'subjects':
      return (
        <svg {...baseProps}>
          <rect x="4" y="5" width="7" height="7" rx="1.5" />
          <rect x="13" y="5" width="7" height="7" rx="1.5" />
          <rect x="4" y="14" width="7" height="7" rx="1.5" />
          <rect x="13" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'questions':
      return (
        <svg {...baseProps}>
          <path d="M9.5 9a2.5 2.5 0 1 1 4.7 1.2c-.6 1.1-1.7 1.5-2.2 2.3-.2.3-.3.6-.3 1" />
          <circle cx="12" cy="17.5" r=".8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case 'analytics':
      return (
        <svg {...baseProps}>
          <path d="M4 20h16" />
          <path d="M7 16v-4" />
          <path d="M12 16V8" />
          <path d="M17 16v-7" />
        </svg>
      );
    case 'users':
      return (
        <svg {...baseProps}>
          <circle cx="9" cy="8" r="3" />
          <path d="M4.5 19a4.5 4.5 0 0 1 9 0" />
          <circle cx="17.5" cy="9" r="2.5" />
          <path d="M14.8 19a4 4 0 0 1 5.2-3.8" />
        </svg>
      );
    case 'results':
      return (
        <svg {...baseProps}>
          <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5a1.5 1.5 0 0 1 1-1.5Z" />
          <path d="M14 3.5V8h4" />
          <path d="M9 12.5h6" />
          <path d="M9 16.5h6" />
          <path d="m9 9.5 1.5 1.5 3-3" />
        </svg>
      );
    case 'flagged':
      return (
        <svg {...baseProps}>
          <path d="M6.5 20V4.5" />
          <path d="M6.5 5h8.2l-1.8 3 1.8 3H6.5" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...baseProps}>
          <path d="M14 7V5.5A1.5 1.5 0 0 0 12.5 4h-6A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20h6a1.5 1.5 0 0 0 1.5-1.5V17" />
          <path d="M10 12h10" />
          <path d="m17 8 4 4-4 4" />
        </svg>
      );
    case 'check':
      return (
        <svg {...baseProps}>
          <path d="m5 12 4.2 4.2L19 6.5" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...baseProps}>
          <path d="M12 4 3.8 18.5h16.4L12 4Z" />
          <path d="M12 9v4.5" />
          <circle cx="12" cy="16.5" r=".8" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'idea':
      return (
        <svg {...baseProps}>
          <path d="M9 18h6" />
          <path d="M10 21h4" />
          <path d="M8.7 14.5A5.5 5.5 0 1 1 15.3 14.5c-.7.6-1.1 1.2-1.3 2h-4c-.2-.8-.6-1.4-1.3-2Z" />
        </svg>
      );
    case 'upload':
      return (
        <svg {...baseProps}>
          <path d="M12 16V5" />
          <path d="m7.5 9.5 4.5-4.5 4.5 4.5" />
          <path d="M5 19.5h14" />
        </svg>
      );
    case 'close':
      return (
        <svg {...baseProps}>
          <path d="m6 6 12 12" />
          <path d="M18 6 6 18" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...baseProps}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );
    default:
      return null;
  }
}
