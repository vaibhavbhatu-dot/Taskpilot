import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = Router();

const TEMPLATES: Record<string, {
  projectName: string;
  projectKey: string;
  tickets: { title: string; type: string; priority: string; status: string }[];
}> = {
  software: {
    projectName: 'Product Development',
    projectKey: 'PROD',
    tickets: [
      { title: 'Set up project repository',        type: 'TASK',    priority: 'HIGH',   status: 'REQUIREMENTS' },
      { title: 'Design system and component library', type: 'TASK',  priority: 'MEDIUM', status: 'REQUIREMENTS' },
      { title: 'User authentication flow',          type: 'FEATURE', priority: 'HIGH',   status: 'REQUIREMENTS' },
      { title: 'Database schema design',            type: 'TASK',    priority: 'HIGH',   status: 'REQUIREMENTS' },
      { title: 'API endpoint documentation',        type: 'TASK',    priority: 'MEDIUM', status: 'BACKLOG' },
      { title: 'Write unit tests for core modules', type: 'TASK',    priority: 'MEDIUM', status: 'BACKLOG' },
    ],
  },
  design: {
    projectName: 'Design Projects',
    projectKey: 'DSGN',
    tickets: [
      { title: 'Brand identity and logo design',  type: 'TASK', priority: 'HIGH',   status: 'REQUIREMENTS' },
      { title: 'User research and personas',       type: 'TASK', priority: 'HIGH',   status: 'REQUIREMENTS' },
      { title: 'Wireframes for main flows',        type: 'TASK', priority: 'MEDIUM', status: 'REQUIREMENTS' },
      { title: 'Design system tokens',             type: 'TASK', priority: 'MEDIUM', status: 'BACKLOG' },
      { title: 'Usability testing session',        type: 'TASK', priority: 'LOW',    status: 'BACKLOG' },
    ],
  },
  marketing: {
    projectName: 'Marketing Campaigns',
    projectKey: 'MKT',
    tickets: [
      { title: 'Q3 content calendar planning', type: 'TASK', priority: 'HIGH',   status: 'REQUIREMENTS' },
      { title: 'Social media strategy',         type: 'TASK', priority: 'HIGH',   status: 'REQUIREMENTS' },
      { title: 'Email campaign setup',          type: 'TASK', priority: 'MEDIUM', status: 'REQUIREMENTS' },
      { title: 'SEO keyword research',          type: 'TASK', priority: 'MEDIUM', status: 'BACKLOG' },
      { title: 'Landing page copy',             type: 'TASK', priority: 'LOW',    status: 'BACKLOG' },
    ],
  },
  other: {
    projectName: 'Team Projects',
    projectKey: 'TEAM',
    tickets: [
      { title: 'Define project goals and KPIs',          type: 'TASK', priority: 'HIGH',   status: 'REQUIREMENTS' },
      { title: 'Set up team communication channels',     type: 'TASK', priority: 'HIGH',   status: 'REQUIREMENTS' },
      { title: 'Create project timeline',                type: 'TASK', priority: 'MEDIUM', status: 'REQUIREMENTS' },
      { title: 'Stakeholder review meeting',             type: 'TASK', priority: 'MEDIUM', status: 'BACKLOG' },
    ],
  },
};

// POST /api/onboarding/generate
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { teamType, workStyle } = req.body;
    const userId = req.user!.userId;

    const template = TEMPLATES[teamType] ?? TEMPLATES.other;

    // Make project key unique within this org — check for collision and append suffix
    const orgId = req.user!.organizationId || null;
    let projectKey = template.projectKey;
    const existing = await prisma.project.findFirst({ where: { key: projectKey, organizationId: orgId } });
    if (existing) {
      projectKey = `${template.projectKey}-${userId.slice(-4).toUpperCase()}`;
      const still = await prisma.project.findFirst({ where: { key: projectKey, organizationId: orgId } });
      if (still) projectKey = `${template.projectKey}-${Date.now().toString(36).toUpperCase()}`;
    }

    // 1. Create project
    const project = await prisma.project.create({
      data: {
        name: template.projectName,
        key: projectKey,
        leadId: userId,
        status: 'ACTIVE',
        organizationId: req.user!.organizationId || null,
      },
    });

    // 2. If scrum → create an empty Sprint 1 (no sample tickets)
    let sprintCreated = false;
    if (workStyle === 'scrum') {
      const now = new Date();
      const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      await prisma.sprint.create({
        data: {
          name: 'Sprint 1',
          goal: 'Get the foundation in place',
          startDate: now,
          endDate: twoWeeks,
          status: 'ACTIVE',
          projectId: project.id,
          createdById: userId,
          organizationId: req.user!.organizationId || null,
        },
      });
      sprintCreated = true;
    }

    // 3. Mark onboarding complete
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });

    res.json({
      success: true,
      project: { id: project.id, name: project.name },
      ticketsCreated: 0,
      sprintCreated,
      message: 'Workspace created successfully',
    });
  } catch (error) {
    console.error('Generate workspace error:', error);
    res.status(500).json({ message: 'Failed to generate workspace' });
  }
});

export default router;
