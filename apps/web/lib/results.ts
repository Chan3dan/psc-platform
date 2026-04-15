export function formatDuration(totalSeconds?: number | null) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds ?? 0)));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${remainingSeconds}s`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

const RESULT_TIMEZONE = 'Asia/Kathmandu';

export function formatResultDate(date?: string | Date | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-NP', {
    timeZone: RESULT_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatResultDateTime(date?: string | Date | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-NP', {
    timeZone: RESULT_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(date));
}
