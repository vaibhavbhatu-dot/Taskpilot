# TaskPilot — Developer Patterns

Reference guide for building new pages and features in this codebase.
Keep it open in a side pane while you work.

---

## 1. Component import

**Always import from the design-system barrel. Never reach into `src/components/ui` directly.**

```ts
// ✅ correct — one import, everything you need
import { Button, Card, Badge, useToast, cn } from '@/design-system';

// ❌ wrong — bypasses the barrel, breaks tree-shaking and refactoring
import { Button } from '@/components/ui/button';
import { Card }   from '@/components/ui/card';
```

The barrel at `src/design-system/index.ts` re-exports every component,
hook, util, token, and type in the system. It is the single stable
public API surface. If something isn't exported there, add it — don't
import around it.

**What's available:**

| Category | Examples |
|---|---|
| Base UI | `Button` `Input` `Textarea` `Label` `FormField` `Card` `Badge` `Alert` `Spinner` `Skeleton` |
| Overlays | `Modal` `ConfirmModal` `Drawer` |
| Product | `EmptyState` `ScoreBar` `JobMatchBadge` `ResumeCard` `UploadZone` `AISuggestionChip` `StatCard` |
| Layout | `Container` `Stack` `Grid` `Divider` `PageHeader` |
| Hooks | `useToast` `useModal` |
| Utils | `cn` `formatDate` `formatScore` `truncate` `capitalize` `getInitials` |
| Tokens | `TYPOGRAPHY` `SPACING` `RADIUS` `SHADOWS` |
| Types | `Size` `Variant` `Status` `ColorScheme` `BaseComponentProps` |

---

## 2. Building a form

**Stack:** `react-hook-form` + `zod` + `FormField` + `Input` + `Button`.

### Step 1 — define the schema

```ts
import { z } from 'zod';

const editProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email address'),
  bio:      z.string().max(160, 'Bio must be 160 characters or less').optional(),
});

type EditProfileValues = z.infer<typeof editProfileSchema>;
```

### Step 2 — set up the form

```ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<EditProfileValues>({
  resolver: zodResolver(editProfileSchema),
  defaultValues: { fullName: user.fullName, email: user.email, bio: user.bio ?? '' },
});
```

### Step 3 — wire up the UI

```tsx
import { FormField, Input, Textarea, Button, useToast } from '@/design-system';

function EditProfileForm({ user, onSuccess }: { user: User; onSuccess: () => void }) {
  const toast = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<EditProfileValues>({ resolver: zodResolver(editProfileSchema),
      defaultValues: { fullName: user.fullName, email: user.email, bio: user.bio ?? '' } });

  async function onSubmit(values: EditProfileValues) {
    try {
      await profileApi.update(values);
      toast.success('Profile updated', 'Your changes have been saved.');
      onSuccess();
    } catch {
      toast.error('Update failed', 'Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <FormField
        label="Full name"
        required
        error={errors.fullName?.message}
      >
        <Input
          {...register('fullName')}
          variant={errors.fullName ? 'error' : 'default'}
          placeholder="Jane Doe"
        />
      </FormField>

      <FormField
        label="Email"
        required
        error={errors.email?.message}
      >
        <Input
          {...register('email')}
          type="email"
          variant={errors.email ? 'error' : 'default'}
          placeholder="jane@company.com"
        />
      </FormField>

      <FormField
        label="Bio"
        hint="Max 160 characters."
        error={errors.bio?.message}
      >
        <Textarea {...register('bio')} rows={3} placeholder="Tell us about yourself…" />
      </FormField>

      <Button type="submit" loading={isSubmitting}>
        Save changes
      </Button>
    </form>
  );
}
```

**Key rules:**
- Always wrap `Input`/`Textarea` in `FormField` — never render labels or error text manually.
- Set `variant="error"` on `Input` when the field has an error so the red ring appears.
- Wire `loading={isSubmitting}` to `Button` — never disable it manually during submit.
- Call `toast.error(...)` in the catch block — API failures must never be silent.

---

## 3. Async data pattern

Every page that fetches data follows the same four-state sequence:

```
loading → SkeletonCard  (never show blank space)
error   → Alert error   (never swallow errors silently)
empty   → EmptyState    (always explain the empty state)
success → render data
```

### Complete example

