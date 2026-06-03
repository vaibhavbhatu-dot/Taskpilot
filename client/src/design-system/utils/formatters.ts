export type ScoreHint = 'good' | 'fair' | 'poor';

export function formatDate(
  date: Date | string,
  format: 'short' | 'long' | 'relative' = 'short',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'relative') {
    const diffMs    = Date.now() - d.getTime();
    const diffSecs  = Math.floor(diffMs / 1000);
    const diffMins  = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays  = Math.floor(diffHours / 24);

    if (diffSecs < 60)   return 'just now';
    if (diffMins < 60)   return `${diffMins} minute${diffMins  === 1 ? '' : 's'} ago`;
    if (diffHours < 24)  return `${diffHours} hour${diffHours  === 1 ? '' : 's'} ago`;
    if (diffDays < 7)    return `${diffDays} day${diffDays     === 1 ? '' : 's'} ago`;
  }

  return d.toLocaleDateString('en-US', {
    month: format === 'long' ? 'long' : 'short',
    day:   'numeric',
    year:  'numeric',
  });
}

export function formatScore(score: number): { value: string; hint: ScoreHint } {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return {
    value: `${clamped}%`,
    hint:  clamped >= 80 ? 'good' : clamped >= 50 ? 'fair' : 'poor',
  };
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}…` : str;
}

export function capitalize(str: string): string {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() ?? '')
    .join('');
}
