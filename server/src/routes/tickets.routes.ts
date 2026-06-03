import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB limit

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
          assignees: { include: { user: { select: { id: true, fullName: true, avatar: true } } }, orderBy: { assignedAt: 'asc' } },
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
        assignees: { include: { user: { select: { id: true, fullName: true, avatar: true, email: true } } }, orderBy: { assignedAt: 'asc' } },
        attachments: { where: { commentId: null }, include: { uploadedBy: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'asc' } },
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
    const { title, description, projectId, type, priority, assignedToId, assigneeIds, teamId, dueDate, labels, links } = req.body;

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
        assignedToId: (assigneeIds && assigneeIds[0]) || assignedToId || null,
        teamId: teamId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        labels: labels || [],
        links: links || [],
      },
      include: {
        project: { select: { id: true, name: true, key: true } },
        assignedTo: { select: { id: true, fullName: true, avatar: true } },
        assignees: { include: { user: { select: { id: true, fullName: true, avatar: true } } } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });

    // Create TicketAssignee records for all assignees
    const allAssigneeIds: string[] = assigneeIds?.length ? assigneeIds : (assignedToId ? [assignedToId] : []);
    if (allAssigneeIds.length > 0) {
      await prisma.ticketAssignee.createMany({
        data: allAssigneeIds.map((uid: string) => ({ ticketId: ticket.id, userId: uid })),
        skipDuplicates: true,
      });
      // Notify all assignees
      await prisma.notification.createMany({
        data: allAssigneeIds.map((uid: string) => ({
          userId: uid,
          type: 'TICKET_ASSIGNED' as const,
          title: 'New ticket assigned',
          message: `You have been assigned ticket ${ticketNumber}: ${title}`,
          link: `/tickets/${ticket.id}`,
        })),
        skipDuplicates: true,
      });
    }

    // Re-fetch to include assignees in response
    const created = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: {
        project: { select: { id: true, name: true, key: true } },
        assignedTo: { select: { id: true, fullName: true, avatar: true } },
        assignees: { include: { user: { select: { id: true, fullName: true, avatar: true } } }, orderBy: { assignedAt: 'asc' } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });

    res.status(201).json(created);
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
    const fieldsToTrack = ['title', 'description', 'type', 'priority', 'status', 'assignedToId', 'dueDate'];

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
    if (updates.labels !== undefined) data.labels = updates.labels;
    if (updates.links !== undefined) data.links = updates.links;
    if (updates.status !== undefined) {
      const completedStatuses = ['LIVE', 'NOT_REQUIRED'];
      if (completedStatuses.includes(updates.status) && !completedStatuses.includes(currentTicket.status)) {
        data.completedAt = new Date();
      } else if (!completedStatuses.includes(updates.status) && completedStatuses.includes(currentTicket.status)) {
        data.completedAt = null;
      }
    }

    const ticket = await prisma.$transaction(async (tx) => {
      if (historyEntries.length > 0) {
        await tx.ticketHistory.createMany({ data: historyEntries });
      }

      // Sync assignees if provided
      if (updates.assigneeIds !== undefined) {
        await tx.ticketAssignee.deleteMany({ where: { ticketId } });
        if (updates.assigneeIds.length > 0) {
          await tx.ticketAssignee.createMany({
            data: updates.assigneeIds.map((uid: string) => ({ ticketId, userId: uid })),
            skipDuplicates: true,
          });
          data.assignedToId = updates.assigneeIds[0] || null;
        } else {
          data.assignedToId = null;
        }
      }

      return tx.ticket.update({
        where: { id: ticketId },
        data,
        include: {
          project: { select: { id: true, name: true, key: true } },
          assignedTo: { select: { id: true, fullName: true, avatar: true } },
          assignees: { include: { user: { select: { id: true, fullName: true, avatar: true } } } },
          attachments: { where: { commentId: null }, include: { uploadedBy: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'asc' } },
          createdBy: { select: { id: true, fullName: true } },
        },
      });
    });

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
    const fieldsToTrack = ['type', 'priority', 'status', 'assignedToId', 'dueDate', 'teamId'];

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
    if (updates.status !== undefined) {
      data.status = updates.status;
      const completedStatuses = ['LIVE', 'NOT_REQUIRED'];
      if (completedStatuses.includes(updates.status)) {
        data.completedAt = new Date();
      } else {
        data.completedAt = null;
      }
    }
    if (updates.assignedToId !== undefined) data.assignedToId = updates.assignedToId || null;
    if (updates.teamId !== undefined) data.teamId = updates.teamId || null;
    if (updates.dueDate !== undefined) data.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;

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

// POST /api/tickets/:id/attachments — Upload file attachment
router.post('/:id/attachments', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const ticketId = req.params.id;
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      fs.unlinkSync(req.file.path);
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    const commentId = (req.body?.commentId || req.query?.commentId) as string | undefined;
    const attachment = await prisma.attachment.create({
      data: {
        ticketId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        size: req.file.size,
        mimeType: req.file.mimetype,
        uploadedById: req.user!.userId,
        ...(commentId ? { commentId } : {}),
      },
      include: { uploadedBy: { select: { id: true, fullName: true } } },
    });
    res.status(201).json(attachment);
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tickets/:id/attachments/:attachmentId
router.delete('/:id/attachments/:attachmentId', async (req: Request, res: Response) => {
  try {
    const attachment = await prisma.attachment.findUnique({ where: { id: req.params.attachmentId } });
    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }
    const filePath = path.join(uploadDir, attachment.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await prisma.attachment.delete({ where: { id: req.params.attachmentId } });
    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
