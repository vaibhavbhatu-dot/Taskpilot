# Product Requirements Document (PRD)

## TaskPilot — Internal Project Management Tool

| Field             | Details                          |
|-------------------|----------------------------------|
| **Document Version** | 1.0                           |
| **Date**             | 2026-03-17                    |
| **Product Name**     | TaskPilot                     |
| **Tech Stack**       | React + TypeScript, Express.js, PostgreSQL, Prisma |
| **Status**           | MVP Complete                  |

---

## 1. Product Overview

TaskPilot is a full-stack agile project management tool that enables engineering teams to plan sprints, track tickets on a Kanban board, collaborate via threaded comments, and monitor performance through burndown charts and velocity analytics. It is built for internal use with strict role-based access control across four user roles.

---

## 2. User Personas

### Persona 1: Admin (CTO / VP Engineering)
- **Goal:** Full platform oversight — manage users, teams, projects, and monitor organization-wide activity.
- **Key Actions:** Invite users, assign roles (max 2 admins), view global activity log, manage all resources.
- **Data Scope:** Unrestricted — sees all tickets, projects, teams, and users.

### Persona 2: Manager (Team Lead)
- **Goal:** Lead a team through sprints — assign work, track progress, balance workload.
- **Key Actions:** Manage sprints, triage tickets, view team burndown/velocity, reassign work.
- **Data Scope:** Team-scoped — sees only their team's tickets, members, and projects.

### Persona 3: Project Manager
- **Goal:** Own one or more projects end-to-end — plan sprints, track delivery, report on progress.
- **Key Actions:** Create projects, plan sprints, create/assign tickets, view project analytics.
- **Data Scope:** Project-scoped — sees only their projects and associated tickets/sprints.

### Persona 4: Member (Developer / QA / Designer)
- **Goal:** Execute assigned work efficiently — update ticket status, add comments, track personal workload.
- **Key Actions:** View assigned tickets, drag-and-drop on board, comment on tickets, update status.
- **Data Scope:** Self-scoped — sees only tickets assigned to them.

---

## 3. Feature Specifications

### 3.1 Authentication & Onboarding

#### 3.1.1 Login
- **Route:** `/login`
- **Flow:** Email + password → JWT access token (short-lived) + refresh token (httpOnly cookie, 7-day expiry)
- **Behavior:** Redirects to dashboard on success. Persists auth state via Zustand store.
- **Token Refresh:** Automatic via `POST /api/auth/refresh` using httpOnly cookie.

#### 3.1.2 Invitation-Based Registration
- **Flow:** Admin sends invitation → User receives email link → `/invite/:token` → Profile setup form → Auto-login
- **Profile Setup Fields:** Full name (required), password (required), designation (optional), avatar (optional)
- **Preset Fields (from invitation):** Role, team, manager — displayed as read-only context
- **Constraints:** Token expires in 72 hours. One pending invitation per email. Revocable by Admin.

#### 3.1.3 Logout
- **Behavior:** Clears access token from memory, clears refresh cookie via `POST /api/auth/logout`.

---

### 3.2 Dashboard

- **Route:** `/`
- **Data:** Role-scoped via `GET /api/dashboard`

#### KPI Cards
| Metric | Description |
|--------|-------------|
| Total Tickets | Count of all visible tickets |
| To Do | Tickets in TODO status |
| In Progress | Tickets in IN_PROGRESS status |
| Done | Tickets in DONE status |
| Blocked | Tickets in BLOCKED status |
| Overdue | Tickets past due date and not DONE |
| Team Members | Count of users in scope |

#### Widgets
| Widget | Visualization | Data Source |
|--------|--------------|-------------|
| Tickets by Status | Pie/Bar chart | Status distribution counts |
| Tickets by Priority | Bar chart | Priority distribution counts |
| Recent Activity | Feed list | Last 10 ticket history entries |
| Overdue Tickets | Table (top 5) | Tickets where dueDate < now AND status ≠ DONE |

#### Supplementary Endpoints
- `GET /api/dashboard/velocity` — Sprint velocity data (last 10 completed sprints)
- `GET /api/dashboard/workload` — Per-member ticket counts (total vs completed)

