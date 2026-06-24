import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../utils/prisma';
import { getString } from '../../utils/query';

const router = Router();

const SELECT = {
  id:          true,
  name:        true,
  email:       true,
  role:        true,
  status:      true,
  lastLoginAt: true,
  createdAt:   true,
  updatedAt:   true,
} as const;

function requireSuperAdmin(req: Request, res: Response): boolean {
  if (req.masterAdmin?.role !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Only Super Admins can manage admin accounts' });
    return false;
  }
  return true;
}

// GET /api/master-admin/admins  (SUPER_ADMIN only)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const admins = await prisma.masterAdmin.findMany({
      select:  SELECT,
      orderBy: { createdAt: 'asc' },
    });

    res.json(admins);
  } catch (err) {
    next(err);
  }
});

// POST /api/master-admin/admins  (SUPER_ADMIN only)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'name, email, password, and role are required' });
      return;
    }

    if (password.length < 10) {
      res.status(400).json({ error: 'Password must be at least 10 characters' });
      return;
    }

    const existing = await prisma.masterAdmin.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'An admin with that email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.masterAdmin.create({
      data:   { name, email, passwordHash, role },
      select: SELECT,
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId:    req.masterAdmin!.adminId,
        action:     'ADMIN_ACCOUNT_CREATED',
        targetType: 'MasterAdmin',
        targetId:   admin.id,
        details:    { email, role },
        ipAddress:  getString(req.ip) || null,
      },
    });

    res.status(201).json(admin);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/master-admin/admins/:id  (SUPER_ADMIN only)
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const id     = getString(req.params.id);
    const { role, status } = req.body;

    // Cannot modify own role
    if (role && id === req.masterAdmin!.adminId) {
      res.status(400).json({ error: 'You cannot modify your own role' });
      return;
    }

    const existing = await prisma.masterAdmin.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    const updated = await prisma.masterAdmin.update({
      where:  { id },
      data:   {
        ...(role   !== undefined && { role }),
        ...(status !== undefined && { status }),
      },
      select: SELECT,
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId:    req.masterAdmin!.adminId,
        action:     'ADMIN_ACCOUNT_UPDATED',
        targetType: 'MasterAdmin',
        targetId:   id,
        details:    { changes: { role, status } },
        ipAddress:  getString(req.ip) || null,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/master-admin/admins/:id  (SUPER_ADMIN only)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!requireSuperAdmin(req, res)) return;

    const id = getString(req.params.id);

    if (id === req.masterAdmin!.adminId) {
      res.status(400).json({ error: 'You cannot delete your own account' });
      return;
    }

    const existing = await prisma.masterAdmin.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    await prisma.masterAdmin.delete({ where: { id } });

    await prisma.adminAuditLog.create({
      data: {
        adminId:    req.masterAdmin!.adminId,
        action:     'ADMIN_ACCOUNT_DELETED',
        targetType: 'MasterAdmin',
        targetId:   id,
        ipAddress:  getString(req.ip) || null,
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
