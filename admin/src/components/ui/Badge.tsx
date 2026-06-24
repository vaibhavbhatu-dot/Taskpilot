import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:   'bg-primary/15 text-primary',
        secondary: 'bg-muted text-muted-foreground',
        success:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        warning:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        error:     'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        info:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        outline:   'border border-border text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
