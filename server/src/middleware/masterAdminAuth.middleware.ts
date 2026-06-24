import { Request, Response, NextFunction } from 'express';
import { verifyMasterAdminToken, MasterAdminTokenPayload } from '../utils/masterAdminJwt';
import prisma from '../utils/prisma';

declare global {
  namespace Express {
    interface Request {
      masterAdmin?: MasterAdminTokenPayload;
    }
  }
}

export async function masterAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Master admin token required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyMasterAdminToken(token);

    // Confirm the admin still exists and is active
    const admin = await prisma.masterAdmin.findUnique({
      where: { id: payload.adminId },
      select: { id: true, status: true },
    });

    if (!admin || admin.status !== 'ACTIVE') {
      res.status(401).json({ error: 'Admin account not found or suspended' });
      return;
    }

    req.masterAdmin = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired master admin token' });
  }
}
