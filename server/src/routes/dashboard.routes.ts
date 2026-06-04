import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/dashboard — Role-adaptive dashboard data
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const ticketWhere: any = {};
    const memberWhere: any = { status: 'ACTIVE' };

    // Org isolation
    if (user.organizationId) {
      ticketWhere.project = { organizationId: user.organizationId };
      memberWhere.organizationId = user.organizationId;
    }

    // Role-based scoping
    if (user.role === 'MEMBER') {
      ticketWhere.assignedToId = user.userId;
    } else if (user.role === 'MANAGER') {
      const currentUser = await prisma.user.findUnique({ where: { id: user.userId } });
      if (currentUser?.teamId) {
        ticketWhere.teamId = currentUser.teamId;
        memberWhere.teamId = currentUser.teamId;
      }
    } else if (user.role === 'PROJECT_MANAGER') {
      const projects = await prisma.project.findMany({
        where: { leadId: user.userId },
        select: { id: true },
      });
      ticketWhere.projectId = { in: projects.map(p => p.id) };
    }

    const DONE_STATUSES = ['LIVE', 'NOT_REQUIRED'] as const;

    // KPI counts
    const [totalTickets, todoTickets, devInProgressTickets, inReviewTickets, deployedTickets, overdueTickets] = await Promise.all([
      prisma.ticket.count({ where: ticketWhere }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'REQUIREMENTS' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'ON_DEVELOPMENT' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'QA' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'LIVE' } }),
      prisma.ticket.count({
        where: {
          ...ticketWhere,
          dueDate: { lt: new Date() },
          status: { notIn: DONE_STATUSES },
        },
      }),
    ]);

    // Ticket distribution by status (all 11)
    const statusCounts = await Promise.all(
      ['BACKLOG','REQUIREMENTS','DESIGN','HTML','ON_DEVELOPMENT','QA','BUGS','ENHANCEMENT','UAT','LIVE','NOT_REQUIRED'].map(s =>
        prisma.ticket.count({ where: { ...ticketWhere, status: s as any } }).then(c => [s, c])
      )
    );
    const ticketsByStatus = Object.fromEntries(statusCounts);

    // Ticket distribution by priority
    const ticketsByPriority = {
      CRITICAL: await prisma.ticket.count({ where: { ...ticketWhere, priority: 'CRITICAL' } }),
      HIGH: await prisma.ticket.count({ where: { ...ticketWhere, priority: 'HIGH' } }),
      MEDIUM: await prisma.ticket.count({ where: { ...ticketWhere, priority: 'MEDIUM' } }),
      LOW: await prisma.ticket.count({ where: { ...ticketWhere, priority: 'LOW' } }),
    };

    // Recent activity — scoped to org + optional role filter
    const activityWhere: any = {};
    if (user.organizationId) {
      activityWhere.ticket = { project: { organizationId: user.organizationId } };
    }
    if (ticketWhere.assignedToId) {
      activityWhere.ticket = { ...activityWhere.ticket, assignedToId: ticketWhere.assignedToId };
    }
    const recentActivity = await prisma.ticketHistory.findMany({
      where: activityWhere,
      include: {
        changedBy: { select: { id: true, fullName: true, avatar: true } },
        ticket: { select: { id: true, ticketNumber: true, title: true } },
      },
      orderBy: { changedAt: 'desc' },
      take: 10,
    });

    // Overdue tickets list
    const overdueTicketsList = await prisma.ticket.findMany({
      where: {
        ...ticketWhere,
        dueDate: { lt: new Date() },
        status: { notIn: ['LIVE', 'NOT_REQUIRED'] },
      },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        dueDate: true,
        priority: true,
        assignedTo: { select: { id: true, fullName: true, avatar: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    // Team member count (for admin/manager)
    const teamMemberCount = user.role === 'MEMBER' ? 1 : await prisma.user.count({ where: memberWhere });

    res.json({
      kpis: {
        totalTickets,
        todoTickets,
        devInProgressTickets,
        inReviewTickets,
        deployedTickets,
        overdueTickets,
        teamMemberCount,
      },
      ticketsByStatus,
      ticketsByPriority,
      recentActivity,
      overdueTicketsList,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/velocity — Sprint velocity (ticket count based)
router.get('/velocity', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const user = req.user!;
    const where: any = { status: 'COMPLETED' };
    if (projectId) where.projectId = projectId;
    if (user.organizationId) where.organizationId = user.organizationId;

    const completedSprints = await prisma.sprint.findMany({
      where,
      include: {
        sprintTickets: {
          include: { ticket: { select: { status: true } } },
        },
      },
      orderBy: { endDate: 'asc' },
      take: 10,
    });

    const velocity = completedSprints.map(sprint => ({
      sprintName: sprint.name,
      sprintId: sprint.id,
      completedTickets: sprint.sprintTickets.filter(st => st.ticket.status === 'LIVE').length,
      totalTickets: sprint.sprintTickets.length,
    }));

    const avgVelocity = velocity.length > 0
      ? Math.round(velocity.reduce((sum, v) => sum + v.completedTickets, 0) / velocity.length)
      : 0;

    res.json({ velocity, avgVelocity });
  } catch (error) {
    console.error('Velocity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/workload — Team workload
router.get('/workload', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const memberWhere: any = { status: 'ACTIVE' };
    if (user.organizationId) memberWhere.organizationId = user.organizationId;

    if (user.role === 'MANAGER') {
      const currentUser = await prisma.user.findUnique({ where: { id: user.userId } });
      if (currentUser?.teamId) memberWhere.teamId = currentUser.teamId;
    } else if (user.role === 'MEMBER') {
      memberWhere.id = user.userId;
    }

    const sprintOrgFilter = user.organizationId ? { organizationId: user.organizationId } : {};
    const activeSprints = await prisma.sprint.findMany({
      where: { status: 'ACTIVE', ...sprintOrgFilter },
      select: { id: true },
    });
    const sprintIds = activeSprints.map(s => s.id);

    const members = await prisma.user.findMany({
      where: memberWhere,
      select: {
        id: true,
        fullName: true,
        avatar: true,
        designation: true,
        assignedTickets: {
          where: sprintIds.length > 0 ? {
            sprintTickets: { some: { sprintId: { in: sprintIds } } }
          } : { status: { notIn: ['LIVE', 'NOT_REQUIRED', 'BACKLOG'] } },
          select: {
            status: true
          }
        }
      },
      orderBy: { fullName: 'asc' },
    });

    const workload = members.map(m => {
      const total = m.assignedTickets.length;
      const completed = m.assignedTickets.filter(t => t.status === 'LIVE').length;
      return {
        id: m.id,
        fullName: m.fullName,
        avatar: m.avatar,
        designation: m.designation,
        totalTickets: total,
        completedTickets: completed,
      };
    });

    res.json(workload);
  } catch (error) {
    console.error('Workload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
