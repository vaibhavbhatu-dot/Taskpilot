import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/my-work — tickets for current user or specified user, by tab
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { tab, userId, teamId } = req.query;

    if (!tab || !['due', 'today'].includes(tab as string)) {
      res.status(400).json({ error: 'tab param is required: due | today' });
      return;
    }

    // Determine target user
    let targetUserId: string | null = null;
    let showAllUsers = false;

    if (userId && userId !== user.userId) {
      // Viewing another user's tasks
      if (user.role === 'ADMIN') {
        targetUserId = userId as string;
      } else if (user.role === 'MANAGER') {
        const currentUser = await prisma.user.findUnique({ where: { id: user.userId } });
        const targetUser = await prisma.user.findUnique({ where: { id: userId as string } });
        if (!currentUser?.teamId || !targetUser?.teamId || currentUser.teamId !== targetUser.teamId) {
          res.status(403).json({ error: 'Forbidden' });
          return;
        }
        targetUserId = userId as string;
      } else {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
    } else if (!userId) {
      // No userId specified
      if (user.role === 'ADMIN' && !teamId) {
        // Admin with no filters: show ALL users' tasks
        showAllUsers = true;
      } else if (user.role === 'MANAGER' && !teamId) {
        // Manager with no filters: show their team's tasks
        const currentUser = await prisma.user.findUnique({ where: { id: user.userId } });
        if (currentUser?.teamId) {
          showAllUsers = true; // will be scoped to team below
        } else {
          targetUserId = user.userId;
        }
      } else {
        // MEMBER / PM or specific teamId selected: show own tasks
        targetUserId = user.userId;
      }
    } else {
      // userId === current user
      targetUserId = user.userId;
    }

    // Build where clause
    const where: any = {
      status: { notIn: ['LIVE', 'NOT_REQUIRED'] },
      ...(user.organizationId && { project: { organizationId: user.organizationId } }),
    };

    if (teamId && !userId) {
      // Team filter selected with "All Members"
      if (user.role === 'ADMIN') {
        where.assignedTo = { teamId: teamId as string };
      } else if (user.role === 'MANAGER') {
        const currentUser = await prisma.user.findUnique({ where: { id: user.userId } });
        if (currentUser?.teamId === teamId) {
          where.assignedTo = { teamId: teamId as string };
        } else {
          res.status(403).json({ error: 'Forbidden' });
          return;
        }
      }
      where.assignedToId = { not: null };
    } else if (showAllUsers) {
      // Admin: all assigned tickets; Manager: scoped to team
      where.assignedToId = { not: null };
      if (user.role === 'MANAGER') {
        const currentUser = await prisma.user.findUnique({ where: { id: user.userId } });
        if (currentUser?.teamId) {
          where.assignedTo = { teamId: currentUser.teamId };
        }
      }
    } else if (targetUserId) {
      where.assignedToId = targetUserId;
    }

    // Date filters using server UTC dates
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const tomorrowStart = new Date(todayStart.getTime() + 86400000);

    let orderBy: any;

    if (tab === 'due') {
      where.dueDate = { lt: todayStart };
      orderBy = { dueDate: 'asc' };
    } else {
      // today
      where.dueDate = { gte: todayStart, lt: tomorrowStart };
      orderBy = [{ priority: 'asc' }, { title: 'asc' }];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, key: true } },
        assignedTo: { select: { id: true, fullName: true, avatar: true, designation: true, role: true, teamId: true } },
        sprintTickets: {
          include: { sprint: { select: { id: true, name: true } } },
          take: 1,
        },
      },
      orderBy,
    });

    // Transform response
    const result = tickets.map(t => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      title: t.title,
      status: t.status,
      priority: t.priority,
      type: t.type,
      dueDate: t.dueDate,
      labels: t.labels,
      project: t.project,
      assignee: t.assignedTo ? {
        id: t.assignedTo.id,
        fullName: t.assignedTo.fullName,
        avatar: t.assignedTo.avatar,
        designation: t.assignedTo.designation,
        role: t.assignedTo.role,
        teamId: t.assignedTo.teamId,
      } : null,
      sprint: t.sprintTickets[0]?.sprint || null,
    }));

    // Get counts for both tabs
    const baseWhere = { ...where };
    delete baseWhere.dueDate;

    const [dueCountFixed, todayCountFixed] = await Promise.all([
      prisma.ticket.count({ where: { ...baseWhere, dueDate: { lt: todayStart } } }),
      prisma.ticket.count({ where: { ...baseWhere, dueDate: { gte: todayStart, lt: tomorrowStart } } }),
    ]);

    res.json({
      tickets: result,
      counts: {
        due: dueCountFixed,
        today: todayCountFixed,
      },
    });
  } catch (error) {
    console.error('My work error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/my-work/teams
router.get('/teams', async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (user.role === 'ADMIN') {
      const teams = await prisma.team.findMany({
        where: user.organizationId ? { organizationId: user.organizationId } : {},
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      res.json(teams);
      return;
    }

    if (user.role === 'MANAGER') {
      const currentUser = await prisma.user.findUnique({ where: { id: user.userId } });
      if (currentUser?.teamId) {
        const team = await prisma.team.findUnique({
          where: { id: currentUser.teamId },
          select: { id: true, name: true },
        });
        res.json(team ? [team] : []);
      } else {
        res.json([]);
      }
      return;
    }

    res.status(403).json({ error: 'Forbidden' });
  } catch (error) {
    console.error('My work teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/my-work/members
router.get('/members', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { teamId } = req.query;

    if (user.role === 'ADMIN') {
      const where: any = { status: 'ACTIVE' };
      if (user.organizationId) where.organizationId = user.organizationId;
      if (teamId) where.teamId = teamId;

      const members = await prisma.user.findMany({
        where,
        select: { id: true, fullName: true, avatar: true, designation: true, role: true },
        orderBy: { fullName: 'asc' },
      });
      res.json(members);
      return;
    }

    if (user.role === 'MANAGER') {
      const currentUser = await prisma.user.findUnique({ where: { id: user.userId } });
      if (currentUser?.teamId) {
        const members = await prisma.user.findMany({
          where: { teamId: currentUser.teamId, status: 'ACTIVE' },
          select: { id: true, fullName: true, avatar: true, designation: true, role: true },
          orderBy: { fullName: 'asc' },
        });
        res.json(members);
      } else {
        res.json([]);
      }
      return;
    }

    res.status(403).json({ error: 'Forbidden' });
  } catch (error) {
    console.error('My work members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
