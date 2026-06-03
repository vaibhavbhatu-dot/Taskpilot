# Design System

- **tokens/** — Single source of truth for all CSS custom properties and their Tailwind mappings; edit here to change any color, radius, or shadow across the entire app.
- **foundations/** — Immutable design constants (typography scale, spacing steps, color palette) exported as typed TS objects; imported by components and tokens alike, never by app pages directly.
- **components/** — Split into four concern-scoped buckets: `ui/` for stateless base primitives (Button, Badge, Card), `layout/` for structural wrappers (Container, Grid, Stack), `feedback/` for user-response patterns (Toast, Modal, Skeleton, Alert), and `forms/` for controlled input surfaces.
- **hooks/** — Headless UI logic (`useToast`, `useModal`, `useMediaQuery`) that components consume; keeps behavior testable and reusable without coupling it to any specific component tree.
- **utils/** — Pure helper functions (`cn()` for class merging, formatters, type guards) with zero React dependencies so they can be used anywhere in the codebase including server utilities.