---

### 3.3 Ticket Management

#### 3.3.1 Ticket List View
- **Route:** `/tickets`
- **Endpoint:** `GET /api/tickets` (paginated, 20/page)
- **Columns:** Ticket number, title, status (color badge), priority (color dot), assignee (avatar), due date
- **Overdue Indicator:** Red highlight on rows past due date

#### Filters
| Filter | Type | Options |
|--------|------|---------|
| Status | Dropdown | BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED |
| Priority | Dropdown | CRITICAL, HIGH, MEDIUM, LOW |
| Type | Dropdown | BUG, FEATURE, TASK, IMPROVEMENT |
| Project | Dropdown | All active projects |
| Assignee | Dropdown | All users in scope |
| Sprint | Dropdown | All sprints |
| Search | Text input | Matches title, ticket number |
| Advanced | Filter Builder | JSON conditions: `{ field, operator, value }` with `equals`, `not_equals` operators |

#### Actions
| Action | Scope | Description |
|--------|-------|-------------|
| Create Ticket | Single | Modal: title, description, project, type, priority, assignee, team, due date, story points, labels |
| Bulk Select | Multi | Checkbox selection on rows |
| Bulk Update | Multi | Change status, priority, assignee, type, team, due date, story points for selected tickets |
| Export CSV | All filtered | Download filtered ticket list as .csv |
| Export PDF | All filtered | Download formatted PDF report |

#### 3.3.2 Ticket Detail View
- **Route:** `/tickets/:id`
- **Endpoint:** `GET /api/tickets/:id`
- **Layout:** Two-column — left (description + comments), right (metadata + history)

#### Editable Metadata Fields
| Field | Input Type | Notes |
|-------|-----------|-------|
| Status | Dropdown | 6 statuses |
| Priority | Dropdown | 4 levels |
| Type | Dropdown | 4 types |
| Assignee | User picker | Triggers TICKET_ASSIGNED notification |
| Due Date | Date picker | Overdue detection |
| Story Points | Number input | Fibonacci: 1, 2, 3, 5, 8, 13, 21 |
| Labels | Tag input | Free-form string array |
| Description | Text area | Rich text content |

#### History Tab
- Source: `GET /api/tickets/:id/history`
- Shows: Field changed, old value → new value, changed by (user), timestamp
- Ordered: Most recent first

#### Comments Section
- Source: `GET /api/comments/:ticketId`
- **Threading:** Top-level comments + nested replies via `parentId`
- **Create:** `POST /api/comments/:ticketId` — body: `{ content, parentId? }`
- **Edit:** `PATCH /api/comments/:ticketId/:commentId` — Author only
- **Delete:** `DELETE /api/comments/:ticketId/:commentId` — Author or Admin
- **Notifications:** Auto-notifies ticket assignee and creator (not comment author)

#### 3.3.3 Auto-Generated Ticket Numbers
- Format: `{PROJECT_KEY}-{N}` (e.g., CP-1, APP-14)
- Logic: Count existing tickets in project + 1

---

### 3.4 Kanban Board

- **Route:** `/board`
- **Interaction:** Drag-and-drop via `@hello-pangea/dnd`

#### Columns
| Column | Status Value | Color |
|--------|-------------|-------|
| Backlog | BACKLOG | Gray |
| To Do | TODO | Blue |
| In Progress | IN_PROGRESS | Yellow |
| In Review | IN_REVIEW | Purple |
| Done | DONE | Green |
| Blocked | BLOCKED | Red |

#### Card Content
- Ticket number, title, priority (color dot), assignee (avatar), due date
- Overdue indicator (red border/badge)

#### Board Features
| Feature | Description |
|---------|-------------|
| Drag & Drop | Move cards between columns → updates ticket status via API |
| Optimistic Updates | UI updates immediately; rolls back on API failure |
| Sprint Filter | Show only tickets in a specific sprint |
| Assignee Filter | Filter by assignee |
| Type Filter | Filter by ticket type |
| Swimlanes | Group by: None, Assignee, or Priority |

---

### 3.5 Sprint Management

