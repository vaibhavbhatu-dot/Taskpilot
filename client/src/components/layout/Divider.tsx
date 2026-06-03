import { cn } from '@/lib/utils';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  className?: string;
}

export function Divider({ orientation = 'horizontal', label, className }: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <span className={cn('inline-block h-full w-px bg-border', className)} />
    );
  }

  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <span className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
        <span className="flex-1 border-t border-border" />
      </div>
    );
  }

  return <hr className={cn('border-t border-border w-full', className)} />;
}
