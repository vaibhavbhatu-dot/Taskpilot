import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';

const router = Router();

// GET /api/master-admin/dashboard
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalOrganisations,
      totalUsers,
      newSignups,
      openTickets,
      criticalTickets,
      recentSignupRows,
    ] = await Promise.all([
      // 1. All organisations
      prisma.organization.count(),

      // 2. All users
      prisma.user.count(),

      // 3. Users created in last 7 days
      prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),

      // 4. Open or in-progress support tickets
      prisma.supportTicket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),

      // 5. Critical tickets not yet closed
      prisma.supportTicket.count({
        where: { priority: 'CRITICAL', status: { not: 'CLOSED' } },
      }),

      // 6. Users grouped by day for the last 7 days
      prisma.user.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: { id: true },
      }),
    ]);

    // Build a full 7-day series so days with zero signups still appear
    const countsByDate: Record<string, number> = {};
    for (const row of recentSignupRows) {
      const day = row.createdAt.toISOString().slice(0, 10);
      countsByDate[day] = (countsByDate[day] ?? 0) + row._count.id;
    }

    const recentSignups = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
      const date = d.toISOString().slice(0, 10);
      return { date, count: countsByDate[date] ?? 0 };
    });

    res.json({
      totalOrgs:            totalOrganisations,
      activeOrgs:           totalOrganisations,
      totalUsers,
      newSignups7d:         newSignups,
      openTickets,
      criticalTickets,
      errorRate:            0,
      avgResponseTimeHours: 0,
      recentSignups,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
