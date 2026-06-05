# TaskPilot — Project Reference

## 1. Project Overview

**TaskPilot** is an internal project management and task-tracking tool built for software development teams. It covers the full ticket lifecycle — from backlog grooming through sprint planning, active development, QA, and deployment.

| Attribute | Detail |
|---|---|
| **Type** | Web app (SPA) |
| **Target users** | Development teams — Admins, Managers, Members |
| **Status** | In development |
| **Dev URL** | http://localhost:5173 |
| **API URL** | http://localhost:5000 (proxied via Vite at `/api`) |

---

## 2. Tech Stack

### Frontend

| Library | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 8.0 | Dev server and bundler |
| Tailwind CSS | 3.4 | Styling |
| shadcn/ui + Radix | — | Accessible component primitives |
| React Router | 7.13 | Client-side routing (BrowserRouter) |
| Zustand | 5.0 | Global state management |
| TanStack Query | 5.9 | Server-state caching (some pages) |
| @hello-pangea/dnd | 18.0 | Drag-and-drop (Board, Sprint Planning) |
| react-hook-form + zod | 7.x / 4.x | Forms and schema validation |
| Sonner | 2.0 | Toast notifications |
| Recharts | 3.8 | Charts (Sprint Reports, Dashboard) |
| lucide-react | 0.577 | Icons |
| axios | 1.13 | HTTP client |

### Backend (API)

The frontend proxies all `/api` requests to `http://localhost:5000` via Vite's dev server proxy. The API client lives at `src/api/index.ts` using a shared axios instance. No direct backend code lives in this repo.

---

## 3. Project Structure

```
client/
├── public/
├── src/
│   ├── api/              # Axios client + all endpoint functions (ticketsApi, sprintsApi, etc.)
│   ├── assets/           # Static files (images, fonts)
│   ├── components/
│   │   ├── dashboard/    # Role-specific dashboard panels (Admin, Manager, Member)
│   │   ├── layout/       # Sidebar, TopBar, CommandPalette, Container, Stack, Grid, Divider, PageHeader
│   │   ├── tickets/      # FilterBuilder, CreateTicketPanel
│   │   └── ui/           # Shadcn-generated primitives (Badge, Button, Card, Dialog, etc.)
│   ├── constants/        # ticketStatus.ts — STATUS_CONFIG, TICKET_STATUSES, getStatusLabel()
│   ├── design-system/    # Token system, component docs, patterns, hooks, utils (see §4)
│   ├── hooks/            # Custom React hooks (useMyWork.ts)
│   ├── lib/              # cn() class-merge utility (from shadcn)
│   ├── pages/            # Route-level page components (see §6)
│   │   ├── MyWork/       # MyWork sub-components (tabs, filters, skeleton, rows)
│   │   └── admin/        # ActivityLog
│   ├── stores/           # Zustand global state (see §9)
│   ├── types/            # Shared TypeScript types (Ticket, Sprint, User, etc.)
│   └── utils/            # export.ts (CSV/PDF export), other helpers
├── scripts/              # Playwright screenshot scripts for visual QA
├── package.json
├── tailwind.config.js
├── tsconfig.app.json
└── vite.config.ts
```

---

## 4. Design System

| Attribute | Value |
|---|---|
| **Location** | `src/design-system/` |
| **Style guide** | http://localhost:5173/style-guide |
| **Master import** | `import { Button, Badge, ... } from '@/design-system'` |
| **Patterns doc** | `src/design-system/PATTERNS.md` |
| **Contributing guide** | `src/design-system/CONTRIBUTING.md` |
| **Dark mode** | Supported via `class="dark"` on `<html>` |

### Components (27 total)

**Base UI (10)**
`Button` `Input` `Textarea` `Label` `FormField` `Card` `Badge` `Alert` `Spinner` `Skeleton`

**Feedback & Overlays (6)**
`Toast` `Modal` `ConfirmModal` `Drawer` `EmptyState` `AISuggestionChip`

**Layout (5)**
`Container` `Stack` `Grid` `Divider` `PageHeader`

**Product (6)**
`StatCard` `ScoreBar` `JobMatchBadge` `ResumeCard` `UploadZone` `DropdownMenu`

### Key utilities exported from `@/design-system`

```ts
import { cn, getInitials, formatDate } from '@/design-system';
```

### Color tokens (always use these, never raw hex)