#### 3.5.1 Sprint Planning
- **Route:** `/sprints/planning`
- **Layout:** Split view — Left: backlog tickets, Right: planned sprint tickets
- **Drag & Drop:** Move tickets between backlog ↔ sprint
- **Create Sprint:** Modal with name, project, start/end dates, goal
- **Ticket Add:** `POST /api/sprints/:id/tickets` with `{ ticketIds: [...] }`
- **Behavior:** Moving ticket to sprint changes status from BACKLOG → TODO

#### 3.5.2 Active Sprint
- **Route:** `/sprints/active`
- **Header:** Sprint name, goal, date range, days remaining
- **Burndown Chart:** Ideal line (linear) vs actual remaining points (Recharts line chart)
- **Metrics:** Total points, completed points, completion percentage
- **Board View:** Kanban filtered to active sprint tickets
- **List View:** Table of sprint tickets
- **Complete Sprint:** `POST /api/sprints/:id/complete`
  - Option: Carry over incomplete tickets to another sprint (`carryOverToSprintId`)
  - Default: Move incomplete tickets back to BACKLOG

#### 3.5.3 Sprint Reports
- **Route:** `/sprints/reports`
- **Sprint Selector:** Dropdown of completed sprints
- **Charts:**
  - Burndown: Ideal vs actual points over sprint days
  - Velocity: Bar chart — points completed per sprint (last 10)
  - Status Distribution: Pie chart — tickets by final status
- **Metrics Table:**
  - Total/completed/remaining points
  - Total/done/in-progress/blocked tickets
  - Completion percentage
  - Average velocity

#### Sprint Lifecycle State Machine
```
PLANNED → ACTIVE → COMPLETED
```
| Transition | Trigger | Constraints |
|-----------|---------|-------------|
| PLANNED → ACTIVE | `POST /api/sprints/:id/start` | Only 1 active sprint per project; auto-sets dates if missing |
| ACTIVE → COMPLETED | `POST /api/sprints/:id/complete` | Incomplete tickets → next sprint or backlog |

---

### 3.6 Team Management

- **Route:** `/teams`
- **List View:** Cards showing team name, lead, member count
- **Detail View:** Member table (name, email, designation, role, ticket counts)
- **CRUD:** Create (`POST /api/teams`), Update (`PATCH /api/teams/:id`), Delete (`DELETE /api/teams/:id`)
- **Permissions:** Create/Edit = Admin or Manager; Delete = Admin only

---

### 3.7 Project Management

- **Route:** `/projects`
- **List View:** Cards with project name, key, lead, ticket/sprint counts, status badge
- **CRUD:** Create, Update, Archive, Delete
- **Key Validation:** 2–6 uppercase letters, unique across system
- **Status:** ACTIVE ↔ ARCHIVED
- **Permissions:** Create = Admin or Project Manager; Delete = Admin only

---

### 3.8 Member & Invitation Management (Admin Only)

- **Route:** `/members`

#### Member Management
- **Table:** Name, email, designation, role, team, manager, ticket counts
- **Actions:** Edit profile, change role (enforces 2-admin cap)
- **Filters:** Search (name/email), role filter

#### Invitation Management
- **Send Invitation:** `POST /api/invitations` — email, preset role, preset team, preset manager
- **Constraints:** User must not exist; no duplicate pending invitations; 2-admin cap check
- **Table:** Pending/accepted/expired/revoked invitations with status, expiry, inviter
- **Revoke:** `DELETE /api/invitations/:id` — sets status to REVOKED
- **Email:** Dev mode = console log; Production = SMTP via Nodemailer

---

### 3.9 Notifications

- **Endpoint:** `GET /api/notifications` (latest 50, filterable by unread)
- **UI:** Bell icon in top bar with unread count badge; notification list page

#### Notification Triggers
| Event | Type | Recipients |
|-------|------|-----------|
| Ticket assigned | TICKET_ASSIGNED | Assignee |
| Ticket status changed | TICKET_UPDATED | Assignee |
| Comment added | TICKET_COMMENTED | Ticket assignee + creator (not author) |
| Sprint started | SPRINT_STARTED | All sprint ticket assignees |
| Sprint completed | SPRINT_COMPLETED | All sprint ticket assignees |
| Invitation sent | INVITATION_SENT | (Logged, email sent) |
| Ticket overdue | OVERDUE | (Dashboard-driven) |

