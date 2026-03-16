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

    // KPI counts
    const [totalTickets, todoTickets, inProgressTickets, doneTickets, blockedTickets, overdueTickets] = await Promise.all([
      prisma.ticket.count({ where: ticketWhere }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'TODO' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'DONE' } }),
      prisma.ticket.count({ where: { ...ticketWhere, status: 'BLOCKED' } }),
      prisma.ticket.count({
        where: {
          ...ticketWhere,
          dueDate: { lt: new Date() },
          status: { notIn: ['DONE'] },
        },
      }),
    ]);

    // Ticket distribution by status
    const ticketsByStatus = {
      BACKLOG: await prisma.ticket.count({ where: { ...ticketWhere, status: 'BACKLOG' } }),
      TODO: todoTickets,
      IN_PROGRESS: inProgressTickets,
      IN_REVIEW: await prisma.ticket.count({ where: { ...ticketWhere, status: 'IN_REVIEW' } }),
      DONE: doneTickets,
      BLOCKED: blockedTickets,
    };

    // Ticket distribution by priority
    const ticketsByPriority = {
      CRITICAL: await prisma.ticket.count({ where: { ...ticketWhere, priority: 'CRITICAL' } }),
      HIGH: await prisma.ticket.count({ where: { ...ticketWhere, priority: 'HIGH' } }),
      MEDIUM: await prisma.ticket.count({ where: { ...ticketWhere, priority: 'MEDIUM' } }),
      LOW: await prisma.ticket.count({ where: { ...ticketWhere, priority: 'LOW' } }),
    };

    // Recent activity
    const recentActivity = await prisma.ticketHistory.findMany({
      where: ticketWhere.assignedToId ? { ticket: { assignedToId: ticketWhere.assignedToId } } : {},
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
        status: { notIn: ['DONE'] },
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
        inProgressTickets,
        doneTickets,
        blockedTickets,
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

// GET /api/dashboard/velocity — Sprint velocity data
router.get('/velocity', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const where: any = { status: 'COMPLETED' };
    if (projectId) where.projectId = projectId;

    const completedSprints = await prisma.sprint.findMany({
      where,
      include: {
        sprintTickets: {
          include: { ticket: { select: { storyPoints: true, status: true } } },
        },
      },
      orderBy: { endDate: 'asc' },
      take: 10,
    });

    const velocity = completedSprints.map(sprint => ({
      sprintName: sprint.name,
      sprintId: sprint.id,
      completedPoints: sprint.sprintTickets
        .filter(st => st.ticket.status === 'DONE')
        .reduce((sum, st) => sum + (st.ticket.storyPoints || 0), 0),
      totalPoints: sprint.sprintTickets
        .reduce((sum, st) => sum + (st.pointsAtStart || 0), 0),
      completedTickets: sprint.sprintTickets.filter(st => st.ticket.status === 'DONE').length,
      totalTickets: sprint.sprintTickets.length,
    }));

    const avgVelocity = velocity.length > 0
      ? Math.round(velocity.reduce((sum, v) => sum + v.completedPoints, 0) / velocity.length)
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

    if (user.role === 'MANAGER') {
      const currentUser = await prisma.user.findUnique({ where: { id: user.userId } });
      if (currentUser?.teamId) memberWhere.teamId = currentUser.teamId;
    } else if (user.role === 'MEMBER') {
      memberWhere.id = user.userId;
    }

    const activeSprints = await prisma.sprint.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
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
          } : { status: { notIn: ['DONE', 'BACKLOG'] } },
          select: {
            status: true
          }
        }
      },
      orderBy: { fullName: 'asc' },
    });

    const workload = members.map(m => {
      const total = m.assignedTickets.length;
      const completed = m.assignedTickets.filter(t => t.status === 'DONE').length;
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
