import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/search?q=query
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || (q as string).trim().length < 2) {
      res.json({ tickets: [], users: [] });
      return;
    }

    const query = (q as string).trim();
    const user = req.user!;

    // Search tickets (role-scoped)
    const ticketWhere: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { ticketNumber: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    // Apply role scoping
    if (user.role === 'MEMBER') {
      ticketWhere.assignedToId = user.userId;
    } else if (user.role === 'MANAGER') {
      const currentUser = await prisma.user.findUnique({ where: { id: user.userId } });
      if (currentUser?.teamId) ticketWhere.teamId = currentUser.teamId;
    } else if (user.role === 'PROJECT_MANAGER') {
      const projects = await prisma.project.findMany({
        where: { leadId: user.userId },
        select: { id: true },
      });
      ticketWhere.projectId = { in: projects.map(p => p.id) };
    }

    const tickets = await prisma.ticket.findMany({
      where: ticketWhere,
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        status: true,
        priority: true,
        assignedTo: { select: { id: true, fullName: true, avatar: true } },
        project: { select: { id: true, name: true, key: true } },
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    });

    // Search users (Admins and managers can search all, others limited)
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatar: true,
        designation: true,
        role: true,
        team: { select: { name: true } }
      },
      take: 5,
      orderBy: { fullName: 'asc' },
    });

    // Search projects
    const projects = await prisma.project.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { key: { contains: query, mode: 'insensitive' } },
        ]
      },
      select: {
        id: true,
        name: true,
        key: true,
      },
      take: 5,
      orderBy: { name: 'asc' }
    });

    res.json({ tickets, users, projects });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
