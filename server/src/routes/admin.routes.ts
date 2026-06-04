import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Ensure admin only
const requireAdmin = (req: Request, res: Response, next: Function) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.use(requireAdmin);

// GET /api/admin/activity — Global ticket history
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const orgId = req.user!.organizationId;
    const orgFilter = orgId
      ? { ticket: { project: { organizationId: orgId } } }
      : {};

    const [activities, total] = await Promise.all([
      prisma.ticketHistory.findMany({
        where: orgFilter,
        include: {
          changedBy: { select: { id: true, fullName: true, avatar: true } },
          ticket: { select: { id: true, ticketNumber: true, title: true } },
        },
        orderBy: { changedAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.ticketHistory.count({ where: orgFilter }),
    ]);

    res.json({
      activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
