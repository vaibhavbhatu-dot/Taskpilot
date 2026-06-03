# Contributing a new component

Five steps, every time. Don't skip any — each step is load-bearing.

---

## Step 1 — Create the file in the correct folder

| What you're building | Folder |
|---|---|
| Generic UI primitive (Button-like, Input-like) | `src/components/ui/<name>.tsx` |
| Feature-specific product component | `src/components/ui/<feature>-<name>.tsx` |
| Layout / structural wrapper | `src/components/layout/<Name>.tsx` |

**File naming:** `kebab-case.tsx`. Component export: `PascalCase`.

```
src/components/ui/progress-ring.tsx    → export function ProgressRing(...)
src/components/ui/sprint-badge.tsx     → export function SprintBadge(...)
src/components/layout/SplitPane.tsx    → export function SplitPane(...)
```

Minimal file skeleton:

```tsx
import { cn } from '@/lib/utils';

export interface MyComponentProps {
  // define all props here — export the interface
  className?: string;
  children?: React.ReactNode;
}

export function MyComponent({ className, children }: MyComponentProps) {
  return (
    <div className={cn('/* base classes */', className)}>
      {children}
    </div>
  );
}
```

---

## Step 2 — Use `cva` for variants (if the component has visual variants)

Use `cva` (class-variance-authority) any time you have more than one
visual mode (e.g. size, color, shape). Don't branch on props with
ternaries — it doesn't scale.

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const progressRingVariants = cva(
  // base classes applied to every variant
  'inline-flex items-center justify-center rounded-full',
  {
    variants: {
      size: {
        sm: 'w-8 h-8 text-xs',
        md: 'w-12 h-12 text-sm',
        lg: 'w-16 h-16 text-base',
      },
      variant: {
        default:     'text-foreground',
        success:     'text-[hsl(var(--color-success))]',
        destructive: 'text-destructive',
      },
    },
    defaultVariants: {
      size:    'md',
      variant: 'default',
    },
  },
);

export interface ProgressRingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressRingVariants> {
  value: number;   // 0–100
}

export function ProgressRing({ size, variant, value, className, ...props }: ProgressRingProps) {
  return (
    <div className={cn(progressRingVariants({ size, variant }), className)} {...props}>
      {value}%
    </div>
  );
}
```

If a component has **no variants** (it always looks the same), skip
`cva` and just use `cn()` directly.

---

## Step 3 — Use `cn()` for class merging

`cn()` (from `@/lib/utils`) merges Tailwind classes and lets callers
override styles via the `className` prop. It uses `clsx` + `tailwind-merge`
under the hood, so conflicting classes are resolved correctly.

```tsx
// ✅ always spread className last so callers can override
import { cn } from '@/lib/utils';  // or from '@/design-system'

<div className={cn('flex items-center gap-2 rounded-md', className)} />

// ❌ wrong — caller's className gets overridden by the base, not merged
<div className={`flex items-center gap-2 ${className}`} />
```

**Dark mode:** never use hardcoded colors anywhere in the component.
See `PATTERNS.md §7` for the full rules.

---

## Step 4 — Export from the category barrel

After creating the file, re-export it from the folder's `index.ts`
so it's available to other files in the system:

**For `src/components/ui/` components:**

There is no `ui/index.ts` — go directly to Step 5.

**For `src/components/layout/` components:**

```ts
// src/components/layout/index.ts
export { SplitPane } from './SplitPane';
// + export the Props type if external consumers need it
export type { SplitPaneProps } from './SplitPane';
```

---

## Step 5 — Add to `src/design-system/index.ts`

This is the single public API of the system. Every component that
external pages and features will use **must** be listed here.

```ts
// src/design-system/index.ts

// ── Layout ──────────────────────────────────────────────────────────────────
export { SplitPane } from "@/components/layout"
export type { SplitPaneProps } from "@/components/layout"

// ── Product ──────────────────────────────────────────────────────────────────
export { SprintBadge } from "@/components/ui/sprint-badge"
export type { SprintBadgeProps } from "@/components/ui/sprint-badge"
```

Rules:
- Export the component **and** its Props type.
- Group exports by category (Base UI / Overlays / Product / Layout).
- Keep the list alphabetical within each group.

---

## Step 6 — Add to StyleGuide.tsx

Every component must have a live example in the StyleGuide at
`src/pages/StyleGuide.tsx`. This is the visual regression baseline and
the interactive docs for the team.

1. Import the component at the top of StyleGuide.tsx.
2. Find the appropriate section (or add a new one with an `id=`).
3. Add a sub-section with a label and representative examples.

Minimum example:

```tsx
{/* SprintBadge */}
<div>
  <p className="text-[11px] font-semibold uppercase tracking-widest mb-4"
    style={{ color: 'hsl(var(--muted-foreground))' }}>
    SprintBadge — all status values
  </p>
  <Stack direction="horizontal" gap="sm" wrap>
    <SprintBadge status="active" />
    <SprintBadge status="planned" />
    <SprintBadge status="completed" />
  </Stack>
</div>
```

Test it in both light **and** dark mode using the toggle in the StyleGuide header.

---

## Checklist

Before opening a PR with a new component:

- [ ] File is in the correct folder with `kebab-case` name
- [ ] Component export is `PascalCase`
- [ ] Props interface is exported
- [ ] `cva` used for variants (or skipped with a comment explaining why not)
- [ ] `cn()` used for class merging — `className` prop always last
- [ ] No hardcoded colors (`bg-white`, `text-gray-500`, `#hex`, etc.)
- [ ] Exported from `src/components/layout/index.ts` (layout only)
- [ ] Exported from `src/design-system/index.ts`
- [ ] StyleGuide example added
- [ ] StyleGuide example tested in dark mode
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes (run from `client/`)

---

## Quick cheat-sheet

```
New UI primitive       → src/components/ui/<name>.tsx
New product component  → src/components/ui/<feature>-<name>.tsx
New layout wrapper     → src/components/layout/<Name>.tsx
                          + add to layout/index.ts

All three              → add to design-system/index.ts
All three              → add example to StyleGuide.tsx
```
