import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AISuggestionChipProps {
  suggestion: string;
  onAccept?: () => void;
  onDismiss?: () => void;
  loading?: boolean;
  variant?: 'default' | 'inline';
  className?: string;
}

export function AISuggestionChip({
  suggestion,
  onAccept,
  onDismiss,
  loading = false,
  variant = 'default',
  className,
}: AISuggestionChipProps) {
  const isDefault = variant === 'default';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-sm',
        isDefault && 'rounded-full border px-3 py-1',
        className,
      )}
      style={isDefault ? {
        backgroundColor: 'hsl(var(--color-info) / 0.1)',
        borderColor:     'hsl(var(--color-info) / 0.3)',
      } : undefined}
    >
      {loading ? (
        <Loader2
          className="w-3.5 h-3.5 flex-shrink-0 animate-spin"
          style={{ color: 'hsl(var(--color-info))' }}
        />
      ) : (
        <Sparkles
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: 'hsl(var(--color-info))' }}
        />
      )}

      <span className="text-foreground leading-snug">{suggestion}</span>

      {!loading && (onAccept || onDismiss) && (
        <span className="inline-flex items-center gap-0.5 ml-0.5">
          {onAccept && (
            <button
              type="button"
              onClick={onAccept}
              aria-label="Accept suggestion"
              className="flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Check className="w-3 h-3" />
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss suggestion"
              className="flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      )}
    </span>
  );
}
