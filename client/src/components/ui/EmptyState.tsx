import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ButtonProps } from '@/components/ui/button';

type ButtonVariant = NonNullable<ButtonProps['variant']>;

interface ActionConfig {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
}

interface SecondaryActionConfig {
  label: string;
  onClick: () => void;
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: ActionConfig;
  secondaryAction?: SecondaryActionConfig;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const paddingMap = {
  sm: 'py-8',
  md: 'py-16',
  lg: 'py-24',
} as const;

const titleSizeMap = {
  sm: 'text-[15px]',
  md: 'text-[17px]',
  lg: 'text-[20px]',
} as const;

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        paddingMap[size],
        className,
      )}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground flex items-center justify-center">
          {icon}
        </div>
      )}

      <p className={cn('font-semibold text-foreground', titleSizeMap[size])}>
        {title}
      </p>

      {description && (
        <p className="mt-1.5 text-[13px] text-muted-foreground max-w-sm mx-auto">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3">
          {action && (
            <Button
              size="sm"
              variant={action.variant ?? 'default'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button size="sm" variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