| Token | Use for |
|---|---|
| `bg-background` | Page background |
| `bg-card` | Card and panel surfaces |
| `bg-muted` / `bg-muted/50` | Subtle backgrounds, table stripes |
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary / placeholder text |
| `border-border` | All borders |
| `text-primary` / `bg-primary` | Brand blue (actions, links) |
| `hsl(var(--color-success))` | Green — completed, live |
| `hsl(var(--color-warning))` | Amber — in-progress, warnings |
| `hsl(var(--color-info))` | Blue — info states |
| `text-destructive` / `bg-destructive` | Red — errors, delete |

---

## 5. User Roles

| Role | Sidebar access | Admin sections |
|---|---|---|
| `ADMIN` | All sections | Members, Settings, Activity Log |
| `MANAGER` | All except admin sections | — |
| `PROJECT_MANAGER` | All except admin sections | — |
| `MEMBER` | Dashboard, Work Update, My Tickets, Kanban Board, Sprints | — |

Role checks use `useAuthStore()` on the client and `rbac.middleware` on the server.

---

## 6. Pages & Routes

| Route | Component | File | Auth |
|---|---|---|---|
| `/` | Dashboard | `pages/Dashboard.tsx` | Protected |
| `/my-work` | Work Update | `pages/MyWork/index.tsx` | Protected |
| `/tickets` | All Tickets | `pages/Tickets.tsx` | Protected |
| `/tickets/:id` | Ticket Detail | `pages/TicketDetail.tsx` | Protected |
| `/backlog` | Backlog | `pages/Backlog.tsx` | Protected |
| `/board` | Kanban Board | `pages/Board.tsx` | Protected |
| `/sprints/planning` | Sprint Planning | `pages/SprintPlanning.tsx` | Protected |
| `/sprints/active` | Active Sprint | `pages/ActiveSprint.tsx` | Protected |
| `/sprints/reports` | Sprint Reports | `pages/SprintReports.tsx` | Protected |
| `/teams` | Teams List | `pages/Teams.tsx` | Protected |
| `/teams/:id` | Team Detail | `pages/Teams.tsx` | Protected |
| `/projects` | Projects | `pages/Projects.tsx` | Protected |
| `/profile` | My Profile | `pages/Profile.tsx` | Protected |
| `/user/:id` | User Profile | `pages/Profile.tsx` | Protected |
| `/notifications` | Notifications | `pages/Notifications.tsx` | Protected |
| `/support/my-tickets` | Support (split pane) | `pages/support/MyTickets.tsx` | Protected |
| `/members` | Members | `pages/Members.tsx` | Admin only |
| `/settings` | Admin Settings | `pages/AdminSettings.tsx` | Admin only |
| `/activity` | Activity Log | `pages/admin/ActivityLog.tsx` | Admin only |
| `/login` | Login | `pages/Login.tsx` | Public |
| `/signup` | Signup | `pages/Signup.tsx` | Public |
| `/verify-email` | Email OTP verify | `pages/VerifyEmail.tsx` | Public |
| `/invite` | Profile Setup | `pages/ProfileSetup.tsx` | Public |
| `/invite/:token` | Profile Setup | `pages/ProfileSetup.tsx` | Public |
| `/onboarding/profile` | Onboarding step 3 | `pages/onboarding/Profile.tsx` | Auth, no layout |
| `/onboarding/workspace` | Onboarding step 4 | `pages/onboarding/Workspace.tsx` | Auth, no layout |
| `/style-guide` | Style Guide | `style-guide/` | Public (dev) |
| `*` | 404 | `pages/NotFound.tsx` | — |

---

## 7. Key Conventions

### Imports
```ts
// ✅ Always import from the barrel
import { Button, Badge, getInitials } from '@/design-system';

// ❌ Never import directly from shadcn path
import { Button } from '@/components/ui/button';
```

### Styling
```tsx
// ✅ Semantic tokens — work in light and dark mode
<div className="bg-card border border-border text-foreground">

// ❌ Hardcoded hex — breaks dark mode
<div className="bg-white border border-[#E2E8F0] text-[#0F172A]">
```

### Loading states
```tsx
// ✅ Use design system components
<Skeleton className="h-4 w-40" />
<Spinner size="md" />

// ❌ Don't build custom spinners inline
<div className="w-8 h-8 border-2 border-t-blue-600 rounded-full animate-spin" />
```

### Error states
```tsx
// ✅
<Alert variant="error">Something went wrong</Alert>

// ❌
<div className="bg-red-50 text-red-600">...</div>
```

### Confirmation dialogs
```tsx
// ✅
<ConfirmModal
  open={confirmOpen}
  title="Delete project"
  description="This cannot be undone."
  onConfirm={handleDelete}
  onCancel={() => setConfirmOpen(false)}
/>
```

