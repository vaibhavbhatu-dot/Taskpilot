import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  className?: string;
}

export function StatCard({ label, value, trend, trendLabel, icon, iconBg, className }: StatCardProps) {
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {trend !== undefined && (
            <div className={cn('flex items-center gap-1 mt-1.5 text-xs font-medium',
              trendPositive ? 'text-green-600 dark:text-green-400' :
              trendNegative ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground'
            )}>
              {trendPositive ? <TrendingUp className="w-3.5 h-3.5" /> :
               trendNegative ? <TrendingDown className="w-3.5 h-3.5" /> :
               <Minus className="w-3.5 h-3.5" />}
              <span>{Math.abs(trend)}% {trendLabel ?? 'vs last week'}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconBg ?? 'bg-primary/10')}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
