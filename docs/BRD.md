# Business Requirements Document (BRD)

## TaskPilot — Internal Project Management Tool

| Field             | Details                          |
|-------------------|----------------------------------|
| **Document Version** | 1.0                           |
| **Date**             | 2026-03-17                    |
| **Project Name**     | TaskPilot                     |
| **Project Type**     | Internal Web Application      |
| **Status**           | Development Complete (MVP)    |

---

## 1. Executive Summary

TaskPilot is an internal project management and agile tracking platform designed for engineering teams. It provides end-to-end sprint lifecycle management, ticket tracking with a Kanban board, team collaboration, and performance analytics — all behind a role-based access control system. The platform eliminates the need for external tools (Jira, Trello, Asana) by offering a streamlined, self-hosted solution tailored to in-house workflows.

---

## 2. Business Objectives

| # | Objective | Success Metric |
|---|-----------|----------------|
| 1 | Centralize project and task management across all engineering teams | 100% of teams onboarded within 30 days |
| 2 | Provide visibility into sprint progress and team workload | Managers can view real-time burndown charts and velocity metrics |
| 3 | Enforce consistent agile processes (sprint planning, execution, retrospective data) | All active projects follow a sprint lifecycle |
| 4 | Reduce context-switching by consolidating notifications, comments, and status updates | Single platform for all task-related communication |
| 5 | Enable data-driven decisions through analytics (velocity, burndown, workload) | Dashboard KPIs accessible to all managers and admins |

---

## 3. Stakeholders

| Role | Responsibility |
|------|---------------|
| **Admin (CTO / VP Engineering)** | Platform configuration, user management, global visibility, invitation management |
| **Manager (Team Lead)** | Team oversight, sprint management, workload balancing, ticket triage |
| **Project Manager** | Project-scoped sprint planning, ticket creation, progress tracking |
| **Member (Developer / QA / Designer)** | Ticket execution, status updates, commenting, self-service dashboard |

---

## 4. Business Requirements

### 4.1 User Management & Access Control

