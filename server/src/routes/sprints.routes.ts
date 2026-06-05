import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { getString } from '../utils/query';

const router = Router();

router.use(authenticate);

// GET /api/sprints
router.get('/', async (req: Request, res: Response) => {
  try {
    const { projectId, status } = req.query;
    const where: any = {};

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (req.user!.organizationId) where.organizationId = req.user!.organizationId;

    const sprints = await prisma.sprint.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, key: true } },
        createdBy: { select: { id: true, fullName: true } },
        _count: { select: { sprintTickets: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(sprints);
  } catch (error) {
    console.error('List sprints error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sprints/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = getString(req.params.id);
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, key: true } },
        createdBy: { select: { id: true, fullName: true } },
        sprintTickets: {
          include: {
            ticket: {
              include: {
                assignedTo: { select: { id: true, fullName: true, avatar: true } },
                project: { select: { id: true, name: true, key: true } },
              },
            },
          },
        },
      },
    });

    if (!sprint) {
      res.status(404).json({ error: 'Sprint not found' });
      return;
    }

    res.json(sprint);
  } catch (error) {
    console.error('Get sprint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sprints
router.post('/', requireRole('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), async (req: Request, res: Response) => {
  try {
    const { name, projectId, startDate, endDate, goal } = req.body;

    if (!name || !projectId) {
      res.status(400).json({ error: 'Sprint name and project are required' });
      return;
    }

    const sprint = await prisma.sprint.create({
      data: {
        name,
        projectId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        goal: goal || null,
        status: 'PLANNED',
        createdById: req.user!.userId,
        organizationId: req.user!.organizationId || null,
      },
      include: {
        project: { select: { id: true, name: true, key: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });

    res.status(201).json(sprint);
  } catch (error) {
    console.error('Create sprint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sprints/:id/start — Start a sprint (enforce only 1 active per project)
router.post('/:id/start', requireRole('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), async (req: Request, res: Response) => {
  try {
    const id = getString(req.params.id);
    const sprint = await prisma.sprint.findUnique({
      where: { id },
    });

    if (!sprint) {
      res.status(404).json({ error: 'Sprint not found' });
      return;
    }

    if (sprint.status !== 'PLANNED') {
      res.status(400).json({ error: 'Only planned sprints can be started' });
      return;
    }

    // Check no other active sprint in same project
    const activeSprint = await prisma.sprint.findFirst({
      where: { projectId: sprint.projectId, status: 'ACTIVE' },
    });

    if (activeSprint) {
      res.status(400).json({
        error: `Sprint "${activeSprint.name}" is already active in this project. Complete it first.`,
      });
      return;
    }

    const { startDate, endDate } = req.body || {};

    const updated = await prisma.sprint.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default: 2 weeks
      },
      include: {
        project: { select: { id: true, name: true } },
        sprintTickets: {
          include: { ticket: { select: { assignedToId: true } } }
        }
      },
    });

    const assignees = new Set<string>();
    updated.sprintTickets.forEach(st => {
      if (st.ticket.assignedToId) assignees.add(st.ticket.assignedToId);
    });

    if (assignees.size > 0) {
      await prisma.notification.createMany({
        data: Array.from(assignees).map(userId => ({
          userId,
          type: 'SPRINT_STARTED',
          title: 'Sprint Started',
          message: `Sprint "${updated.name}" has started in ${updated.project.name}.`,
          link: '/dashboard/sprints/active'
        }))
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Start sprint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sprints/:id/complete — Complete a sprint with carryover
router.post('/:id/complete', requireRole('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), async (req: Request, res: Response) => {
  try {
    const id = getString(req.params.id);
    const { carryOverToSprintId } = req.body; // optional: move incomplete tickets to this sprint, or null = move to backlog

    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        sprintTickets: {
          include: { ticket: true },
        },
      },
    });

    if (!sprint) {
      res.status(404).json({ error: 'Sprint not found' });
      return;
    }

    if (sprint.status !== 'ACTIVE') {
      res.status(400).json({ error: 'Only active sprints can be completed' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Complete the sprint
      await tx.sprint.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });

      // Find incomplete tickets
      const incompleteTicketIds = sprint.sprintTickets
        .filter(st => !['LIVE','NOT_REQUIRED'].includes(st.ticket.status))
        .map(st => st.ticketId);

      if (incompleteTicketIds.length > 0 && carryOverToSprintId) {
        // Move to next sprint
        const sprintTicketData = incompleteTicketIds.map(ticketId => ({
          sprintId: carryOverToSprintId,
          ticketId,
          statusAtStart: sprint.sprintTickets.find(st => st.ticketId === ticketId)!.ticket.status,
        }));

        await tx.sprintTicket.createMany({ data: sprintTicketData });
      } else if (incompleteTicketIds.length > 0) {
        // Move back to backlog
        await tx.ticket.updateMany({
          where: { id: { in: incompleteTicketIds } },
          data: { status: 'BACKLOG' },
        });
      }
    });

    const assignees = new Set<string>();
    sprint.sprintTickets.forEach(st => {
      if (st.ticket.assignedToId) assignees.add(st.ticket.assignedToId);
    });

    if (assignees.size > 0) {
      await prisma.notification.createMany({
        data: Array.from(assignees).map(userId => ({
          userId,
          type: 'SPRINT_COMPLETED',
          title: 'Sprint Completed',
          message: `Sprint "${sprint.name}" has been completed.`,
          link: '/dashboard/sprints/reports'
        }))
      });
    }

    res.json({ message: 'Sprint completed', incompleteCount: sprint.sprintTickets.filter(st => !['LIVE','NOT_REQUIRED'].includes(st.ticket.status)).length });
  } catch (error) {
    console.error('Complete sprint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sprints/:id/tickets — Add tickets to sprint
router.post('/:id/tickets', requireRole('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), async (req: Request, res: Response) => {
  try {
    const id = getString(req.params.id);
    const { ticketIds } = req.body;

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      res.status(400).json({ error: 'Ticket IDs are required' });
      return;
    }

    const sprint = await prisma.sprint.findUnique({
      where: { id },
    });

    if (!sprint) {
      res.status(404).json({ error: 'Sprint not found' });
      return;
    }

    // Get tickets to capture their current state
    const tickets = await prisma.ticket.findMany({
      where: { id: { in: ticketIds } },
    });

    const sprintTicketData = tickets.map(ticket => ({
      sprintId: id,
      ticketId: ticket.id,
      statusAtStart: ticket.status,
    }));

    await prisma.sprintTicket.createMany({
      data: sprintTicketData,
      skipDuplicates: true,
    });

    // Move tickets to TODO if in BACKLOG
    await prisma.ticket.updateMany({
      where: {
        id: { in: ticketIds },
        status: 'BACKLOG',
      },
      data: { status: 'REQUIREMENTS' },
    });

    res.json({ message: `${tickets.length} tickets added to sprint` });
  } catch (error) {
    console.error('Add tickets to sprint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/sprints/:id/tickets/:ticketId — Remove ticket from sprint
router.delete('/:id/tickets/:ticketId', requireRole('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), async (req: Request, res: Response) => {
  try {
    const id = getString(req.params.id);
    const ticketId = getString(req.params.ticketId);
    await prisma.sprintTicket.deleteMany({
      where: {
        sprintId: id,
        ticketId,
      },
    });

    res.json({ message: 'Ticket removed from sprint' });
  } catch (error) {
    console.error('Remove ticket from sprint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/sprints/:id
router.patch('/:id', requireRole('ADMIN', 'MANAGER', 'PROJECT_MANAGER'), async (req: Request, res: Response) => {
  try {
    const id = getString(req.params.id);
    const { name, goal, startDate, endDate } = req.body;

    const sprint = await prisma.sprint.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(goal !== undefined && { goal }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
      include: {
        project: { select: { id: true, name: true, key: true } },
      },
    });

    res.json(sprint);
  } catch (error) {
    console.error('Update sprint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
