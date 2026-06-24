import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';

const router = Router();

// GET /api/master-admin/audit-logs
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page   = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
    const limit  = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '30'), 10)));
    const skip   = (page - 1) * limit;
    const action = typeof req.query.action === 'string' ? req.query.action.trim() : undefined;

    const where = action
      ? { action: { contains: action, mode: 'insensitive' as const } }
      : {};

    const [data, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) {
    next(err);
  }
});

export default router;