| ID | Requirement | Priority |
|----|-------------|----------|
| BR-01 | The system shall support four distinct roles: Admin, Manager, Project Manager, and Member | P0 |
| BR-02 | Admins shall be able to invite new users via email with preset role, team, and manager assignments | P0 |
| BR-03 | The system shall enforce a maximum of 2 Admin accounts at any time | P0 |
| BR-04 | Each role shall have scoped data visibility (e.g., Members see only their assigned tickets; Managers see their team's tickets) | P0 |
| BR-05 | Users shall be able to self-serve profile updates (name, designation, avatar) | P1 |
| BR-06 | Invitations shall expire after 72 hours and be revocable by Admins | P1 |

### 4.2 Project & Team Organization

| ID | Requirement | Priority |
|----|-------------|----------|
| BR-07 | The system shall support multiple concurrent projects, each with a unique key (e.g., CP, APP, DASH) | P0 |
| BR-08 | Projects shall have a designated lead and support Active/Archived status | P0 |
| BR-09 | Teams shall be organizable with a lead and member roster | P0 |
| BR-10 | Users shall belong to one team and optionally report to a manager (hierarchy) | P1 |

### 4.3 Ticket Management

| ID | Requirement | Priority |
|----|-------------|----------|
| BR-11 | The system shall support ticket creation with auto-generated ticket numbers (PROJECT_KEY-N format) | P0 |
| BR-12 | Tickets shall have configurable type (Bug, Feature, Task, Improvement), priority (Critical, High, Medium, Low), and status (Backlog, To Do, In Progress, In Review, Done, Blocked) | P0 |
| BR-13 | Tickets shall support assignment to users, teams, due dates, story points (Fibonacci scale), and labels | P0 |
| BR-14 | All ticket field changes shall be logged in an audit trail (who changed what, when, old/new values) | P0 |
| BR-15 | Users shall be able to bulk-update tickets (status, priority, assignee, etc.) | P1 |
| BR-16 | Tickets shall be exportable to CSV and PDF formats | P1 |

### 4.4 Sprint Management

| ID | Requirement | Priority |
|----|-------------|----------|
| BR-17 | The system shall support a full sprint lifecycle: Plan → Start → Execute → Complete | P0 |
| BR-18 | Only one sprint may be active per project at any time | P0 |
| BR-19 | On sprint completion, incomplete tickets shall be carryable to the next sprint or returned to backlog | P0 |
| BR-20 | Sprint start shall automatically set default dates (14-day duration) if not provided | P1 |
| BR-21 | The system shall calculate burndown metrics (ideal vs actual) and velocity trends | P1 |

### 4.5 Collaboration

| ID | Requirement | Priority |
|----|-------------|----------|
| BR-22 | Users shall be able to add threaded comments on tickets | P0 |
| BR-23 | The system shall generate in-app notifications for key events (assignment, status change, comments, sprint events, overdue tickets) | P0 |
| BR-24 | Users shall be able to mark notifications as read (individually or in bulk) | P1 |

### 4.6 Analytics & Reporting

| ID | Requirement | Priority |
|----|-------------|----------|
| BR-25 | The dashboard shall display role-scoped KPIs: total tickets, status distribution, priority distribution, overdue items, and team member count | P0 |
| BR-26 | Sprint reports shall include burndown charts, velocity charts, and completion statistics | P1 |
| BR-27 | Workload distribution data shall be available per team member | P1 |
| BR-28 | Admins shall have access to a global activity log of all ticket changes | P1 |

### 4.7 Search & Navigation

| ID | Requirement | Priority |
|----|-------------|----------|
| BR-29 | The system shall provide a global search across tickets, users, and projects | P0 |
| BR-30 | A command palette (Cmd+K) shall enable quick navigation and search | P1 |

---

## 5. Business Constraints

| # | Constraint |
|---|-----------|
| 1 | The platform is internal-only; no public-facing access is required |
| 2 | The system must be self-hosted (no SaaS dependency for core functionality) |
| 3 | Authentication is email/password-based (no SSO/OAuth in MVP) |
| 4 | Maximum 2 Admin accounts enforced at the platform level |
| 5 | Email invitations require SMTP configuration for production; dev mode logs to console |

---

## 6. Assumptions

| # | Assumption |
|---|-----------|
| 1 | A PostgreSQL database instance is available and maintained |
| 2 | All users have modern browser access (Chrome, Firefox, Edge, Safari) |
| 3 | Teams follow an agile/scrum methodology with 2-week sprints |
| 4 | Story points follow the Fibonacci sequence (1, 2, 3, 5, 8, 13, 21) |
| 5 | The initial deployment supports up to ~50–100 concurrent users |

---

## 7. Out of Scope (MVP)

| # | Item |
|---|------|
| 1 | Real-time collaboration (WebSocket-based live updates) |
| 2 | File attachments on tickets |
| 3 | Time tracking / estimation logging |
| 4 | Gantt chart view |
| 5 | Third-party integrations (Slack, GitHub, CI/CD webhooks) |
| 6 | SSO / OAuth authentication |
| 7 | Recurring / template tickets |
| 8 | Ticket dependency mapping (blocker relationships) |
| 9 | Mobile native application |
| 10 | @Mention parsing in comments |

---

## 8. Risks

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 1 | No real-time updates may cause stale board state during active sprints | Medium | Polling on key pages; document refresh expectations |
| 2 | No SSO may slow enterprise adoption if org mandates SSO | Medium | Plan SSO as Phase 2 feature |
| 3 | Email delivery failure for invitations blocks onboarding | High | Provide manual invite link fallback; log tokens in dev mode |
| 4 | Data loss on ticket deletion (hard delete with cascade) | High | Add soft-delete or confirmation dialogs; backup strategy |

---

## 9. Glossary

| Term | Definition |
|------|-----------|
| **Sprint** | A time-boxed iteration (typically 2 weeks) during which a set of tickets is completed |
| **Backlog** | Pool of unscheduled tickets not assigned to any sprint |
| **Burndown Chart** | Visual showing remaining work (story points) over sprint duration |
| **Velocity** | Average story points completed per sprint, used for capacity planning |
| **Story Points** | Relative effort estimation using Fibonacci scale |
| **KPI** | Key Performance Indicator — summary metric displayed on the dashboard |
| **RBAC** | Role-Based Access Control — data visibility scoped by user role |
