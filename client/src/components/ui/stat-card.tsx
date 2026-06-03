import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: { value: number; period: string };
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  icon,
  loading = false,
  className,
}: StatCardProps) {
  if (loading) {
    return (
      <Card variant="ghost" padding="md" className={cn('flex flex-col gap-3', className)}>
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-28" />
      </Card>
    );
  }

  const isPositive = change !== undefined && change.value >= 0;

  return (
    <Card variant="ghost" padding="md" className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && (
          <span className="flex-shrink-0 text-muted-foreground">{icon}</span>
        )}
      </div>

      <p className="text-[28px] font-bold text-foreground leading-tight tabular-nums">
        {value}
      </p>

      {change !== undefined && (
        <div
          className={cn(
            'flex items-center gap-1 text-xs font-medium',
            isPositive ? 'text-success' : 'text-destructive',
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          <span>
            {isPositive ? '+' : ''}{change.value} {change.period}
          </span>
        </div>
      )}
    </Card>
  );
}