### Forms
```tsx
// ✅ Always use react-hook-form + zod + FormField
const schema = z.object({ name: z.string().min(1) });
const { register, handleSubmit } = useForm({ resolver: zodResolver(schema) });

<FormField label="Name" required>
  <Input {...register('name')} />
</FormField>
```

### Drag and drop (Board, Sprint Planning)
The `@hello-pangea/dnd` integration in `Board.tsx` and `SprintPlanning.tsx` is intentionally untouched. **Never modify `DragDropContext`, `Droppable`, `Draggable`, or `onDragEnd` logic** without a full regression test — these are fragile.

---

## 8. Local Development

```bash
# Install dependencies (run from client/)
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Production build
npm run build

# Type-check only (no emit)
npx tsc --noEmit

# Lint
npm run lint
```

> **Backend required:** The frontend proxies `/api/*` to `http://localhost:5000`. Start the backend before running the dev server or all API calls will fail.

### Visual QA screenshots

```bash
# Full app walkthrough — Login → Dashboard → Tickets → Board → Members
node scripts/live-screenshot.mjs

# Board page + Create Ticket panel
node scripts/board-direct.mjs

# Dark mode test — Dashboard, Tickets, Board
node scripts/darkmode-test.mjs
```

All scripts require Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe` and the dev server running.

---

## 9. State Management

| Store | Hook | Contents |
|---|---|---|
| Auth | `useAuthStore()` | `user`, `accessToken`, `isAuthenticated`, `isLoading`, `setAuth()`, `clearAuth()` |
| UI | `useUIStore()` | `sidebarOpen`, `commandPaletteOpen`, toggle/set methods |
| Toasts | `useToastStore()` | `toasts[]`, `toast()`, `removeToast()` |

**Auth flow:**
1. `accessToken` is persisted to `localStorage` on login.
2. On every page load, `AppInitializer` reads the token and calls `GET /api/auth/me`.
3. If the call succeeds, the user object is hydrated into `useAuthStore`.
4. If it fails (expired/invalid token), `clearAuth()` is called and the user is redirected to `/login`.

**Server state:** Most pages use local `useState` + direct `ticketsApi.list()` calls inside `useEffect`. TanStack Query (`useQuery`) is available and used in the MyWork page hooks — prefer it for any new pages that fetch data.

---

## 10. Environment & Config

| File | Purpose |
|---|---|
| `vite.config.ts` | Dev server (port 5173), `@/` alias, `/api` proxy to `:5000` |
| `tsconfig.app.json` | TypeScript config — `@/*` → `./src/*`, strict mode, ES2023 target |
| `tailwind.config.js` | Design tokens, font families, spacing scale, semantic color extensions |
| `src/index.css` | CSS custom properties (light + dark theme variables), Tailwind base layers |
| `components.json` | shadcn/ui config — icon library, path aliases |

### Ticket status pipeline

```
BACKLOG → REQUIREMENTS → DESIGN → HTML → ON_DEVELOPMENT
       → QA → BUGS → ENHANCEMENT → UAT → LIVE → NOT_REQUIRED
```

Status metadata (label, badge bg/text colors) is the single source of truth in `src/constants/ticketStatus.ts`. Always use `STATUS_CONFIG[status]` and `getStatusLabel(status)` — never hardcode status strings in component logic.

---

## 11. Developer Onboarding

```bash
# 1. Clone and install
git clone <repo-url>
cd TaskPilot/client
npm install

# 2. Start the backend on port 5000 (see backend README)

# 3. Start the frontend dev server
npm run dev

# 4. Open the style guide to explore the design system
open http://localhost:5173/style-guide
```

**Reading order before writing code:**

1. `src/design-system/PATTERNS.md` — component usage patterns and do/don't examples
2. `src/design-system/CONTRIBUTING.md` — how to add or extend design system components
3. `CLAUDE.md` (repo root) — AI coding assistant instructions and architecture notes
4. This file (`PROJECT.md`) — you're already here

**First PR checklist:**
- [ ] No hardcoded hex colors — use Tailwind token classes
- [ ] Loading states use `Spinner` or `Skeleton` from `@/design-system`
- [ ] Forms use `react-hook-form` + `zod` + `FormField`
- [ ] Dark mode tested (toggle via browser devtools or `/style-guide`)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` passes

---

## Current Status

**Last updated:** June 2026

Active development. Core product is feature-complete for internal use. Support system shipped. Next milestone is the Master Admin Panel (separate app) and production deployment.

---

## Completed Features

- **Design system** — 27 components, style guide at `/style-guide`
- **Phase 1–6** — Setup → Tokens → Components → Product components → Docs → Integration
- **Signup + email verification** — OTP flow, Resend in prod / console log in dev
- **Onboarding flow** — 4 steps: signup → verify email → profile → workspace
- **Product tour + onboarding checklist** — guided first-run experience
- **Multi-tenancy** — Organization model, `organizationId` on all models, full data isolation at query level
- **Ticket workflow** — 11 statuses (BACKLOG → LIVE), Kanban board with drag-and-drop, sprint planning, active sprint, reports
- **Support ticket system**
  - Gmail-style split pane at `/support/my-tickets` (list + thread, no separate detail page)
  - Submit tickets from the `?` help button in TopBar (slide-in panel)
  - Support button in TopBar → navigates directly to `/support/my-tickets`
  - 5 automated emails (dev: console log, prod: Resend API)
    1. `sendTicketConfirmation` — on ticket create → user
    2. `sendAdminNewTicketAlert` — on ticket create → support inbox
    3. `sendAdminReplyNotification` — on admin reply → user
    4. `sendTicketResolvedEmail` — on status → RESOLVED → user (with reopen link)
    5. `sendAutoCloseWarning` — 2-day warning before auto-close
  - CRON job (`node-cron`) — warns at day 5, auto-closes resolved tickets at day 7
  - Admin routes (`/api/admin/support/*`) reserved for Master Admin Panel only

---

## Pending / Next Steps

1. **Master Admin Panel** (separate app, separate port, separate codebase)
   - `SUPER_ADMIN` role
   - See all organisations and users
   - Manage all support tickets across all orgs
   - Platform-wide stats and analytics

2. **Production deployment**
   - Frontend: Vercel
   - Backend: Railway
   - Database: Supabase (PostgreSQL)
   - File storage: Cloudflare R2
   - Email: Resend (`RESEND_API_KEY` required)
   - Domain + SSL

3. ⚠️ **Automated database backups** — daily to Cloudflare R2, email alert on failure

---

## Architecture Notes

| Layer | Detail |
|---|---|
| Frontend | Vite + React 18 + TypeScript |
| Backend | Node.js + Express + Prisma ORM |
| Database | PostgreSQL — 12 tables |
| Auth | JWT access token (15 min) + refresh token (httpOnly cookie, 7 days) |
| Multi-tenancy | `organizationId` on every model, filtered on every query |
| Design system import | `import { Button, Card } from '@/design-system'` |
| Support emails | `NODE_ENV !== 'production'` → console log; production → Resend API |
| CRON | `node-cron` started in `server.ts` on boot — daily 09:00 |

New user flow: `/signup` → `/verify-email` → `/onboarding/profile` → `/onboarding/workspace` → `/dashboard`

---

## Key Routes

```
New user flow:
/signup → /verify-email → /onboarding/profile → /onboarding/workspace → /dashboard

Support:
/support/my-tickets        Gmail-style split pane (list + thread)
/api/admin/support/*       Reserved — Master Admin Panel only

Dev:
/style-guide               Component library browser
```

---

## Environment Variables Needed for Production

```
# Client
VITE_API_URL

# Database
DATABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY

# Auth
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET

# Email (Resend)
RESEND_API_KEY
EMAIL_FROM
SUPPORT_EMAIL
ADMIN_EMAIL

# URLs
APP_URL

# File storage (Cloudflare R2)
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME

# AI triage (Anthropic)
ANTHROPIC_API_KEY=

# Runtime
NODE_ENV=production
```

---

## AI Triage Feature (Planned)

**Status:** Ready to build — using mock responses for localhost, real Anthropic API in production.

### How it works

1. User submits a support ticket
2. AI analyses the ticket content and classifies it: `minor` / `major` / `critical`
3. **Minor** → auto-reply drafted and sent to the user
4. **Critical** → diagnosis summary sent to Master Admin inbox
5. AI is read + suggest only — it cannot write to the database or change code

### Implementation plan

| Mode | Behaviour |
|---|---|
| `NODE_ENV !== 'production'` (mock) | Returns hardcoded fake classification and reply — no API call, no cost |
| Production | Calls Anthropic API with `ANTHROPIC_API_KEY` using Claude Sonnet 4.6 |

- Belongs in the **Master Admin Panel** work (same phase)
- Estimated cost when live: ~$0.006 per ticket (Claude Sonnet 4.6 pricing)
