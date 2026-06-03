import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ScoreBarProps {
  score: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const heightMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
} as const;

function scoreColor(score: number): string {
  if (score < 40)  return 'hsl(var(--color-error))';
  if (score < 70)  return 'hsl(var(--color-warning))';
  return 'hsl(var(--color-success))';
}

export function ScoreBar({
  score,
  label,
  showValue = true,
  size = 'md',
  animated = true,
  className,
}: ScoreBarProps) {
  const clamped = Math.min(100, Math.max(0, score));
  const [width, setWidth] = useState(animated ? 0 : clamped);
  const mounted = useRef(false);

  useEffect(() => {
    if (!animated) return;
    // defer one frame so the CSS transition fires
    const id = requestAnimationFrame(() => {
      setWidth(clamped);
    });
    return () => cancelAnimationFrame(id);
  }, [clamped, animated]);

  // Reset on score change if already mounted
  useEffect(() => {
    if (!animated) return;
    if (mounted.current) {
      setWidth(0);
      const id = setTimeout(() => setWidth(clamped), 50);
      return () => clearTimeout(id);
    }
    mounted.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          {showValue && (
            <span className="text-xs font-medium tabular-nums ml-auto">
              {clamped}%
            </span>
          )}
        </div>
      )}

      <div className={cn('w-full rounded-full bg-muted overflow-hidden', heightMap[size])}>
        <div
          className={cn('h-full rounded-full')}
          style={{
            width: `${width}%`,
            backgroundColor: scoreColor(clamped),
            transition: animated ? 'width 800ms ease-out' : undefined,
          }}
        />
      </div>
    </div>
  );
}
