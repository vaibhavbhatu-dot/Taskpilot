export const TYPOGRAPHY = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  fontSize: {
    xs:    ['12px', { lineHeight: '16px' }],
    sm:    ['14px', { lineHeight: '20px' }],
    base:  ['16px', { lineHeight: '24px' }],
    lg:    ['18px', { lineHeight: '28px' }],
    xl:    ['20px', { lineHeight: '28px' }],
    '2xl': ['24px', { lineHeight: '32px' }],
    '3xl': ['30px', { lineHeight: '36px' }],
    '4xl': ['36px', { lineHeight: '40px' }],
  },
  fontWeight: {
    normal:   '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
  },
  letterSpacing: {
    tight:   '-0.02em',
    normal:  '0em',
    wide:    '0.02em',
    wider:   '0.05em',
    widest:  '0.1em',
  },
} as const;

export type FontSize       = keyof typeof TYPOGRAPHY.fontSize;
export type FontWeight     = keyof typeof TYPOGRAPHY.fontWeight;
export type LetterSpacing  = keyof typeof TYPOGRAPHY.letterSpacing;
