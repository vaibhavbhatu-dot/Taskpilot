import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

// GET /api/teams
router.get('/', async (_req: Request, res: Response) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        lead: { select: { id: true, fullName: true, avatar: true } },
        _count: { select: { members: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json(teams);
  } catch (error) {
    console.error('List teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/teams/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: {
        lead: { select: { id: true, fullName: true, email: true, avatar: true, designation: true } },
        members: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            designation: true,
            role: true,
            _count: { select: { assignedTickets: true } },
          },
        },
      },
    });

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    res.json(team);
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/teams — Admin/Manager only
router.post('/', requireRole('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const { name, leadId } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Team name is required' });
      return;
    }

    const team = await prisma.team.create({
      data: { name, leadId: leadId || null },
      include: {
        lead: { select: { id: true, fullName: true } },
      },
    });

    res.status(201).json(team);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Team name already exists' });
      return;
    }
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/teams/:id — Admin/Manager only
router.patch('/:id', requireRole('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const { name, leadId } = req.body;

    const team = await prisma.team.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(leadId !== undefined && { leadId }),
      },
      include: {
        lead: { select: { id: true, fullName: true } },
      },
    });

    res.json(team);
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/teams/:id — Admin only
router.delete('/:id', requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    await prisma.team.delete({ where: { id: req.params.id } });
    res.json({ message: 'Team deleted' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const TEAM_MEMBER_INCLUDE = {
  lead: { select: { id: true, fullName: true, email: true, avatar: true, designation: true } },
  members: {
    select: {
      id: true, fullName: true, email: true, avatar: true,
      designation: true, role: true,
      _count: { select: { assignedTickets: true } },
    },
  },
} as const;

// POST /api/teams/:id/members — Admin/Manager only
router.post('/:id/members', requireRole('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const teamId = req.params.id as string;
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({ error: 'userIds must be a non-empty array' });
      return;
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    await prisma.user.updateMany({
      where: { id: { in: userIds as string[] } },
      data: { teamId },
    });

    const updated = await prisma.team.findUnique({
      where: { id: teamId },
      include: TEAM_MEMBER_INCLUDE,
    });

    res.json(updated);
  } catch (error) {
    console.error('Add members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/teams/:id/members/:userId — Admin/Manager only
router.delete('/:id/members/:userId', requireRole('ADMIN', 'MANAGER'), async (req: Request, res: Response) => {
  try {
    const teamId = req.params.id as string;
    const userId = req.params.userId as string;

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    if (team.leadId === userId) {
      res.status(400).json({ error: 'Cannot remove team lead' });
      return;
    }

    const member = await prisma.user.findFirst({ where: { id: userId, teamId } });
    if (!member) {
      res.status(404).json({ error: 'User is not in this team' });
      return;
    }

    await prisma.user.update({ where: { id: userId }, data: { teamId: null } });

    const updated = await prisma.team.findUnique({
      where: { id: teamId },
      include: TEAM_MEMBER_INCLUDE,
    });

    res.json(updated);
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
