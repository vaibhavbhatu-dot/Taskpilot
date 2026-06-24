import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../utils/prisma';
import { getString } from '../../utils/query';

const router = Router();

function toAdminDto(a: { id: string; email: string; name: string; role: string; status: string; lastLoginAt: Date | null; createdAt: Date }) {
  return {
    id:          a.id,
    email:       a.email,
    fullName:    a.name,
    role:        a.role,
    status:      a.status,
    avatar:      null,
    lastLoginAt: a.lastLoginAt,
    createdAt:   a.createdAt,
  };
}

// GET /api/master-admin/admins
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const admins = await prisma.masterAdmin.findMany({
      select: { id: true, email: true, name: true, role: true, status: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(admins.map(toAdminDto));
  } catch (err) {
    next(err);
  }
});

// POST /api/master-admin/admins
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.masterAdmin?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Only Super Admins can create admin accounts' });
      return;
    }

    const { email, fullName, role, password } = req.body;

    if (!email || !fullName || !role || !password) {
      res.status(400).json({ error: 'email, fullName, role, and password are required' });
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

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.masterAdmin.create({
      data: { email, name: fullName, role, passwordHash },
      select: { id: true, email: true, name: true, role: true, status: true, lastLoginAt: true, createdAt: true },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId:    req.masterAdmin!.adminId,
        action:     'ADMIN_CREATED',
        targetType: 'MasterAdmin',
        targetId:   admin.id,
        details:    { email, role },
        ipAddress:  getString(req.ip) || null,
      },
    });

    res.status(201).json(toAdminDto(admin));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/master-admin/admins/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.masterAdmin?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Only Super Admins can update admin accounts' });
      return;
    }

    const id = getString(req.params.id);
    const { role, fullName } = req.body;

    const admin = await prisma.masterAdmin.findUnique({ where: { id }, select: { id: true } });
    if (!admin) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    const updated = await prisma.masterAdmin.update({
      where: { id },
      data: {
        ...(role     && { role }),
        ...(fullName && { name: fullName }),
      },
      select: { id: true, email: true, name: true, role: true, status: true, lastLoginAt: true, createdAt: true },
    });

    res.json(toAdminDto(updated));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/master-admin/admins/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.masterAdmin?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Only Super Admins can remove admin accounts' });
      return;
    }

    const id = getString(req.params.id);

    if (id === req.masterAdmin!.adminId) {
      res.status(400).json({ error: 'You cannot delete your own account' });
      return;
    }

    const admin = await prisma.masterAdmin.findUnique({ where: { id }, select: { id: true } });
    if (!admin) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    await prisma.masterAdmin.delete({ where: { id } });

    await prisma.adminAuditLog.create({
      data: {
        adminId:    req.masterAdmin!.adminId,
        action:     'ADMIN_DELETED',
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
