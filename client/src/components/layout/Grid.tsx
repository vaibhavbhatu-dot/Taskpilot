import { cn } from '@/lib/utils';

type ColCount = 1 | 2 | 3 | 4 | 6 | 12;

const colMap: Record<ColCount, string> = {
  1:  'grid-cols-1',
  2:  'grid-cols-2',
  3:  'grid-cols-3',
  4:  'grid-cols-4',
  6:  'grid-cols-6',
  12: 'grid-cols-12',
};

const smColMap: Record<ColCount, string> = {
  1:  'sm:grid-cols-1',
  2:  'sm:grid-cols-2',
  3:  'sm:grid-cols-3',
  4:  'sm:grid-cols-4',
  6:  'sm:grid-cols-6',
  12: 'sm:grid-cols-12',
};

const mdColMap: Record<ColCount, string> = {
  1:  'md:grid-cols-1',
  2:  'md:grid-cols-2',
  3:  'md:grid-cols-3',
  4:  'md:grid-cols-4',
  6:  'md:grid-cols-6',
  12: 'md:grid-cols-12',
};

const lgColMap: Record<ColCount, string> = {
  1:  'lg:grid-cols-1',
  2:  'lg:grid-cols-2',
  3:  'lg:grid-cols-3',
  4:  'lg:grid-cols-4',
  6:  'lg:grid-cols-6',
  12: 'lg:grid-cols-12',
};

const gapMap = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
} as const;

interface GridProps {
  cols?: ColCount;
  smCols?: ColCount;
  mdCols?: ColCount;
  lgCols?: ColCount;
  gap?: keyof typeof gapMap;
  className?: string;
  children: React.ReactNode;
}

export function Grid({
  cols = 1,
  smCols,
  mdCols,
  lgCols,
  gap = 'md',
  className,
  children,
}: GridProps) {
  return (
    <div
      className={cn(
        'grid',
        colMap[cols],
        smCols && smColMap[smCols],
        mdCols && mdColMap[mdCols],
        lgCols && lgColMap[lgCols],
        gapMap[gap],
        className,
      )}
    >
      {children}
    </div>
  );
}
