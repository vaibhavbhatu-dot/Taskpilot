import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { getString } from '../../utils/query';

const router = Router();

const EMAIL_TEMPLATES = [
  {
    key:         'ticket_confirmation',
    name:        'Ticket Confirmation',
    description: 'Sent to users when their support ticket is successfully submitted',
  },
  {
    key:         'admin_new_ticket_alert',
    name:        'New Ticket Alert',
    description: 'Notifies admins when a new support ticket is opened',
  },
  {
    key:         'admin_reply_notification',
    name:        'Admin Reply Notification',
    description: 'Sent to the user when an admin replies to their ticket',
  },
  {
    key:         'ticket_resolved',
    name:        'Ticket Resolved',
    description: 'Sent when a ticket status changes to RESOLVED',
  },
  {
    key:         'auto_close_warning',
    name:        'Auto-Close Warning',
    description: '2-day warning sent before an inactive ticket is automatically closed',
  },
  {
    key:         'invite_user',
    name:        'Team Invitation',
    description: 'Sent when an admin invites a new member to an organisation',
  },
  {
    key:         'verify_email',
    name:        'Email Verification',
    description: 'OTP code email sent during sign-up to verify the user\'s email address',
  },
];

// GET /api/master-admin/config/feature-flags
router.get('/feature-flags', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const flags = await prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
    res.json({ data: flags });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/master-admin/config/feature-flags/:id  (SUPER_ADMIN only)
router.patch('/feature-flags/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.masterAdmin?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Only Super Admins can modify feature flags' });
      return;
    }

    const id           = getString(req.params.id);
    const defaultValue = req.body.defaultValue;

    if (typeof defaultValue !== 'boolean') {
      res.status(400).json({ error: 'defaultValue must be a boolean' });
      return;
    }

    const flag = await prisma.featureFlag.findUnique({ where: { id } });
    if (!flag) {
      res.status(404).json({ error: 'Feature flag not found' });
      return;
    }

    const updated = await prisma.featureFlag.update({
      where: { id },
      data:  { defaultValue },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId:    req.masterAdmin!.adminId,
        action:     'FEATURE_FLAG_CHANGED',
        targetType: 'FeatureFlag',
        targetId:   id,
        details:    { key: flag.key, previousValue: flag.defaultValue, newValue: defaultValue },
        ipAddress:  getString(req.ip) || null,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/master-admin/config/email-templates
router.get('/email-templates', (_req: Request, res: Response) => {
  res.json({ data: EMAIL_TEMPLATES });
});

export default router;
