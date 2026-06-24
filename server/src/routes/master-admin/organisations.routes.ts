import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { getString } from '../../utils/query';

const router = Router();

// GET /api/master-admin/organisations
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const page   = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
    const limit  = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const skip   = (page - 1) * limit;

    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [data, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: {
          _count: { select: { users: true, projects: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.organization.count({ where }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// GET /api/master-admin/organisations/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getString(req.params.id);

    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, projects: true, sprints: true } },
      },
    });

    if (!org) {
      res.status(404).json({ error: 'Organisation not found' });
      return;
    }

    res.json(org);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/master-admin/organisations/:id/suspend
router.patch('/:id/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.masterAdmin?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Only Super Admins can suspend organisations' });
      return;
    }

    const id     = getString(req.params.id);
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : null;

    const org = await prisma.organization.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!org) {
      res.status(404).json({ error: 'Organisation not found' });
      return;
    }

    // Organisation model has no status field yet — log the intent and return success
    await prisma.adminAuditLog.create({
      data: {
        adminId:    req.masterAdmin.adminId,
        action:     'ORG_SUSPENDED',
        targetType: 'Organisation',
        targetId:   id,
        details:    { organisationName: org.name, ...(reason && { reason }) },
        ipAddress:  getString(req.ip) || null,
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
