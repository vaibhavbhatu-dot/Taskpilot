/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {

      // ── Typography (from design-system/tokens/typography.ts) ─────────────
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

      // ── Spacing (from design-system/tokens/spacing.ts — 4px base grid) ───
      spacing: {
        sidebar: '260px',   // project-level token kept
        px:   '1px',
        0.5:  '2px',
        1:    '4px',
        1.5:  '6px',
        2:    '8px',
        2.5:  '10px',
        3:    '12px',
        4:    '16px',
        5:    '20px',
        6:    '24px',
        8:    '32px',
        10:   '40px',
        12:   '48px',
        16:   '64px',
        20:   '80px',
        24:   '96px',
      },

      // ── Width (project-level) ─────────────────────────────────────────────
      width: {
        sidebar: '260px',
      },

      // ── Colors ───────────────────────────────────────────────────────────
      colors: {
        // Existing blue primary scale; DEFAULT + foreground added for shadcn
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },

        // Semantic tokens (CSS variable-driven)
        surface: {
          DEFAULT:  '#F8FAFC',
          '1':      "hsl(var(--surface-1))",
          '2':      "hsl(var(--surface-2))",
          '3':      "hsl(var(--surface-3))",
          elevated: "hsl(var(--surface-elevated))",
        },
        sidebar:  '#0F172A',
        success: {
          DEFAULT:    "hsl(var(--color-success))",
          foreground: "hsl(var(--color-success-foreground))",
        },
        warning: {
          DEFAULT:    "hsl(var(--color-warning))",
          foreground: "hsl(var(--color-warning-foreground))",
        },
        info: {
          DEFAULT:    "hsl(var(--color-info))",
          foreground: "hsl(var(--color-info-foreground))",
        },
        error: {
          DEFAULT:    "hsl(var(--color-error))",
          foreground: "hsl(var(--color-error-foreground))",
        },
        text: {
          primary:   '#0F172A',
          secondary: '#64748B',
          muted:     '#94A3B8',
        },

        // shadcn CSS-variable tokens (neutral base)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },

      // ── Border radius (from design-system/tokens/radius.ts) ──────────────
      // Note: sm/md/lg replace the previous shadcn var(--radius) expressions
      // with static pixel values for predictable, token-driven output.
      borderRadius: {
        none: '0',
        sm:   '4px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        '2xl':'24px',
        full: '9999px',
        // Project-specific aliases kept
        card: '12px',
        btn:  '8px',
      },

      // ── Box shadows (from design-system/tokens/shadows.ts) ───────────────
      boxShadow: {
        sm:    '0 1px 2px 0 hsl(0 0% 0% / 0.05)',
        md:    '0 4px 6px -1px hsl(0 0% 0% / 0.10), 0 2px 4px -2px hsl(0 0% 0% / 0.10)',
        lg:    '0 10px 15px -3px hsl(0 0% 0% / 0.10), 0 4px 6px -4px hsl(0 0% 0% / 0.10)',
        xl:    '0 20px 25px -5px hsl(0 0% 0% / 0.10), 0 8px 10px -6px hsl(0 0% 0% / 0.10)',
        inner: 'inset 0 2px 4px 0 hsl(0 0% 0% / 0.05)',
        // Project flat-design tokens kept
        card:       'none',
        'card-hover': 'none',
      },

      // ── shadcn keyframes ─────────────────────────────────────────────────
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
