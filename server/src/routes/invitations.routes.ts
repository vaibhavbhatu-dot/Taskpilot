import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/rbac.middleware';
import { sendInvitationEmail } from '../utils/email';
import { getString } from '../utils/query';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// GET /api/invitations
router.get('/', async (req: Request, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const invitations = await prisma.invitation.findMany({
      where: { organizationId: orgId ?? undefined },
      include: {
        invitedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(invitations);
  } catch (error) {
    console.error('List invitations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/invitations — Send new invitation
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, role, managerId, teamId } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Check if pending invitation exists
    const existingInvite = await prisma.invitation.findFirst({
      where: { email, status: 'PENDING' },
    });
    if (existingInvite) {
      res.status(400).json({ error: 'Pending invitation already exists for this email' });
      return;
    }

    const orgId = req.user!.organizationId;

    // Enforce 2-admin cap on invitations too (scoped to this org)
    if (role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', ...(orgId && { organizationId: orgId }) },
      });
      const pendingAdminInvites = await prisma.invitation.count({
        where: { presetRole: 'ADMIN', status: 'PENDING', ...(orgId && { organizationId: orgId }) },
      });
      if (adminCount + pendingAdminInvites >= 2) {
        res.status(400).json({ error: 'Maximum of 2 admins allowed' });
        return;
      }
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        invitedById: req.user!.userId,
        organizationId: orgId || null,
        presetRole: role || 'MEMBER',
        presetManagerId: managerId || null,
        presetTeamId: teamId || null,
        status: 'PENDING',
        expiresAt,
      },
      include: {
        invitedBy: { select: { id: true, fullName: true } },
      },
    });

    // Send invitation email
    const inviter = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { fullName: true },
    });

    await sendInvitationEmail(email, inviter?.fullName || 'Admin', token);

    res.status(201).json(invitation);
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/invitations/:id — Revoke invitation
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = getString(req.params.id);
    await prisma.invitation.update({
      where: { id },
      data: { status: 'REVOKED' },
    });

    res.json({ message: 'Invitation revoked' });
  } catch (error) {
    console.error('Revoke invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
