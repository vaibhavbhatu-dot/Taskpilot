import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../utils/prisma';
import { generateMasterAdminToken } from '../../utils/masterAdminJwt';
import { masterAdminAuth } from '../../middleware/masterAdminAuth.middleware';

const router = Router();

// POST /api/master-admin/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const admin = await prisma.masterAdmin.findUnique({ where: { email } });

    if (!admin) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const passwordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (admin.status === 'SUSPENDED') {
      res.status(403).json({ error: 'Account suspended. Contact a Super Admin.' });
      return;
    }

    await prisma.masterAdmin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId:   admin.id,
        action:    'ADMIN_LOGIN',
        ipAddress: req.ip ?? null,
      },
    });

    const token = generateMasterAdminToken({
      adminId: admin.id,
      email:   admin.email,
      role:    admin.role,
    });

    res.json({
      token,
      admin: {
        id:       admin.id,
        email:    admin.email,
        fullName: admin.name,
        role:     admin.role,
        status:   admin.status,
        avatar:   null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/master-admin/auth/me
router.get('/me', masterAdminAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = await prisma.masterAdmin.findUnique({
      where: { id: req.masterAdmin!.adminId },
      select: {
        id:          true,
        email:       true,
        name:        true,
        role:        true,
        status:      true,
        lastLoginAt: true,
        createdAt:   true,
        updatedAt:   true,
      },
    });

    if (!admin) {
      res.status(404).json({ error: 'Admin not found' });
      return;
    }

    res.json({ ...admin, fullName: admin.name, avatar: null });
  } catch (err) {
    next(err);
  }
});

// POST /api/master-admin/auth/logout
router.post('/logout', masterAdminAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId:   req.masterAdmin!.adminId,
        action:    'ADMIN_LOGOUT',
        ipAddress: req.ip ?? null,
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
