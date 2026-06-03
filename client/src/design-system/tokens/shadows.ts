export const SHADOWS = {
  sm:    '0 1px 2px 0 hsl(0 0% 0% / 0.05)',
  md:    '0 4px 6px -1px hsl(0 0% 0% / 0.10), 0 2px 4px -2px hsl(0 0% 0% / 0.10)',
  lg:    '0 10px 15px -3px hsl(0 0% 0% / 0.10), 0 4px 6px -4px hsl(0 0% 0% / 0.10)',
  xl:    '0 20px 25px -5px hsl(0 0% 0% / 0.10), 0 8px 10px -6px hsl(0 0% 0% / 0.10)',
  inner: 'inset 0 2px 4px 0 hsl(0 0% 0% / 0.05)',
} as const;

export type ShadowKey = keyof typeof SHADOWS;
