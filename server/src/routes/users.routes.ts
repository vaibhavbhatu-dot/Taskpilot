import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

// PATCH /api/users/profile — Self-service profile update (designation, role, timezone)
router.patch('/profile', async (req: Request, res: Response) => {
  try {
    const { designation, role, timezone } = req.body;
    const userId = req.user!.userId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(designation !== undefined && { designation }),
        ...(role && { role }),
        ...(timezone !== undefined && { timezone }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        designation: true,
        role: true,
        avatar: true,
        teamId: true,
        managerId: true,
        status: true,
        timezone: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users — List users (scoped by role)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { role, search, teamId } = req.query;
    const user = req.user!;

    const where: any = { status: 'ACTIVE' };

    // Org isolation
    if (user.organizationId) where.organizationId = user.organizationId;

    // Role-based scoping
    if (user.role === 'MANAGER') {
      const currentUser = await prisma.user.findUnique({ where: { id: user.userId } });
      where.teamId = currentUser?.teamId;
    } else if (user.role === 'MEMBER') {
      where.id = user.userId;
    }

    if (role) where.role = role;
    if (teamId) where.teamId = teamId;
    if (search) {
      where.OR = [
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        designation: true,
        role: true,
        avatar: true,
        teamId: true,
        managerId: true,
        status: true,
        team: { select: { id: true, name: true } },
        manager: { select: { id: true, fullName: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    res.json(users);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        designation: true,
        role: true,
        avatar: true,
        teamId: true,
        managerId: true,
        status: true,
        createdAt: true,
        team: { select: { id: true, name: true } },
        manager: { select: { id: true, fullName: true } },
        _count: {
          select: {
            assignedTickets: true,
            createdTickets: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/users/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { fullName, designation, avatar, teamId, managerId, status } = req.body;
    const currentUser = req.user!;

    // Only admin or self can update
    if (currentUser.role !== 'ADMIN' && currentUser.userId !== req.params.id) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(fullName && { fullName }),
        ...(designation !== undefined && { designation }),
        ...(avatar !== undefined && { avatar }),
        ...(teamId !== undefined && { teamId }),
        ...(managerId !== undefined && { managerId }),
        // Admins can update status (e.g. deactivate/reactivate)
        ...(currentUser.role === 'ADMIN' && status && { status }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        designation: true,
        role: true,
        avatar: true,
        teamId: true,
        managerId: true,
        status: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:id — Admin only, soft-delete (sets status INACTIVE, clears team)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;
    if (currentUser.userId === req.params.id) {
      res.status(400).json({ error: 'You cannot remove yourself' });
      return;
    }
    await prisma.user.update({
      where: { id: req.params.id },
      data: { status: 'INACTIVE', teamId: null, managerId: null },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/users/:id/role — Admin only, enforces 2-admin cap
router.patch('/:id/role', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;

    if (!role) {
      res.status(400).json({ error: 'Role is required' });
      return;
    }

    // Enforce 2-admin maximum
    if (role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });

      if (targetUser?.role !== 'ADMIN' && adminCount >= 2) {
        res.status(400).json({ error: 'Maximum of 2 admins allowed in the system' });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
