import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TaskPilot database with realistic demo data...');

  const adminPwd = await bcrypt.hash('admin123', 12);
  const demoPwd = await bcrypt.hash('demo123', 12);

  // ─── Admins ───────────────────────────────────────────
  const arjun = await prisma.user.upsert({
    where: { email: 'admin@projecthub.com' },
    update: {},
    create: { email: 'admin@projecthub.com', password: adminPwd, fullName: 'Arjun Patel', designation: 'CTO', role: 'ADMIN', status: 'ACTIVE' },
  });

  const sneha = await prisma.user.upsert({
    where: { email: 'sneha@projecthub.com' },
    update: {},
    create: { email: 'sneha@projecthub.com', password: adminPwd, fullName: 'Sneha Reddy', designation: 'VP Engineering', role: 'ADMIN', status: 'ACTIVE' },
  });

  // ─── Managers ─────────────────────────────────────────
  const vikram = await prisma.user.upsert({
    where: { email: 'vikram@projecthub.com' },
    update: {},
    create: { email: 'vikram@projecthub.com', password: demoPwd, fullName: 'Vikram Sharma', designation: 'Engineering Manager', role: 'MANAGER', status: 'ACTIVE' },
  });

  const priya = await prisma.user.upsert({
    where: { email: 'priya@projecthub.com' },
    update: {},
    create: { email: 'priya@projecthub.com', password: demoPwd, fullName: 'Priya Nair', designation: 'Backend Lead', role: 'MANAGER', status: 'ACTIVE' },
  });

  const rohan = await prisma.user.upsert({
    where: { email: 'rohan@projecthub.com' },
    update: {},
    create: { email: 'rohan@projecthub.com', password: demoPwd, fullName: 'Rohan Gupta', designation: 'QA Manager', role: 'MANAGER', status: 'ACTIVE' },
  });

  const ananya = await prisma.user.upsert({
    where: { email: 'ananya@projecthub.com' },
    update: {},
    create: { email: 'ananya@projecthub.com', password: demoPwd, fullName: 'Ananya Singh', designation: 'Design Lead', role: 'MANAGER', status: 'ACTIVE' },
  });

  // ─── Project Managers ─────────────────────────────────
  const karthik = await prisma.user.upsert({
    where: { email: 'karthik@projecthub.com' },
    update: {},
    create: { email: 'karthik@projecthub.com', password: demoPwd, fullName: 'Karthik Iyer', designation: 'Project Manager', role: 'PROJECT_MANAGER', status: 'ACTIVE', managerId: vikram.id },
  });

  const meera = await prisma.user.upsert({
    where: { email: 'meera@projecthub.com' },
    update: {},
    create: { email: 'meera@projecthub.com', password: demoPwd, fullName: 'Meera Joshi', designation: 'Project Manager', role: 'PROJECT_MANAGER', status: 'ACTIVE', managerId: priya.id },
  });

  // ─── Members ──────────────────────────────────────────
  const rahul = await prisma.user.upsert({
    where: { email: 'rahul@projecthub.com' },
    update: {},
    create: { email: 'rahul@projecthub.com', password: demoPwd, fullName: 'Rahul Dev', designation: 'Senior Developer', role: 'MEMBER', status: 'ACTIVE', managerId: vikram.id },
  });

  const deepak = await prisma.user.upsert({
    where: { email: 'deepak@projecthub.com' },
    update: {},
    create: { email: 'deepak@projecthub.com', password: demoPwd, fullName: 'Deepak Kumar', designation: 'Senior Developer', role: 'MEMBER', status: 'ACTIVE', managerId: priya.id },
  });

  const lakshmi = await prisma.user.upsert({
    where: { email: 'lakshmi@projecthub.com' },
    update: {},
    create: { email: 'lakshmi@projecthub.com', password: demoPwd, fullName: 'Lakshmi Priya', designation: 'QA Engineer', role: 'MEMBER', status: 'ACTIVE', managerId: rohan.id },
  });

  const sanjay = await prisma.user.upsert({
    where: { email: 'sanjay@projecthub.com' },
    update: {},
    create: { email: 'sanjay@projecthub.com', password: demoPwd, fullName: 'Sanjay Reddy', designation: 'DevOps Engineer', role: 'MEMBER', status: 'ACTIVE', managerId: priya.id },
  });

  const divya = await prisma.user.upsert({
    where: { email: 'divya@projecthub.com' },
    update: {},
    create: { email: 'divya@projecthub.com', password: demoPwd, fullName: 'Divya Menon', designation: 'UI/UX Designer', role: 'MEMBER', status: 'ACTIVE', managerId: ananya.id },
  });

  const amit = await prisma.user.upsert({
    where: { email: 'amit@projecthub.com' },
    update: {},
    create: { email: 'amit@projecthub.com', password: demoPwd, fullName: 'Amit Sharma', designation: 'Frontend Developer', role: 'MEMBER', status: 'ACTIVE', managerId: vikram.id },
  });

  const nisha = await prisma.user.upsert({
    where: { email: 'nisha@projecthub.com' },
    update: {},
    create: { email: 'nisha@projecthub.com', password: demoPwd, fullName: 'Nisha Patel', designation: 'Backend Developer', role: 'MEMBER', status: 'ACTIVE', managerId: priya.id },
  });

  const vivek = await prisma.user.upsert({
    where: { email: 'vivek@projecthub.com' },
    update: {},
    create: { email: 'vivek@projecthub.com', password: demoPwd, fullName: 'Vivek Jain', designation: 'Full Stack Developer', role: 'MEMBER', status: 'ACTIVE', managerId: vikram.id },
  });

  const kavya = await prisma.user.upsert({
    where: { email: 'kavya@projecthub.com' },
    update: {},
    create: { email: 'kavya@projecthub.com', password: demoPwd, fullName: 'Kavya Krishnamurthy', designation: 'UI/UX Designer', role: 'MEMBER', status: 'ACTIVE', managerId: ananya.id },
  });

  const harish = await prisma.user.upsert({
    where: { email: 'harish@projecthub.com' },
    update: {},
    create: { email: 'harish@projecthub.com', password: demoPwd, fullName: 'Harish Nair', designation: 'QA Engineer', role: 'MEMBER', status: 'ACTIVE', managerId: rohan.id },
  });

  const sunita = await prisma.user.upsert({
    where: { email: 'sunita@projecthub.com' },
    update: {},
    create: { email: 'sunita@projecthub.com', password: demoPwd, fullName: 'Sunita Rao', designation: 'Technical Writer', role: 'MEMBER', status: 'ACTIVE', managerId: vikram.id },
  });

  const ravi = await prisma.user.upsert({
    where: { email: 'ravi@projecthub.com' },
    update: {},
    create: { email: 'ravi@projecthub.com', password: demoPwd, fullName: 'Ravi Kumar', designation: 'Junior Developer', role: 'MEMBER', status: 'ACTIVE', managerId: vikram.id },
  });

  console.log('✅ 20 users created');

  // ─── Teams ────────────────────────────────────────────
  const frontendTeam = await prisma.team.upsert({ where: { name: 'Frontend Team' }, update: {}, create: { name: 'Frontend Team', leadId: vikram.id } });
  const backendTeam = await prisma.team.upsert({ where: { name: 'Backend Team' }, update: {}, create: { name: 'Backend Team', leadId: priya.id } });
  const qaTeam = await prisma.team.upsert({ where: { name: 'QA Team' }, update: {}, create: { name: 'QA Team', leadId: rohan.id } });
  const designTeam = await prisma.team.upsert({ where: { name: 'Design Team' }, update: {}, create: { name: 'Design Team', leadId: ananya.id } });

  const teamAssignments: Array<{ id: string; teamId: string }> = [
    { id: vikram.id, teamId: frontendTeam.id }, { id: rahul.id, teamId: frontendTeam.id },
    { id: amit.id, teamId: frontendTeam.id }, { id: vivek.id, teamId: frontendTeam.id },
    { id: ravi.id, teamId: frontendTeam.id }, { id: karthik.id, teamId: frontendTeam.id },
    { id: priya.id, teamId: backendTeam.id }, { id: deepak.id, teamId: backendTeam.id },
    { id: nisha.id, teamId: backendTeam.id }, { id: sanjay.id, teamId: backendTeam.id },
    { id: meera.id, teamId: backendTeam.id }, { id: sunita.id, teamId: backendTeam.id },
    { id: rohan.id, teamId: qaTeam.id }, { id: lakshmi.id, teamId: qaTeam.id }, { id: harish.id, teamId: qaTeam.id },
    { id: ananya.id, teamId: designTeam.id }, { id: divya.id, teamId: designTeam.id }, { id: kavya.id, teamId: designTeam.id },
  ];

  for (const a of teamAssignments) {
    await prisma.user.update({ where: { id: a.id }, data: { teamId: a.teamId } });
  }

  console.log('✅ 4 teams created and members assigned');

  // ─── Projects ─────────────────────────────────────────
  const cpProject = await prisma.project.upsert({ where: { key: 'CP' }, update: {}, create: { name: 'Customer Portal', key: 'CP', leadId: karthik.id, status: 'ACTIVE' } });
  const appProject = await prisma.project.upsert({ where: { key: 'APP' }, update: {}, create: { name: 'Mobile App', key: 'APP', leadId: meera.id, status: 'ACTIVE' } });
  const dashProject = await prisma.project.upsert({ where: { key: 'DASH' }, update: {}, create: { name: 'Internal Dashboard', key: 'DASH', leadId: arjun.id, status: 'ACTIVE' } });

  console.log('✅ 3 projects created');

  const now = new Date();
  const d = (days: number) => new Date(now.getTime() - days * 86400000);
  const df = (days: number) => new Date(now.getTime() + days * 86400000);

  // ─── Tickets ──────────────────────────────────────────
  type TicketStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
  type TicketType = 'BUG' | 'FEATURE' | 'TASK' | 'IMPROVEMENT';
  type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

  interface TicketDef {
    num: string;
    title: string;
    type: TicketType;
    priority: TicketPriority;
    status: TicketStatus;
    points: number;
    project: { id: string };
    assignee: { id: string } | null;
    team: { id: string };
    labels: string[];
    dueDate: Date;
    desc?: string;
  }

  const ticketDefs: TicketDef[] = [
    // ── Customer Portal ──────────────────────────────────
    { num: 'CP-1', title: 'Fix login redirect on session expiry', type: 'BUG', priority: 'CRITICAL', status: 'DONE', points: 2, project: cpProject, assignee: rahul, team: frontendTeam, labels: ['auth', 'hotfix'], dueDate: d(27) },
    { num: 'CP-2', title: 'Implement user search with filters', type: 'FEATURE', priority: 'HIGH', status: 'DONE', points: 8, project: cpProject, assignee: amit, team: frontendTeam, labels: ['search', 'ux'], dueDate: d(25) },
    { num: 'CP-3', title: 'Design onboarding flow for new users', type: 'FEATURE', priority: 'HIGH', status: 'DONE', points: 13, project: cpProject, assignee: divya, team: designTeam, labels: ['onboarding', 'design'], dueDate: d(22) },
    { num: 'CP-4', title: 'API rate limiting on public endpoints', type: 'IMPROVEMENT', priority: 'HIGH', status: 'DONE', points: 5, project: cpProject, assignee: deepak, team: backendTeam, labels: ['security', 'api'], dueDate: d(20) },
    { num: 'CP-5', title: 'Fix pagination on ticket list view', type: 'BUG', priority: 'MEDIUM', status: 'DONE', points: 3, project: cpProject, assignee: vivek, team: frontendTeam, labels: ['pagination'], dueDate: d(18) },
    { num: 'CP-6', title: 'Add CSV export for reports', type: 'FEATURE', priority: 'MEDIUM', status: 'DONE', points: 5, project: cpProject, assignee: nisha, team: backendTeam, labels: ['export', 'reports'], dueDate: d(16) },
    { num: 'CP-7', title: 'Optimize homepage load time', type: 'IMPROVEMENT', priority: 'MEDIUM', status: 'DONE', points: 8, project: cpProject, assignee: ravi, team: frontendTeam, labels: ['performance'], dueDate: d(14) },
    { num: 'CP-8', title: 'Write unit tests for auth module', type: 'TASK', priority: 'MEDIUM', status: 'DONE', points: 5, project: cpProject, assignee: lakshmi, team: qaTeam, labels: ['testing', 'auth'], dueDate: d(12) },
    { num: 'CP-9', title: 'Dashboard KPI cards show wrong data', type: 'BUG', priority: 'HIGH', status: 'DONE', points: 3, project: cpProject, assignee: rahul, team: frontendTeam, labels: ['dashboard'], dueDate: d(10) },
    { num: 'CP-10', title: 'Notification system integration', type: 'FEATURE', priority: 'HIGH', status: 'DONE', points: 13, project: cpProject, assignee: deepak, team: backendTeam, labels: ['notifications'], dueDate: d(8) },
    { num: 'CP-11', title: 'Add role-based sidebar navigation', type: 'IMPROVEMENT', priority: 'MEDIUM', status: 'IN_PROGRESS', points: 5, project: cpProject, assignee: amit, team: frontendTeam, labels: ['rbac', 'ui'], dueDate: df(3) },
    { num: 'CP-12', title: 'Sprint burndown chart accuracy fix', type: 'BUG', priority: 'HIGH', status: 'IN_PROGRESS', points: 5, project: cpProject, assignee: vivek, team: frontendTeam, labels: ['charts'], dueDate: df(2) },
    { num: 'CP-13', title: 'Integrate email notifications on ticket assignment', type: 'FEATURE', priority: 'MEDIUM', status: 'IN_PROGRESS', points: 8, project: cpProject, assignee: nisha, team: backendTeam, labels: ['email'], dueDate: df(4) },
    { num: 'CP-14', title: 'Add two-factor authentication support', type: 'FEATURE', priority: 'HIGH', status: 'IN_REVIEW', points: 13, project: cpProject, assignee: deepak, team: backendTeam, labels: ['security', '2fa'], dueDate: df(1) },
    { num: 'CP-15', title: 'Responsive design audit for mobile', type: 'IMPROVEMENT', priority: 'MEDIUM', status: 'IN_REVIEW', points: 8, project: cpProject, assignee: divya, team: designTeam, labels: ['responsive'], dueDate: df(2) },
    { num: 'CP-16', title: 'Bulk ticket status update feature', type: 'FEATURE', priority: 'LOW', status: 'TODO', points: 5, project: cpProject, assignee: rahul, team: frontendTeam, labels: ['bulk-actions'], dueDate: df(7) },
    { num: 'CP-17', title: 'Add dark mode support', type: 'FEATURE', priority: 'LOW', status: 'TODO', points: 13, project: cpProject, assignee: kavya, team: designTeam, labels: ['dark-mode', 'ui'], dueDate: df(10) },
    { num: 'CP-18', title: 'Refactor API client for better error handling', type: 'IMPROVEMENT', priority: 'MEDIUM', status: 'TODO', points: 5, project: cpProject, assignee: sanjay, team: backendTeam, labels: ['refactor'], dueDate: df(8) },
    { num: 'CP-19', title: 'Write E2E tests for login flow', type: 'TASK', priority: 'HIGH', status: 'TODO', points: 8, project: cpProject, assignee: harish, team: qaTeam, labels: ['testing', 'e2e'], dueDate: df(6) },
    { num: 'CP-20', title: 'Profile page avatar upload', type: 'FEATURE', priority: 'LOW', status: 'BACKLOG', points: 5, project: cpProject, assignee: null, team: frontendTeam, labels: ['profile'], dueDate: df(14) },
    { num: 'CP-21', title: 'Add global keyboard shortcuts', type: 'FEATURE', priority: 'LOW', status: 'BACKLOG', points: 3, project: cpProject, assignee: null, team: frontendTeam, labels: ['accessibility'], dueDate: df(14) },
    { num: 'CP-22', title: 'Database query optimization for reports', type: 'IMPROVEMENT', priority: 'MEDIUM', status: 'BACKLOG', points: 8, project: cpProject, assignee: null, team: backendTeam, labels: ['performance', 'db'], dueDate: df(21) },
    { num: 'CP-23', title: 'Fix comment threading display issue', type: 'BUG', priority: 'LOW', status: 'BACKLOG', points: 2, project: cpProject, assignee: null, team: frontendTeam, labels: ['comments'], dueDate: df(14) },
    { num: 'CP-24', title: 'Activity log export to PDF', type: 'FEATURE', priority: 'LOW', status: 'BACKLOG', points: 5, project: cpProject, assignee: null, team: backendTeam, labels: ['export', 'pdf'], dueDate: df(21) },
    { num: 'CP-25', title: 'Overdue ticket auto-notification', type: 'FEATURE', priority: 'MEDIUM', status: 'BLOCKED', points: 8, project: cpProject, assignee: deepak, team: backendTeam, labels: ['notifications', 'cron'], dueDate: d(2), desc: 'Blocked by missing SMTP credentials. DevOps team is setting up the SMTP relay service.' },

    // ── Mobile App ────────────────────────────────────────
    { num: 'APP-1', title: 'Set up React Native project structure', type: 'TASK', priority: 'CRITICAL', status: 'DONE', points: 3, project: appProject, assignee: rahul, team: frontendTeam, labels: ['setup', 'rn'], dueDate: d(28) },
    { num: 'APP-2', title: 'Implement push notification service', type: 'FEATURE', priority: 'HIGH', status: 'DONE', points: 13, project: appProject, assignee: deepak, team: backendTeam, labels: ['push', 'notifications'], dueDate: d(22) },
    { num: 'APP-3', title: 'Design mobile UI component library', type: 'TASK', priority: 'HIGH', status: 'DONE', points: 21, project: appProject, assignee: divya, team: designTeam, labels: ['design', 'components'], dueDate: d(18) },
    { num: 'APP-4', title: 'Authentication token refresh on mobile', type: 'BUG', priority: 'CRITICAL', status: 'DONE', points: 5, project: appProject, assignee: nisha, team: backendTeam, labels: ['auth', 'mobile'], dueDate: d(16) },
    { num: 'APP-5', title: 'Offline mode data sync', type: 'FEATURE', priority: 'HIGH', status: 'IN_PROGRESS', points: 21, project: appProject, assignee: vivek, team: frontendTeam, labels: ['offline', 'sync'], dueDate: df(5) },
    { num: 'APP-6', title: 'Biometric login integration', type: 'FEATURE', priority: 'MEDIUM', status: 'IN_PROGRESS', points: 8, project: appProject, assignee: amit, team: frontendTeam, labels: ['biometric', 'security'], dueDate: df(6) },
    { num: 'APP-7', title: 'App crash on Android 12 deep links', type: 'BUG', priority: 'CRITICAL', status: 'IN_REVIEW', points: 5, project: appProject, assignee: ravi, team: frontendTeam, labels: ['android', 'crash', 'hotfix'], dueDate: d(1) },
    { num: 'APP-8', title: 'Performance profiling and optimization', type: 'IMPROVEMENT', priority: 'MEDIUM', status: 'TODO', points: 13, project: appProject, assignee: sanjay, team: backendTeam, labels: ['performance'], dueDate: df(10) },
    { num: 'APP-9', title: 'QA regression test suite for v1.0', type: 'TASK', priority: 'HIGH', status: 'TODO', points: 13, project: appProject, assignee: lakshmi, team: qaTeam, labels: ['qa', 'regression'], dueDate: df(8) },
    { num: 'APP-10', title: 'App Store submission checklist', type: 'TASK', priority: 'MEDIUM', status: 'BACKLOG', points: 3, project: appProject, assignee: null, team: frontendTeam, labels: ['release'], dueDate: df(21) },
    { num: 'APP-11', title: 'Localization support (Hindi, Tamil)', type: 'FEATURE', priority: 'LOW', status: 'BACKLOG', points: 13, project: appProject, assignee: null, team: frontendTeam, labels: ['i18n'], dueDate: df(28) },
    { num: 'APP-12', title: 'Memory leak in image caching', type: 'BUG', priority: 'HIGH', status: 'BLOCKED', points: 8, project: appProject, assignee: rahul, team: frontendTeam, labels: ['memory', 'performance'], dueDate: d(3), desc: 'Blocked pending profiling tool access. DevOps needs to enable heap snapshots in staging.' },

    // ── Internal Dashboard ────────────────────────────────
    { num: 'DASH-1', title: 'Set up analytics data pipeline', type: 'TASK', priority: 'HIGH', status: 'DONE', points: 13, project: dashProject, assignee: sanjay, team: backendTeam, labels: ['analytics', 'pipeline'], dueDate: d(26) },
    { num: 'DASH-2', title: 'HR metrics dashboard design', type: 'TASK', priority: 'HIGH', status: 'DONE', points: 8, project: dashProject, assignee: kavya, team: designTeam, labels: ['hr', 'design'], dueDate: d(22) },
    { num: 'DASH-3', title: 'Revenue chart widget component', type: 'FEATURE', priority: 'MEDIUM', status: 'DONE', points: 5, project: dashProject, assignee: amit, team: frontendTeam, labels: ['charts', 'revenue'], dueDate: d(18) },
    { num: 'DASH-4', title: 'Employee onboarding tracker', type: 'FEATURE', priority: 'HIGH', status: 'IN_PROGRESS', points: 13, project: dashProject, assignee: vivek, team: frontendTeam, labels: ['hr', 'onboarding'], dueDate: df(4) },
    { num: 'DASH-5', title: 'Real-time data refresh WebSocket', type: 'FEATURE', priority: 'HIGH', status: 'IN_PROGRESS', points: 21, project: dashProject, assignee: deepak, team: backendTeam, labels: ['websocket', 'realtime'], dueDate: df(5) },
    { num: 'DASH-6', title: 'Date range filter on all charts', type: 'IMPROVEMENT', priority: 'MEDIUM', status: 'IN_REVIEW', points: 5, project: dashProject, assignee: nisha, team: backendTeam, labels: ['filters', 'charts'], dueDate: df(2) },
    { num: 'DASH-7', title: 'Export dashboard as PDF report', type: 'FEATURE', priority: 'MEDIUM', status: 'TODO', points: 8, project: dashProject, assignee: harish, team: qaTeam, labels: ['export', 'pdf'], dueDate: df(8) },
    { num: 'DASH-8', title: 'Role-based data visibility rules', type: 'FEATURE', priority: 'HIGH', status: 'TODO', points: 13, project: dashProject, assignee: nisha, team: backendTeam, labels: ['rbac', 'security'], dueDate: df(6) },
    { num: 'DASH-9', title: 'Dashboard loading performance audit', type: 'IMPROVEMENT', priority: 'MEDIUM', status: 'BACKLOG', points: 8, project: dashProject, assignee: null, team: frontendTeam, labels: ['performance'], dueDate: df(21) },
    { num: 'DASH-10', title: 'Write tech documentation for APIs', type: 'TASK', priority: 'LOW', status: 'BACKLOG', points: 5, project: dashProject, assignee: sunita, team: backendTeam, labels: ['docs', 'api'], dueDate: df(21) },
    { num: 'DASH-11', title: 'Add data anomaly alerts', type: 'FEATURE', priority: 'MEDIUM', status: 'BACKLOG', points: 13, project: dashProject, assignee: null, team: backendTeam, labels: ['alerts', 'monitoring'], dueDate: df(28) },
    { num: 'DASH-12', title: 'Fix tooltip overflow in bar chart', type: 'BUG', priority: 'LOW', status: 'BACKLOG', points: 2, project: dashProject, assignee: null, team: frontendTeam, labels: ['charts', 'ui'], dueDate: df(14) },
  ];

  const createdTickets: Record<string, any> = {};

  for (const def of ticketDefs) {
    const ticket = await prisma.ticket.upsert({
      where: { ticketNumber: def.num },
      update: {},
      create: {
        ticketNumber: def.num,
        title: def.title,
        description: def.desc || `Detailed description for: ${def.title}. Acceptance criteria: functionality works as expected, no regressions introduced, and all related tests pass.`,
        projectId: def.project.id,
        type: def.type,
        priority: def.priority,
        status: def.status,
        storyPoints: def.points,
        createdById: arjun.id,
        assignedToId: def.assignee?.id ?? undefined,
        teamId: def.team.id,
        labels: def.labels,
        dueDate: def.dueDate,
      },
    });
    createdTickets[def.num] = ticket;
  }

  console.log(`✅ ${ticketDefs.length} tickets created`);

  // ─── Sprints ──────────────────────────────────────────
  const sprint12 = await prisma.sprint.create({ data: { name: 'Sprint 12', projectId: cpProject.id, startDate: d(42), endDate: d(28), goal: 'Authentication overhaul and user search', status: 'COMPLETED', createdById: karthik.id } }).catch(() => null);
  const sprint13 = await prisma.sprint.create({ data: { name: 'Sprint 13', projectId: cpProject.id, startDate: d(28), endDate: d(14), goal: 'Dashboard improvements and notification system', status: 'COMPLETED', createdById: karthik.id } }).catch(() => null);
  const sprint14 = await prisma.sprint.create({ data: { name: 'Sprint 14', projectId: cpProject.id, startDate: d(7), endDate: df(7), goal: 'Ship 2FA, responsive improvements and burndown fix', status: 'ACTIVE', createdById: karthik.id } }).catch(() => null);
  const sprint15 = await prisma.sprint.create({ data: { name: 'Sprint 15', projectId: cpProject.id, startDate: df(7), endDate: df(21), goal: 'Bulk actions, dark mode and E2E tests', status: 'PLANNED', createdById: karthik.id } }).catch(() => null);

  const sprintTicketMap = [
    { sprint: sprint12, nums: ['CP-1', 'CP-2', 'CP-3', 'CP-4', 'CP-5'] },
    { sprint: sprint13, nums: ['CP-6', 'CP-7', 'CP-8', 'CP-9', 'CP-10'] },
    { sprint: sprint14, nums: ['CP-11', 'CP-12', 'CP-13', 'CP-14', 'CP-15'] },
    { sprint: sprint15, nums: ['CP-16', 'CP-17', 'CP-18', 'CP-19'] },
  ];

  for (const { sprint, nums } of sprintTicketMap) {
    if (!sprint) continue;
    for (const num of nums) {
      const t = createdTickets[num];
      if (t) await prisma.sprintTicket.create({ data: { sprintId: sprint.id, ticketId: t.id, statusAtStart: 'TODO', pointsAtStart: t.storyPoints } }).catch(() => null);
    }
  }

  console.log('✅ 4 sprints created with ticket assignments');

  // ─── Ticket History ───────────────────────────────────
  const historyDefs = [
    { n: 'CP-1', f: 'status', o: 'TODO', v: 'IN_PROGRESS', u: rahul, days: 29 },
    { n: 'CP-1', f: 'status', o: 'IN_PROGRESS', v: 'IN_REVIEW', u: rahul, days: 28 },
    { n: 'CP-1', f: 'status', o: 'IN_REVIEW', v: 'DONE', u: vikram, days: 27 },
    { n: 'CP-2', f: 'status', o: 'BACKLOG', v: 'TODO', u: karthik, days: 27 },
    { n: 'CP-2', f: 'status', o: 'TODO', v: 'IN_PROGRESS', u: amit, days: 26 },
    { n: 'CP-2', f: 'status', o: 'IN_PROGRESS', v: 'DONE', u: amit, days: 25 },
    { n: 'CP-3', f: 'status', o: 'TODO', v: 'IN_PROGRESS', u: divya, days: 24 },
    { n: 'CP-3', f: 'status', o: 'IN_PROGRESS', v: 'IN_REVIEW', u: divya, days: 23 },
    { n: 'CP-3', f: 'status', o: 'IN_REVIEW', v: 'DONE', u: ananya, days: 22 },
    { n: 'CP-4', f: 'status', o: 'TODO', v: 'IN_PROGRESS', u: deepak, days: 21 },
    { n: 'CP-4', f: 'priority', o: 'MEDIUM', v: 'HIGH', u: arjun, days: 21 },
    { n: 'CP-4', f: 'status', o: 'IN_PROGRESS', v: 'DONE', u: deepak, days: 20 },
    { n: 'CP-9', f: 'status', o: 'BACKLOG', v: 'TODO', u: vikram, days: 13 },
    { n: 'CP-9', f: 'status', o: 'TODO', v: 'IN_PROGRESS', u: rahul, days: 12 },
    { n: 'CP-9', f: 'status', o: 'IN_PROGRESS', v: 'DONE', u: rahul, days: 11 },
    { n: 'CP-11', f: 'status', o: 'BACKLOG', v: 'TODO', u: karthik, days: 6 },
    { n: 'CP-11', f: 'status', o: 'TODO', v: 'IN_PROGRESS', u: amit, days: 5 },
    { n: 'CP-12', f: 'status', o: 'BACKLOG', v: 'IN_PROGRESS', u: vivek, days: 4 },
    { n: 'CP-14', f: 'status', o: 'TODO', v: 'IN_PROGRESS', u: deepak, days: 7 },
    { n: 'CP-14', f: 'status', o: 'IN_PROGRESS', v: 'IN_REVIEW', u: deepak, days: 5 },
    { n: 'CP-15', f: 'status', o: 'TODO', v: 'IN_PROGRESS', u: divya, days: 6 },
    { n: 'CP-15', f: 'status', o: 'IN_PROGRESS', v: 'IN_REVIEW', u: divya, days: 4 },
    { n: 'CP-25', f: 'status', o: 'IN_PROGRESS', v: 'BLOCKED', u: deepak, days: 8 },
    { n: 'APP-1', f: 'status', o: 'TODO', v: 'IN_PROGRESS', u: rahul, days: 29 },
    { n: 'APP-1', f: 'status', o: 'IN_PROGRESS', v: 'DONE', u: rahul, days: 28 },
    { n: 'APP-4', f: 'priority', o: 'HIGH', v: 'CRITICAL', u: sneha, days: 20 },
    { n: 'APP-4', f: 'status', o: 'IN_PROGRESS', v: 'DONE', u: nisha, days: 18 },
    { n: 'APP-7', f: 'status', o: 'TODO', v: 'IN_PROGRESS', u: ravi, days: 6 },
    { n: 'APP-7', f: 'status', o: 'IN_PROGRESS', v: 'IN_REVIEW', u: ravi, days: 5 },
    { n: 'APP-12', f: 'status', o: 'IN_PROGRESS', v: 'BLOCKED', u: rahul, days: 7 },
    { n: 'DASH-1', f: 'status', o: 'TODO', v: 'IN_PROGRESS', u: sanjay, days: 27 },
    { n: 'DASH-1', f: 'status', o: 'IN_PROGRESS', v: 'DONE', u: sanjay, days: 26 },
    { n: 'DASH-5', f: 'storyPoints', o: '13', v: '21', u: meera, days: 4 },
    { n: 'DASH-6', f: 'status', o: 'IN_PROGRESS', v: 'IN_REVIEW', u: nisha, days: 5 },
  ];

  for (const h of historyDefs) {
    const t = createdTickets[h.n];
    if (!t) continue;
    await prisma.ticketHistory.create({
      data: { ticketId: t.id, changedById: h.u.id, fieldChanged: h.f, oldValue: h.o, newValue: h.v, changedAt: d(h.days) },
    }).catch(() => null);
  }

  console.log(`✅ ${historyDefs.length} history entries created`);

  // ─── Comments ─────────────────────────────────────────
  const commentDefs = [
    { n: 'CP-1', author: rahul, text: 'Investigated the issue — session token was not being cleared on expiry. Applied the fix and tested locally.', days: 29 },
    { n: 'CP-1', author: vikram, text: 'Looks good. Approved for merge. Please add a regression test for this case.', days: 28 },
    { n: 'CP-2', author: amit, text: 'Implemented debounced search with project and assignee filters. Added pagination support as well.', days: 26 },
    { n: 'CP-2', author: karthik, text: 'Great work! Minor feedback: increase debounce from 200ms to 300ms on mobile to reduce API calls.', days: 25 },
    { n: 'CP-3', author: divya, text: 'Completed all 5 onboarding screens. Figma file updated and shared in Slack.', days: 23 },
    { n: 'CP-3', author: ananya, text: 'Designs approved. Moving to implementation phase. Dev handoff scheduled for tomorrow.', days: 22 },
    { n: 'CP-12', author: vivek, text: 'Found the issue — elapsed days counter was off by 1. Working on a fix now.', days: 4 },
    { n: 'CP-12', author: rahul, text: 'Can you share the failing test case? Happy to help verify the fix.', days: 3 },
    { n: 'CP-14', author: deepak, text: 'Using speakeasy library for TOTP. QR code generation is working. Testing SMS fallback next.', days: 6 },
    { n: 'CP-14', author: arjun, text: 'Make sure to add rate limiting on the 2FA verification endpoint — max 5 attempts per minute.', days: 5 },
    { n: 'CP-14', author: deepak, text: 'Rate limiting added. Will demo in tomorrow standup.', days: 4 },
    { n: 'CP-25', author: deepak, text: 'Blocked: SMTP credentials for the cron service are missing. Pinging DevOps team.', days: 8 },
    { n: 'CP-25', author: sanjay, text: 'Will set up the SMTP relay this week. Will update .env.example with new variables.', days: 7 },
    { n: 'APP-5', author: vivek, text: 'Using Redux Offline for local data sync. Need to agree on conflict resolution strategy.', days: 4 },
    { n: 'APP-5', author: priya, text: 'Use last-write-wins for now. We can add conflict UI in a future sprint.', days: 3 },
    { n: 'APP-7', author: ravi, text: 'Reproduced on Android 12 with deep links containing special characters in query params. Working on a fix.', days: 5 },
    { n: 'APP-7', author: rohan, text: 'Please also test on Android 13. We got a report from a user on that version too.', days: 4 },
    { n: 'APP-12', author: rahul, text: 'Memory leak traced to a large image cache that is never evicted. Need to implement LRU eviction.', days: 7 },
    { n: 'DASH-5', author: deepak, text: 'WebSocket setup done. Reconnection logic and heartbeat are implemented. Starting on data stream serialization.', days: 3 },
    { n: 'DASH-6', author: nisha, text: 'Date range filter added to all chart widgets. Needs QA sign-off before merging.', days: 5 },
    { n: 'DASH-6', author: harish, text: 'Testing the filter now. Found one edge case with February dates in leap years. Will log separately.', days: 4 },
  ];

  for (const c of commentDefs) {
    const t = createdTickets[c.n];
    if (!t) continue;
    await prisma.comment.create({
      data: { ticketId: t.id, authorId: c.author.id, content: c.text, createdAt: d(c.days), updatedAt: d(c.days) },
    }).catch(() => null);
  }

  console.log(`✅ ${commentDefs.length} comments created`);

  // ─── Notifications ────────────────────────────────────
  const notifUsers = [rahul, deepak, amit, nisha, vivek, divya, kavya, lakshmi, harish, sanjay, karthik, meera];

  for (const u of notifUsers) {
    const userTickets = ticketDefs.filter(t => t.assignee?.id === u.id);

    if (userTickets[0]) {
      const t = createdTickets[userTickets[0].num];
      await prisma.notification.create({ data: { userId: u.id, type: 'TICKET_ASSIGNED', title: 'New ticket assigned to you', message: `You have been assigned to ${userTickets[0].num}: ${userTickets[0].title}`, link: t ? `/tickets/${t.id}` : '/tickets', isRead: false, createdAt: d(2) } }).catch(() => null);
    }

    await prisma.notification.create({ data: { userId: u.id, type: 'SPRINT_STARTED', title: 'Sprint 14 has started', message: 'Sprint 14 for Customer Portal is now active. Check your assigned tickets.', link: '/sprints/active', isRead: false, createdAt: d(7) } }).catch(() => null);

    await prisma.notification.create({ data: { userId: u.id, type: 'TICKET_COMMENTED', title: 'New comment on your ticket', message: 'Someone left a comment on a ticket you are watching.', link: '/tickets', isRead: true, createdAt: d(4) } }).catch(() => null);

    await prisma.notification.create({ data: { userId: u.id, type: 'SPRINT_COMPLETED', title: 'Sprint 13 completed', message: 'Sprint 13 has ended. 5 tickets were resolved. View the sprint report.', link: '/sprints/reports', isRead: true, createdAt: d(14) } }).catch(() => null);
  }

  // Overdue notifications
  const overdueTickets = ticketDefs.filter(t => ['IN_PROGRESS', 'IN_REVIEW', 'TODO', 'BLOCKED'].includes(t.status) && t.assignee);
  for (const t of overdueTickets.slice(0, 8)) {
    if (!t.assignee) continue;
    const ticket = createdTickets[t.num];
    await prisma.notification.create({ data: { userId: t.assignee.id, type: 'OVERDUE', title: 'Ticket overdue', message: `${t.num}: "${t.title}" is past its due date.`, link: ticket ? `/tickets/${ticket.id}` : '/tickets', isRead: false, createdAt: d(1) } }).catch(() => null);
  }

  // Admin notifications
  await prisma.notification.create({ data: { userId: arjun.id, type: 'SPRINT_COMPLETED', title: 'Sprint 13 completed', message: 'Sprint 13 for Customer Portal completed. 5 tickets resolved, 0 carried over.', link: '/sprints/reports', isRead: false, createdAt: d(14) } }).catch(() => null);
  await prisma.notification.create({ data: { userId: sneha.id, type: 'TICKET_UPDATED', title: 'Critical ticket blocked', message: 'CP-25: Overdue ticket auto-notification is now BLOCKED. Review needed.', link: `/tickets/${createdTickets['CP-25']?.id}`, isRead: false, createdAt: d(8) } }).catch(() => null);

  console.log('✅ Notifications created for all users');

  console.log('\n🎉 Seeding complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Demo Login Credentials:');
  console.log('  Admin:   admin@projecthub.com  /  admin123');
  console.log('  Manager: vikram@projecthub.com /  demo123');
  console.log('  Member:  rahul@projecthub.com  /  demo123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