#### Actions
- Mark single as read: `PATCH /api/notifications/:id/read`
- Mark all as read: `PATCH /api/notifications/read`
- Click notification → navigates to deep link (e.g., ticket detail)

---

### 3.10 Global Search & Command Palette

#### Global Search
- **Endpoint:** `GET /api/search?q=query` (minimum 2 characters)
- **Searches:** Tickets (title, number, description), Users (name, email), Projects (name, key)
- **Results:** 5 per category, role-scoped
- **Matching:** Case-insensitive LIKE pattern

#### Command Palette
- **Trigger:** `Cmd+K` / `Ctrl+K`
- **Features:** Search across entities, navigate to pages, keyboard-driven

---

### 3.11 Admin Tools

#### Activity Log
- **Route:** `/activity` (Admin only)
- **Endpoint:** `GET /api/admin/activity` (paginated, 50/page)
- **Content:** All ticket change history across the system
- **Columns:** Timestamp, user, ticket, field, old value, new value

#### Settings
- **Route:** `/settings` (Admin only)
- **Tabs:** Invitations, Users, Projects, Teams, Platform Settings (placeholder)

---

## 4. Data Models

### Entity Relationship Summary

```
User ──┬── Team (belongsTo)
       ├── Manager (self-referential, optional)
       ├── Project (leads)
       ├── Ticket (creates / assigned to)
       ├── Sprint (creates)
       ├── Comment (authors)
       ├── Notification (receives)
       ├── TicketHistory (changes)
       └── Invitation (sends)

Project ──┬── Ticket (has many)
          └── Sprint (has many)

Sprint ──── SprintTicket ──── Ticket (many-to-many)

Ticket ──┬── Comment (has many, threaded via parentId)
         └── TicketHistory (has many)
```

### Enums

| Enum | Values |
|------|--------|
| UserRole | ADMIN, MANAGER, PROJECT_MANAGER, MEMBER |
| UserStatus | ACTIVE, INACTIVE, PENDING |
| TicketStatus | BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED |
| TicketPriority | CRITICAL, HIGH, MEDIUM, LOW |
| TicketType | BUG, FEATURE, TASK, IMPROVEMENT |
| SprintStatus | PLANNED, ACTIVE, COMPLETED |
| ProjectStatus | ACTIVE, ARCHIVED |
| InvitationStatus | PENDING, ACCEPTED, EXPIRED, REVOKED |
| NotificationType | TICKET_ASSIGNED, TICKET_UPDATED, TICKET_COMMENTED, SPRINT_STARTED, SPRINT_COMPLETED, INVITATION_SENT, MENTION, OVERDUE |

---

## 5. API Endpoint Summary

