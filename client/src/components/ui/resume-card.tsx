import { FileText, MoreHorizontal, Pencil, Copy, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreBar } from '@/components/ui/score-bar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/design-system/utils/formatters';
import { cn } from '@/lib/utils';

type ResumeStatus = 'draft' | 'tailored' | 'applied' | 'archived';

const STATUS_CONFIG: Record<ResumeStatus, { label: string; variant: 'secondary' | 'info' | 'success' | 'outline' }> = {
  draft:    { label: 'Draft',    variant: 'secondary' },
  tailored: { label: 'Tailored', variant: 'info'      },
  applied:  { label: 'Applied',  variant: 'success'   },
  archived: { label: 'Archived', variant: 'outline'   },
};

export interface ResumeCardProps {
  id: string;
  title: string;
  lastModified: Date | string;
  matchScore?: number;
  status: ResumeStatus;
  jobTitle?: string;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function ResumeCard({
  title,
  lastModified,
  matchScore,
  status,
  jobTitle,
  onEdit,
  onDuplicate,
  onDelete,
  className,
}: ResumeCardProps) {
  const { label, variant } = STATUS_CONFIG[status];

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3 pr-8">
          <div className="mt-0.5 flex-shrink-0 text-muted-foreground">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-foreground leading-snug truncate">
              {title}
            </p>
            {jobTitle && (
              <p className="text-[12px] text-muted-foreground mt-0.5 truncate">
                {jobTitle}
              </p>
            )}
          </div>
        </div>

        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Card actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="w-4 h-4" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={variant} size="sm">{label}</Badge>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {formatDate(lastModified, 'relative')}
          </span>
        </div>

        {matchScore !== undefined && (
          <ScoreBar score={matchScore} size="sm" label="Match score" />
        )}
      </CardContent>
    </Card>
  );
}
