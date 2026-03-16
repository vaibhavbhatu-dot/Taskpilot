import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/comments/:ticketId — List comments for a ticket (threaded)
router.get('/:ticketId', async (req: Request, res: Response) => {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        ticketId: req.params.ticketId,
        parentId: null, // Only top-level comments
      },
      include: {
        author: { select: { id: true, fullName: true, avatar: true } },
        replies: {
          include: {
            author: { select: { id: true, fullName: true, avatar: true } },
            replies: {
              include: {
                author: { select: { id: true, fullName: true, avatar: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(comments);
  } catch (error) {
    console.error('List comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/comments/:ticketId
router.post('/:ticketId', async (req: Request, res: Response) => {
  try {
    const { content, parentId } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Comment content is required' });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        ticketId: req.params.ticketId,
        authorId: req.user!.userId,
        content,
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, fullName: true, avatar: true } },
      },
    });

    // Notify ticket assignee and creator about the comment
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.ticketId },
      select: { assignedToId: true, createdById: true, ticketNumber: true, title: true },
    });

    if (ticket) {
      const usersToNotify = new Set<string>();
      if (ticket.assignedToId && ticket.assignedToId !== req.user!.userId) {
        usersToNotify.add(ticket.assignedToId);
      }
      if (ticket.createdById && ticket.createdById !== req.user!.userId) {
        usersToNotify.add(ticket.createdById);
      }

      if (usersToNotify.size > 0) {
        await prisma.notification.createMany({
          data: Array.from(usersToNotify).map(userId => ({
            userId,
            type: 'TICKET_COMMENTED',
            title: 'New comment',
            message: `New comment on ${ticket.ticketNumber}: ${ticket.title}`,
            link: `/tickets/${req.params.ticketId}`,
          }))
        });
      }
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/comments/:ticketId/:commentId
router.patch('/:ticketId/:commentId', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } });

    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    if (comment.authorId !== req.user!.userId) {
      res.status(403).json({ error: 'You can only edit your own comments' });
      return;
    }

    const updated = await prisma.comment.update({
      where: { id: req.params.commentId },
      data: { content },
      include: {
        author: { select: { id: true, fullName: true, avatar: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/comments/:ticketId/:commentId
router.delete('/:ticketId/:commentId', async (req: Request, res: Response) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } });

    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    if (comment.authorId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    await prisma.comment.delete({ where: { id: req.params.commentId } });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
