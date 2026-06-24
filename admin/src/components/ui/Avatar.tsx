import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
};

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  return (
    <div className={cn('rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 overflow-hidden', sizeMap[size], className)}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="font-semibold text-primary">{getInitials(name)}</span>
      )}
    </div>
  );
}
