import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { getString } from '../utils/query';

const router = Router();

router.use(authenticate);

// GET /api/projects
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const user = req.user!;
    const where: any = {};

    if (status) where.status = status;
    if (user.organizationId) where.organizationId = user.organizationId;

    // PM can only see their projects
    if (user.role === 'PROJECT_MANAGER') {
      where.leadId = user.userId;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        lead: { select: { id: true, fullName: true, avatar: true } },
        _count: { select: { tickets: true, sprints: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json(projects);
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = getString(req.params.id);
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        lead: { select: { id: true, fullName: true, email: true, avatar: true } },
        _count: { select: { tickets: true, sprints: true } },
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects — Admin/PM only
router.post('/', requireRole('ADMIN', 'PROJECT_MANAGER'), async (req: Request, res: Response) => {
  try {
    const { name, key, leadId } = req.body;

    if (!name || !key) {
      res.status(400).json({ error: 'Project name and key are required' });
      return;
    }

    // Validate key format (3-5 uppercase letters)
    if (!/^[A-Z]{2,6}$/.test(key)) {
      res.status(400).json({ error: 'Key must be 2-6 uppercase letters' });
      return;
    }

    const project = await prisma.project.create({
      data: {
        name,
        key: key.toUpperCase(),
        leadId: leadId || req.user!.userId,
        organizationId: req.user!.organizationId || null,
      },
      include: {
        lead: { select: { id: true, fullName: true } },
      },
    });

    res.status(201).json(project);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Project key already exists' });
      return;
    }
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/projects/:id
router.patch('/:id', requireRole('ADMIN', 'PROJECT_MANAGER'), async (req: Request, res: Response) => {
  try {
    const id = getString(req.params.id);
    const { name, leadId, status } = req.body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(leadId !== undefined && { leadId }),
        ...(status && { status }),
      },
      include: {
        lead: { select: { id: true, fullName: true } },
      },
    });

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/projects/:id — Admin only
router.delete('/:id', requireRole('ADMIN'), async (req: Request, res: Response) => {
  try {
    const id = getString(req.params.id);
    await prisma.project.delete({ where: { id } });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
