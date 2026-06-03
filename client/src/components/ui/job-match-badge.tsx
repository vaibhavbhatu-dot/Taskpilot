import { Badge } from '@/components/ui/badge';
import type { BadgeProps } from '@/components/ui/badge';

export interface JobMatchBadgeProps {
  score: number;
  showScore?: boolean;
  size?: BadgeProps['size'];
  className?: string;
}

type MatchTier = {
  label: string;
  variant: NonNullable<BadgeProps['variant']>;
};

function matchTier(score: number): MatchTier {
  if (score < 40)  return { label: 'Poor match',      variant: 'error'     };
  if (score < 60)  return { label: 'Fair match',      variant: 'warning'   };
  if (score < 80)  return { label: 'Good match',      variant: 'secondary' };
  return               { label: 'Excellent match', variant: 'success'   };
}

export function JobMatchBadge({ score, showScore, size, className }: JobMatchBadgeProps) {
  const { label, variant } = matchTier(score);
  const clamped = Math.min(100, Math.max(0, score));

  return (
    <Badge variant={variant} size={size} className={className}>
      {label}{showScore && ` (${clamped}%)`}
    </Badge>
  );
}
