// Reserved for Master Admin Panel
// Not accessible from company admin UI
import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';
import { getString } from '../utils/query';
import {
  sendAdminReplyNotification,
  sendTicketResolvedEmail,
} from '../emails/support-emails';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/support/tickets — all tickets across all orgs
router.get('/tickets', async (req: Request, res: Response) => {
  try {
    const { status, category, organizationId, page = '1', limit = '20' } = req.query;

    const where: any = {};
    if (status)         where.status         = getString(status);
    if (category)       where.category       = getString(category);
    if (organizationId) where.organizationId = getString(organizationId);

    const pageNum  = Math.max(1, parseInt(getString(page,  '1')));
    const limitNum = Math.min(100, Math.max(1, parseInt(getString(limit, '20'))));

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user:         { select: { id: true, fullName: true, email: true, avatar: true } },
          organization: { select: { id: true, name: true } },
          _count:       { select: { messages: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true, content: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip:  (pageNum - 1) * limitNum,
        take:  limitNum,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    res.json({ tickets, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('Admin list support tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/support/stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [statusCounts, categoryCounts, responseTimes] = await Promise.all([
      // Count by status
      prisma.supportTicket.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      // Count by category
      prisma.supportTicket.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
      // First admin reply time for response-time calculation
      prisma.supportMessage.findMany({
        where: { isAdminReply: true },
        select: {
          ticketId: true,
          createdAt: true,
          ticket: { select: { createdAt: true } },
        },
        orderBy: { createdAt: 'asc' },
        distinct: ['ticketId'],
      }),
    ]);

    const counts = { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
    for (const row of statusCounts) {
      const n = row._count.status;
      counts.total += n;
      if (row.status === 'OPEN')        counts.open       += n;
      if (row.status === 'IN_PROGRESS') counts.inProgress += n;
      if (row.status === 'RESOLVED')    counts.resolved   += n;
      if (row.status === 'CLOSED')      counts.closed     += n;
    }

    const avgResponseTimeHours = responseTimes.length === 0
      ? 0
      : responseTimes.reduce((sum, m) => {
          const ms = m.createdAt.getTime() - m.ticket.createdAt.getTime();
          return sum + ms / 3_600_000;
        }, 0) / responseTimes.length;

    const ticketsByCategory = categoryCounts.map(row => ({
      category: row.category,
      count: row._count.category,
    }));

    res.json({
      ...counts,
      avgResponseTimeHours: Math.round(avgResponseTimeHours * 10) / 10,
      ticketsByCategory,
    });
  } catch (error) {
    console.error('Admin support stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/support/tickets/:id/status
router.patch('/tickets/:id/status', async (req: Request, res: Response) => {
  try {
    const id = getString(req.params.id);
    const { status, expectedResolutionDate, priority } = req.body;

    if (!status) {
      res.status(400).json({ error: 'status is required' });
      return;
    }

    const now = new Date();
    const data: any = {
      status,
      ...(priority              && { priority }),
      ...(expectedResolutionDate && { expectedResolutionDate: new Date(expectedResolutionDate) }),
    };

    if (status === 'RESOLVED') {
      data.resolvedAt  = now;
      data.autoCloseAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (status === 'RESOLVED') {
      sendTicketResolvedEmail(ticket, ticket.user).catch(console.error);
    }

    res.json(ticket);
  } catch (error) {
    console.error('Update support ticket status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/support/tickets/:id/reply — admin reply
router.post('/tickets/:id/reply', async (req: Request, res: Response) => {
  try {
    const id = getString(req.params.id);
    const userId = req.user!.userId;
    const { content, attachmentUrl } = req.body;

    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    const message = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        authorId: userId,
        isAdminReply: true,
        content,
        attachmentUrl: attachmentUrl || null,
      },
      include: {
        author: { select: { id: true, fullName: true, avatar: true, role: true } },
      },
    });

    await prisma.supportTicket.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        ...(ticket.status === 'OPEN' && { status: 'IN_PROGRESS' }),
      },
    });

    sendAdminReplyNotification(ticket, message.content, ticket.user).catch(console.error);

    res.status(201).json(message);
  } catch (error) {
    console.error('Admin reply to support ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
