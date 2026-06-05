import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { getString } from '../utils/query';
import { generateSupportTicketNumber } from '../utils/ticketNumber';
import {
  sendTicketConfirmation,
  sendAdminNewTicketAlert,
  sendAdminReplyNotification,
} from '../emails/support-emails';

const router = Router();

// POST /api/support/tickets — create a ticket
router.post('/tickets', authenticate, async (req: Request, res: Response) => {
  try {
    const { category, subject, description, attachmentUrl, metadata } = req.body;
    const userId = req.user!.userId;
    const organizationId = req.user!.organizationId;

    if (!category || !subject || !description) {
      res.status(400).json({ error: 'category, subject, and description are required' });
      return;
    }

    if (!organizationId) {
      res.status(400).json({ error: 'User must belong to an organization to submit a support ticket' });
      return;
    }

    const ticketNumber = await generateSupportTicketNumber(prisma);

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId,
        organizationId,
        category,
        subject,
        description,
        attachmentUrl: attachmentUrl || null,
        metadata: metadata || null,
        status: 'OPEN',
        priority: 'MEDIUM',
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    // Fire-and-forget emails — never block the response
    Promise.all([
      sendTicketConfirmation(ticket, ticket.user).catch(console.error),
      sendAdminNewTicketAlert(ticket, ticket.user, ticket.organization).catch(console.error),
    ]);

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/support/tickets — list own tickets
router.get('/tickets', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      include: {
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(tickets);
  } catch (error) {
    console.error('List support tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/support/tickets/:id — get a single ticket with messages
router.get('/tickets/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = getString(req.params.id);
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatar: true } },
        organization: { select: { id: true, name: true } },
        messages: {
          include: {
            author: { select: { id: true, fullName: true, avatar: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    if (!isAdmin && ticket.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(ticket);
  } catch (error) {
    console.error('Get support ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/support/tickets/:id/reply — add a message
router.post('/tickets/:id/reply', authenticate, async (req: Request, res: Response) => {
  try {
    const id = getString(req.params.id);
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';
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

    if (!isAdmin && ticket.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const message = await prisma.supportMessage.create({
      data: {
        ticketId: id,
        authorId: userId,
        isAdminReply: isAdmin,
        content,
        attachmentUrl: attachmentUrl || null,
      },
      include: {
        author: { select: { id: true, fullName: true, avatar: true, role: true } },
      },
    });

    // Bump updatedAt and optionally advance status
    const statusUpdate = isAdmin && ticket.status === 'OPEN' ? { status: 'IN_PROGRESS' as const } : {};
    await prisma.supportTicket.update({
      where: { id },
      data: { updatedAt: new Date(), ...statusUpdate },
    });

    // Email the ticket owner when an admin replies
    if (isAdmin) {
      sendAdminReplyNotification(ticket, message.content, ticket.user).catch(console.error);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Reply to support ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/support/tickets/:id/reopen — no auth, triggered from email link
router.get('/tickets/:id/reopen', async (req: Request, res: Response) => {
  const id = getString(req.params.id);
  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  try {
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (ticket && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED')) {
      await prisma.supportTicket.update({ where: { id }, data: { status: 'OPEN' } });
    }
  } catch (err) {
    console.error('Reopen ticket error:', err);
  }
  res.redirect(`${appUrl}/support/my-tickets`);
});

// GET /api/support/tickets/:id/feedback — no auth, triggered from email link
router.get('/tickets/:id/feedback', async (req: Request, res: Response) => {
  const id = getString(req.params.id);
  const v = getString(req.query.v);
  const appUrl = process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';
  try {
    if (v === 'no') {
      const ticket = await prisma.supportTicket.findUnique({ where: { id } });
      if (ticket && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED')) {
        await prisma.supportTicket.update({ where: { id }, data: { status: 'OPEN' } });
      }
    }
  } catch (err) {
    console.error('Feedback ticket error:', err);
  }
  res.redirect(`${appUrl}/support/my-tickets`);
});

export default router;