```tsx
import { useState, useEffect } from 'react';
import {
  SkeletonCard, Alert, AlertTitle, AlertDescription,
  EmptyState, Card, Button,
} from '@/design-system';
import { Inbox } from 'lucide-react';
import type { Ticket } from '@/types';

export function TicketList() {
  const [tickets,  setTickets]  = useState<Ticket[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    ticketsApi.list()
      .then(data  => { if (!cancelled) setTickets(data); })
      .catch(err  => { if (!cancelled) setError(err.message ?? 'Failed to load tickets.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Alert variant="error">
        <AlertTitle>Failed to load tickets</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="w-12 h-12" />}
        title="No tickets yet"
        description="Create your first ticket to get started tracking work."
        action={{ label: 'Create ticket', onClick: () => {} }}
      />
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tickets.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
```

**Key rules:**
- Always cancel async effects with a `cancelled` flag to avoid state updates on unmounted components.
- Never show a blank white area — show `SkeletonCard` while loading.
- `EmptyState` must always have a `description` that explains *why* it's empty and what to do.
- The error `Alert` must be visible — don't hide it inside a collapsed section.

---

## 4. Toast notifications

Toasts are fired with the `useToast()` hook. Call `useToast()` once at
the top of the component, then call the variant method you need.

```ts
import { useToast } from '@/design-system';

const toast = useToast();
```

| Variant | When to use | Example |
|---|---|---|
| `toast.success()` | Mutation completed successfully | After saving a form, creating a ticket, deleting an item |
| `toast.error()` | An API call or action failed | In every `catch` block — **never silent** |
| `toast.warning()` | Action succeeded but with caveats | "Saved, but 2 items were skipped" |
| `toast.info()` | Neutral informational message | "Your session will expire in 5 minutes" |
| `toast.loading()` | Long-running background task | File upload, bulk action |
| `toast.dismiss()` | Programmatically clear all toasts | After navigation |

### Signature

```ts
toast.success(message: string, description?: string)
toast.error(message: string, description?: string)
toast.warning(message: string, description?: string)
toast.info(message: string, description?: string)
toast.loading(message: string)
toast.dismiss()
```

### Example — complete CRUD pattern

```tsx
async function handleDelete(id: string) {
  try {
    await ticketsApi.delete(id);
    toast.success('Ticket deleted', 'The ticket has been permanently removed.');
    refetch();
  } catch (err) {
    toast.error('Delete failed', 'Could not delete the ticket. Please try again.');
  }
}

async function handleSave(values: FormValues) {
  const loadingId = toast.loading('Saving changes…');
  try {
    await profileApi.update(values);
    toast.dismiss();
    toast.success('Profile updated');
  } catch {
    toast.dismiss();
    toast.error('Save failed', 'Check your connection and try again.');
  }
}
```

---

## 5. Modal / confirmation pattern

### Which overlay to use

| Scenario | Use |
|---|---|
| Destructive action (delete, archive, deactivate) | `ConfirmModal` |
| Create / edit form | `Modal` |
| Detail view, settings panel, filters | `Drawer` |
| Multi-step wizard | `Modal` with internal step state |

### `useModal` hook

```ts
import { useModal } from '@/design-system';

const deleteModal  = useModal();   // default closed
const editModal    = useModal();
const filterDrawer = useModal();
```

`useModal()` returns:
- `isOpen` — boolean state
- `open()` — opens the overlay
- `close()` — closes the overlay
- `toggle()` — flips state
- `props` — `{ open: boolean, onOpenChange: (open: boolean) => void }` — spread directly onto the overlay component

### ConfirmModal — destructive action

```tsx
import { ConfirmModal, Button, useModal } from '@/design-system';

function TicketActions({ id }: { id: string }) {
  const deleteModal = useModal();

  async function handleConfirmDelete() {
    await ticketsApi.delete(id);
    toast.success('Ticket deleted');
    deleteModal.close();
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={deleteModal.open}>
        Delete
      </Button>

      <ConfirmModal
        {...deleteModal.props}
        title="Delete this ticket?"
        description="This action cannot be undone. All comments will also be removed."
        confirmLabel="Delete ticket"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
```

### Modal — create / edit form

```tsx
import { Modal, Button, useModal } from '@/design-system';

function CreateTicketButton() {
  const modal = useModal();

  return (
    <>
      <Button onClick={modal.open}>New ticket</Button>

      <Modal
        {...modal.props}
        title="Create ticket"
        description="Add a new ticket to the backlog."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={modal.close}>Cancel</Button>
            <Button size="sm" form="create-ticket-form" type="submit">Create</Button>
          </>
        }
      >
        <CreateTicketForm id="create-ticket-form" onSuccess={modal.close} />
      </Modal>
    </>
  );
}
```

