import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/tickets — List tickets (scoped by role)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, priority, type, projectId, assignedToId, sprintId, search, filters, page = '1', limit = '20' } = req.query;
    const user = req.user!;
    const where: any = {};

    // Role-based scoping
    if (user.role === 'MEMBER') {
      where.assignedToId = user.userId;
    } else if (user.role === 'MANAGER') {
      const currentUser = await prisma.user.findUnique({ where: { id: user.userId } });
      if (currentUser?.teamId) {
        where.team = { id: currentUser.teamId };
      }
    } else if (user.role === 'PROJECT_MANAGER') {
      const projects = await prisma.project.findMany({
        where: { leadId: user.userId },
        select: { id: true },
      });
      where.projectId = { in: projects.map(p => p.id) };
    }

    // Basic quick filters
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (projectId) where.projectId = projectId;
    if (assignedToId) where.assignedToId = assignedToId;
    
    // Text search
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { ticketNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Advanced JSON Filters
    if (filters) {
      try {
        const advancedFilters: { field: string; operator: string; value: string }[] = JSON.parse(filters as string);
        
        advancedFilters.forEach((f) => {
          if (!f.value) return; // Skip empty
          
          let condition: any = {};
          if (f.operator === 'equals') condition = f.value;
          if (f.operator === 'not_equals') condition = { not: f.value };
          
          // Special handling for nested relationship queries can go here if needed
          where[f.field] = condition;
        });
      } catch (err) {
        console.warn('Failed to parse advanced filters', err);
      }
    }

    // If sprintId filter is provided, only get tickets in that sprint
    if (sprintId) {
      const sprintTickets = await prisma.sprintTicket.findMany({
        where: { sprintId: sprintId as string },
        select: { ticketId: true },
      });
      where.id = { in: sprintTickets.map(st => st.ticketId) };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, key: true } },
          assignedTo: { select: { id: true, fullName: true, avatar: true } },
          createdBy: { select: { id: true, fullName: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('List tickets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tickets/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, key: true } },
        assignedTo: { select: { id: true, fullName: true, avatar: true, email: true } },
        createdBy: { select: { id: true, fullName: true, avatar: true } },
        team: { select: { id: true, name: true } },
        sprintTickets: {
          include: { sprint: { select: { id: true, name: true, status: true } } },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tickets
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, projectId, type, priority, assignedToId, teamId, dueDate, storyPoints, labels } = req.body;

    if (!title || !projectId) {
      res.status(400).json({ error: 'Title and project are required' });
      return;
    }

    // Get project key for auto-generating ticket number
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Count existing tickets in this project for auto-numbering
    const ticketCount = await prisma.ticket.count({ where: { projectId } });
    const ticketNumber = `${project.key}-${ticketCount + 1}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title,
        description: description || null,
        projectId,
        type: type || 'TASK',
        priority: priority || 'MEDIUM',
        status: 'BACKLOG',
        createdById: req.user!.userId,
        assignedToId: assignedToId || null,
        teamId: teamId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        storyPoints: storyPoints || null,
        labels: labels || [],
      },
      include: {
        project: { select: { id: true, name: true, key: true } },
        assignedTo: { select: { id: true, fullName: true, avatar: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });

    // Create notification for assignee
    if (assignedToId) {
      await prisma.notification.create({
        data: {
          userId: assignedToId,
          type: 'TICKET_ASSIGNED',
          title: 'New ticket assigned',
          message: `You have been assigned ticket ${ticketNumber}: ${title}`,
          link: `/tickets/${ticket.id}`,
        },
      });
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/tickets/:id — Update ticket with history logging
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const ticketId = req.params.id as string;
    const updates = req.body;
    const userId = req.user!.userId;

    // Get current ticket for comparison
    const currentTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!currentTicket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    // Track which fields changed for history
    const historyEntries: any[] = [];
    const fieldsToTrack = ['title', 'description', 'type', 'priority', 'status', 'assignedToId', 'dueDate', 'storyPoints'];

    for (const field of fieldsToTrack) {
      if (updates[field] !== undefined && updates[field] !== (currentTicket as any)[field]) {
        historyEntries.push({
          ticketId,
          changedById: userId,
          fieldChanged: field,
          oldValue: String((currentTicket as any)[field] ?? ''),
          newValue: String(updates[field] ?? ''),
        });
      }
    }

    // Build update data
    const data: any = {};
    if (updates.title !== undefined) data.title = updates.title;
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.type !== undefined) data.type = updates.type;
    if (updates.priority !== undefined) data.priority = updates.priority;
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.assignedToId !== undefined) data.assignedToId = updates.assignedToId || null;
    if (updates.teamId !== undefined) data.teamId = updates.teamId || null;
    if (updates.dueDate !== undefined) data.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    if (updates.storyPoints !== undefined) data.storyPoints = updates.storyPoints;
    if (updates.labels !== undefined) data.labels = updates.labels;

    const ticket = await prisma.$transaction(async (tx) => {
      // Create history entries
      if (historyEntries.length > 0) {
        await tx.ticketHistory.createMany({ data: historyEntries });
      }

      // Update ticket
      return tx.ticket.update({
        where: { id: ticketId },
        data,
        include: {
          project: { select: { id: true, name: true, key: true } },
          assignedTo: { select: { id: true, fullName: true, avatar: true } },
          createdBy: { select: { id: true, fullName: true } },
        },
      });
    });

    // Notify assignee on status change
    if (updates.status && updates.assignedToId !== userId && currentTicket.assignedToId) {
      await prisma.notification.create({
        data: {
          userId: currentTicket.assignedToId,
          type: 'TICKET_UPDATED',
          title: 'Ticket updated',
          message: `${currentTicket.ticketNumber} status changed to ${updates.status}`,
          link: `/tickets/${ticketId}`,
        },
      });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tickets/:id/history
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const ticketId = req.params.id as string;
    const history = await prisma.ticketHistory.findMany({
      where: { ticketId },
      include: {
        changedBy: { select: { id: true, fullName: true, avatar: true } },
      },
      orderBy: { changedAt: 'desc' },
    });

    res.json(history);
  } catch (error) {
    console.error('Get ticket history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tickets/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.ticket.delete({ where: { id } });
    res.json({ message: 'Ticket deleted' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tickets/bulk
router.put('/bulk', async (req: Request, res: Response) => {
  try {
    const { ticketIds, updates } = req.body;
    const userId = req.user!.userId;

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      res.status(400).json({ error: 'ticketIds array is required' });
      return;
    }

    // Get current tickets
    const currentTickets = await prisma.ticket.findMany({
      where: { id: { in: ticketIds } },
    });

    const historyEntries: any[] = [];
    const fieldsToTrack = ['type', 'priority', 'status', 'assignedToId', 'dueDate', 'storyPoints', 'teamId'];

    currentTickets.forEach(ticket => {
      for (const field of fieldsToTrack) {
        if (updates[field] !== undefined && updates[field] !== (ticket as any)[field]) {
          historyEntries.push({
            ticketId: ticket.id,
            changedById: userId,
            fieldChanged: field,
            oldValue: String((ticket as any)[field] ?? ''),
            newValue: String(updates[field] ?? ''),
          });
        }
      }
    });

    // Build update data
    const data: any = {};
    if (updates.type !== undefined) data.type = updates.type;
    if (updates.priority !== undefined) data.priority = updates.priority;
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.assignedToId !== undefined) data.assignedToId = updates.assignedToId || null;
    if (updates.teamId !== undefined) data.teamId = updates.teamId || null;
    if (updates.dueDate !== undefined) data.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    if (updates.storyPoints !== undefined) data.storyPoints = updates.storyPoints;

    await prisma.$transaction(async (tx) => {
      if (historyEntries.length > 0) {
        await tx.ticketHistory.createMany({ data: historyEntries });
      }
      await tx.ticket.updateMany({
        where: { id: { in: ticketIds } },
        data,
      });
    });

    res.json({ message: 'Tickets updated successfully' });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
