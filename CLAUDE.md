Q# CLAUDE.md
Q# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Client (run from `client/`)
```bash
npm run dev        # Vite dev server on :5173 (proxies /api → :5000)
npm run build      # tsc -b && vite build
npm run lint       # ESLint
npx tsc --noEmit   # Type-check without emitting
```

### Server (run from `server/`)
```bash
npm run dev              # tsx watch — hot-reload Express server on :5000
npm run build            # tsc → dist/
npm run start            # node dist/server.js (production)
npm run seed             # Seed the database via prisma/seed.ts
npm run prisma:generate  # Regenerate Prisma client after schema changes
npm run prisma:migrate   # Apply pending migrations (dev)
npm run prisma:studio    # Open Prisma Studio GUI
```

### Screenshots (run from `client/`)
```bash
node scripts/live-screenshot.mjs      # Full app walkthrough (login → all pages)
node scripts/tickets-screenshot.mjs   # Tickets page + Create panel
node scripts/board-direct.mjs         # Board page + Create panel
```
Screenshots require Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe` and both dev servers running.

## Architecture

TaskPilot is a monorepo with a React SPA (`client/`) and Express API (`server/`). No shared package between them — types are duplicated where needed.

### Server

- **Entry**: `src/server.ts` → `src/app.ts` (Express setup)
- **Routes** live in `src/routes/`, one file per resource. All routes are mounted under `/api/` in `app.ts`.
- **Middleware**: `auth.middleware.ts` (JWT verification), `rbac.middleware.ts` (role checks), `error.middleware.ts` (global handler)
- **Database**: Prisma + PostgreSQL. Client singleton at `src/utils/prisma.ts`. Schema at `prisma/schema.prisma`.
- **Auth**: JWT dual-token (short-lived access token + 7-day refresh token). Tokens via `src/utils/jwt.ts`.
- **File uploads**: Multer; files stored on disk, served statically from `/uploads`.
- **Config**: Copy `server/.env.example` to `server/.env` and fill in `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.

### Client

- **Entry**: `src/main.tsx` → `src/App.tsx`
- **Routing**: React Router v7. Routes defined in `App.tsx`. Protected by `ProtectedRoute` (checks `useAuthStore`) and `AdminRoute` (checks `user.role`).
- **Auth state**: Zustand store in `src/stores/index.ts`. `accessToken` is persisted to `localStorage`; on app load, `AppInitializer` calls `authApi.getMe()` to rehydrate the user object. If `getMe` fails the token is cleared.
- **API layer**: `src/api/index.ts` — one object per resource (`ticketsApi`, `sprintsApi`, etc.), all using a shared Axios instance that reads the token from `useAuthStore` on each request.
- **State**: Zustand for auth + UI (`sidebarOpen`, `commandPaletteOpen`). TanStack Query is installed but most pages use local `useState` + direct API calls inside `useEffect`.
- **Path alias**: `@/` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

### Design System

All shared UI lives in `src/design-system/` and is barrel-exported from `src/design-system/index.ts`. Always import from `@/design-system`, never from shadcn paths directly.

Key exports used across pages:
- `Button` — variants: `default | outline | ghost | secondary | destructive | success | link`; sizes: `sm | md | lg | icon`; supports `leftIcon`, `rightIcon`, `loading`
- `Badge` — variants: `default | info | warning | success | secondary | outline | error`; size `sm` for inline ticket/priority chips
- `Input`, `Textarea`, `Label`, `FormField` — form primitives
- `Modal`, `ConfirmModal`, `Drawer` — overlay patterns
- `getInitials(name)` — formats a full name to 2-letter initials
- `cn(...)` — Tailwind class merge utility (re-exported from `src/lib/utils.ts`)

### Ticket Workflow

`TicketStatus` has 11 states defined in `src/constants/ticketStatus.ts` and mirrored in `prisma/schema.prisma`:
`BACKLOG → REQUIREMENTS → DESIGN → HTML → ON_DEVELOPMENT → QA → BUGS → ENHANCEMENT → UAT → LIVE → NOT_REQUIRED`

`STATUS_CONFIG` in `src/constants/ticketStatus.ts` maps each status to its display label, background color, and text color. Always use this rather than hardcoding status strings.

### Role Hierarchy

`ADMIN > MANAGER > PROJECT_MANAGER > MEMBER`. Admin-only routes (Members, Settings, Activity Log) are guarded by `AdminRoute` on the client and `rbac.middleware` on the server.

### Kanban Board

`src/pages/Board.tsx` uses `@hello-pangea/dnd` for drag-and-drop. **Never modify `DragDropContext`, `Droppable`, `Draggable`, or `onDragEnd`** — these are fragile. The swimlane feature encodes lane IDs into `droppableId` as `col-{STATUS}-{laneId}`; `onDragEnd` strips the lane suffix to extract the target status.

### Styling Conventions

- Tailwind with CSS variable tokens. Use semantic tokens (`bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`) rather than hardcoded hex values or Tailwind palette classes.
- Color tokens for status/priority: `hsl(var(--color-success))`, `hsl(var(--color-warning))`, `hsl(var(--color-info))`, `hsl(var(--destructive))`.
- Dark mode support is built into the token system — never hardcode light-only colors.
