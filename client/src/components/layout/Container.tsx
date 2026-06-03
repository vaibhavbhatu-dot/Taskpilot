import { cn } from '@/lib/utils';

const sizeMap = {
  sm:   'max-w-screen-sm',
  md:   'max-w-screen-md',
  lg:   'max-w-screen-lg',
  xl:   'max-w-screen-xl',
  full: 'max-w-full',
} as const;

interface ContainerProps {
  size?: keyof typeof sizeMap;
  className?: string;
  children: React.ReactNode;
}

export function Container({ size = 'lg', className, children }: ContainerProps) {
  return (
    <div className={cn('mx-auto px-4 sm:px-6 w-full', sizeMap[size], className)}>
      {children}
    </div>
  );
}