### Drawer — filters / settings panel

```tsx
import { Drawer, Button, useModal } from '@/design-system';

function FilterButton() {
  const drawer = useModal();

  return (
    <>
      <Button variant="outline" onClick={drawer.open}>Filters</Button>

      <Drawer {...drawer.props} title="Filter tickets" side="right" size="md">
        <FilterPanel onApply={drawer.close} />
      </Drawer>
    </>
  );
}
```

---

## 6. Component naming conventions

### File names

| Type | Convention | Example |
|---|---|---|
| Base UI primitives | `kebab-case.tsx` | `button.tsx` `form-field.tsx` |
| Product components | `feature-name.tsx` | `resume-card.tsx` `job-match-badge.tsx` |
| Layout components | `PascalCase.tsx` or `kebab-case.tsx` | `PageHeader.tsx` `Container.tsx` |

### Export names

Always `PascalCase` for components, `camelCase` for hooks and utilities.

```ts
// ✅
export function ResumeCard(...)  // component
export function useModal(...)    // hook
export function formatDate(...)  // util

// ❌
export function resumeCard(...)  // wrong case for component
export function UseModal(...)    // wrong case for hook
```

### Where new code lives

| What you're adding | Folder |
|---|---|
| Generic, reusable UI primitive | `src/components/ui/` |
| Feature-specific product component | `src/components/ui/` — prefix with the feature name (e.g. `resume-`, `sprint-`) |
| Layout / structural wrapper | `src/components/layout/` |
| Page-level component | `src/pages/` |
| Reusable hook | `src/design-system/hooks/` |
| Formatter or utility | `src/design-system/utils/` |

---

## 7. Dark mode rules

The app supports dark mode via the `dark` class on `<html>`. **Every
component must work correctly in both themes.** The rule is simple:
never use a hardcoded color — always use a CSS variable token.

### Text

```tsx
// ✅
className="text-foreground"           // primary text
className="text-muted-foreground"     // secondary / label text

// ❌
className="text-gray-900"
className="text-[#0F172A]"
style={{ color: '#64748B' }}
```

### Backgrounds

```tsx
// ✅
className="bg-background"   // page background
className="bg-card"         // card / panel surface
className="bg-muted"        // subtle tinted background
className="bg-accent"       // hover state on interactive elements

// ❌
className="bg-white"
className="bg-gray-50"
className="bg-[#F8FAFC]"
```

### Borders

```tsx
// ✅
className="border-border"

// ❌
className="border-gray-200"
className="border-[#E2E8F0]"
```

### Semantic / status colors

These require inline styles because the Tailwind config defines them
with `hsl()` wrappers that don't support the opacity modifier:

```tsx
// ✅ — inline style for semantic colors with opacity
style={{ backgroundColor: 'hsl(var(--color-info) / 0.1)' }}
style={{ borderColor:     'hsl(var(--color-info) / 0.3)' }}

// ✅ — solid semantic color via className (no opacity needed)
className="text-[hsl(var(--color-success))]"

// ✅ — use the Tailwind aliases for solid fills
className="bg-success text-success-foreground"
className="bg-destructive text-destructive-foreground"
```

### Quick reference

| Token | Light value | Dark value |
|---|---|---|
| `--background` | `hsl(0 0% 100%)` | `hsl(0 0% 3.9%)` |
| `--foreground` | `hsl(0 0% 3.9%)` | `hsl(0 0% 98%)` |
| `--card` | `hsl(0 0% 100%)` | `hsl(0 0% 3.9%)` |
| `--muted` | `hsl(0 0% 96.1%)` | `hsl(0 0% 14.9%)` |
| `--muted-foreground` | `hsl(0 0% 45.1%)` | `hsl(0 0% 63.9%)` |
| `--border` | `hsl(0 0% 89.8%)` | `hsl(0 0% 14.9%)` |
| `--color-success` | `142 71% 45%` | same |
| `--color-warning` | `38 92% 50%` | same |
| `--color-error` | alias of `--destructive` | same |
| `--color-info` | `217 91% 60%` | same |

---

*Last updated: Phase 4 finalization. See `CONTRIBUTING.md` for how to extend the system.*
