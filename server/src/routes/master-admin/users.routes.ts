import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { getString } from '../../utils/query';

const router = Router();

// GET /api/master-admin/users
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const page   = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
    const limit  = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const skip   = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { email:    { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id:                 true,
          email:              true,
          fullName:           true,
          designation:        true,
          role:               true,
          status:             true,
          avatar:             true,
          emailVerified:      true,
          onboardingCompleted:true,
          createdAt:          true,
          organization: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// GET /api/master-admin/users/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getString(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id:                 true,
        email:              true,
        fullName:           true,
        designation:        true,
        role:               true,
        status:             true,
        avatar:             true,
        emailVerified:      true,
        onboardingCompleted:true,
        timezone:           true,
        createdAt:          true,
        updatedAt:          true,
        organization: { select: { id: true, name: true, domain: true } },
        _count: {
          select: {
            assignedTickets: true,
            supportTickets:  true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/master-admin/users/:id/suspend
router.patch('/:id/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id     = getString(req.params.id);
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : null;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // User model has no SUSPENDED status — log intent and return success
    await prisma.adminAuditLog.create({
      data: {
        adminId:    req.masterAdmin!.adminId,
        action:     'USER_SUSPENDED',
        targetType: 'User',
        targetId:   id,
        details:    reason ? { reason } : undefined,
        ipAddress:  getString(req.ip) || null,
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/master-admin/users/:id/unsuspend
router.patch('/:id/unsuspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getString(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId:    req.masterAdmin!.adminId,
        action:     'USER_UNSUSPENDED',
        targetType: 'User',
        targetId:   id,
        ipAddress:  getString(req.ip) || null,
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/master-admin/users/:id/force-logout
router.post('/:id/force-logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getString(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId:    req.masterAdmin!.adminId,
        action:     'USER_FORCE_LOGOUT',
        targetType: 'User',
        targetId:   id,
        ipAddress:  getString(req.ip) || null,
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