| Method | Endpoint | Auth | Role Restriction |
|--------|----------|------|-----------------|
| POST | /api/auth/login | No | — |
| POST | /api/auth/refresh | Cookie | — |
| POST | /api/auth/logout | Cookie | — |
| GET | /api/auth/invite/:token | No | — |
| POST | /api/auth/setup | No | — |
| GET | /api/auth/me | Yes | — |
| GET | /api/users | Yes | Scoped by role |
| GET | /api/users/:id | Yes | — |
| PATCH | /api/users/:id | Yes | Self or Admin |
| PATCH | /api/users/:id/role | Yes | Admin |
| GET | /api/teams | Yes | — |
| GET | /api/teams/:id | Yes | — |
| POST | /api/teams | Yes | Admin, Manager |
| PATCH | /api/teams/:id | Yes | Admin, Manager |
| DELETE | /api/teams/:id | Yes | Admin |
| GET | /api/projects | Yes | Scoped by role |
| GET | /api/projects/:id | Yes | — |
| POST | /api/projects | Yes | Admin, PM |
| PATCH | /api/projects/:id | Yes | Admin, PM |
| DELETE | /api/projects/:id | Yes | Admin |
| GET | /api/tickets | Yes | Scoped by role |
| GET | /api/tickets/:id | Yes | — |
| POST | /api/tickets | Yes | — |
| PATCH | /api/tickets/:id | Yes | — |
| DELETE | /api/tickets/:id | Yes | — |
| PUT | /api/tickets/bulk | Yes | — |
| GET | /api/tickets/:id/history | Yes | — |
| GET | /api/sprints | Yes | — |
| GET | /api/sprints/:id | Yes | — |
| POST | /api/sprints | Yes | Admin, Manager, PM |
| PATCH | /api/sprints/:id | Yes | Admin, Manager, PM |
| POST | /api/sprints/:id/start | Yes | Admin, Manager, PM |
| POST | /api/sprints/:id/complete | Yes | Admin, Manager, PM |
| POST | /api/sprints/:id/tickets | Yes | — |
| DELETE | /api/sprints/:id/tickets/:ticketId | Yes | — |
| GET | /api/sprints/:id/burndown | Yes | — |
| GET | /api/comments/:ticketId | Yes | — |
| POST | /api/comments/:ticketId | Yes | — |
| PATCH | /api/comments/:ticketId/:commentId | Yes | Author |
| DELETE | /api/comments/:ticketId/:commentId | Yes | Author, Admin |
| GET | /api/notifications | Yes | Own only |
| PATCH | /api/notifications/read | Yes | Own only |
| PATCH | /api/notifications/:id/read | Yes | Own only |
| GET | /api/invitations | Yes | Admin |
| POST | /api/invitations | Yes | Admin |
| DELETE | /api/invitations/:id | Yes | Admin |
| GET | /api/dashboard | Yes | Scoped by role |
| GET | /api/dashboard/velocity | Yes | — |
| GET | /api/dashboard/workload | Yes | Scoped by role |
| GET | /api/search | Yes | Scoped by role |
| GET | /api/admin/activity | Yes | Admin |
| GET | /api/health | No | — |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| **Performance** | API responses < 500ms for list endpoints; Dashboard loads < 2s |
| **Security** | JWT auth with httpOnly refresh cookies; Helmet security headers; CORS whitelist; bcrypt password hashing |
| **Scalability** | PostgreSQL with indexed queries; paginated endpoints (20–50 per page) |
| **Reliability** | Transactional writes (Prisma transactions for ticket updates + history) |
| **Accessibility** | Keyboard navigation via command palette (Cmd+K) |
| **Browser Support** | Chrome, Firefox, Edge, Safari (latest 2 versions) |
| **Responsiveness** | Board adapts to 2-column layout on mobile; sidebar collapsible |

---

## 7. Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite 8 |
| **Styling** | Tailwind CSS 3 |
| **State** | Zustand (auth), TanStack React Query (server state) |
| **Drag & Drop** | @hello-pangea/dnd |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Export** | jsPDF, jspdf-autotable (PDF); custom CSV utility |
| **Backend** | Express 5, TypeScript, tsx (dev runner) |
| **Database** | PostgreSQL |
| **ORM** | Prisma 6 |
| **Auth** | jsonwebtoken, bcryptjs |
| **Security** | Helmet, CORS, cookie-parser |
| **Email** | Nodemailer |
| **IDs** | UUID v4 |

---

## 8. Future Roadmap (Post-MVP)

| Phase | Feature | Description |
|-------|---------|-------------|
| 2.0 | Real-time Updates | WebSocket integration for live board/notification sync |
| 2.0 | @Mentions | Parse @username in comments, trigger MENTION notifications |
| 2.0 | File Attachments | Upload files/screenshots to tickets |
| 2.1 | SSO / OAuth | Google, Microsoft, SAML-based authentication |
| 2.1 | Time Tracking | Log estimated vs actual hours per ticket |
| 2.1 | Ticket Dependencies | Block/depends-on relationships between tickets |
| 2.2 | Gantt Chart View | Timeline visualization of project schedule |
| 2.2 | Webhooks & Integrations | Slack, GitHub, CI/CD pipeline triggers |
| 2.2 | Custom Fields | Configurable ticket fields per project |
| 3.0 | Mobile App | React Native companion app |
| 3.0 | Recurring Tasks | Template-based repeating tickets |
| 3.0 | Advanced Reporting | Custom report builder with saved views |
