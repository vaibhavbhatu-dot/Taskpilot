import type { ReactNode } from 'react';

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type Variant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive';

export type Status = 'success' | 'warning' | 'error' | 'info';

export type ColorScheme = 'light' | 'dark' | 'system';

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}
