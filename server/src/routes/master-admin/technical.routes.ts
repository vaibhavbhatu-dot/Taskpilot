import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { masterAdminAuth } from '../../middleware/masterAdminAuth.middleware';

const router = Router();

const yesterday = new Date(Date.now() - 86_400_000).toISOString();

// GET /api/master-admin/technical/health  (no auth)
router.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status:    'ok',
      database:  'connected',
      uptime:    process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(200).json({
      status:    'degraded',
      database:  'disconnected',
      uptime:    process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/master-admin/technical/errors  (protected)
router.get('/errors', masterAdminAuth, (_req: Request, res: Response) => {
  const METHODS   = ['GET', 'POST', 'PATCH', 'DELETE'] as const;
  const ENDPOINTS = [
    '/api/tickets', '/api/users', '/api/projects',
    '/api/auth/login', '/api/support/tickets',
  ];
  const MESSAGES = [
    'Cannot read properties of undefined',
    'Validation failed: email is required',
    'Foreign key constraint failed on field: userId',
    'Connection pool timeout exceeded',
    'JWT malformed',
    'Unexpected token < in JSON',
    'ECONNREFUSED 127.0.0.1:5432',
    'Request timeout after 30000ms',
    'Rate limit exceeded',
    'Prisma: unique constraint violation',
  ];

  const errors = Array.from({ length: 10 }, (_, i) => ({
    id:         `err_${String(i + 1).padStart(3, '0')}`,
    timestamp:  new Date(Date.now() - i * 3_600_000).toISOString(),
    endpoint:   ENDPOINTS[i % ENDPOINTS.length],
    method:     METHODS[i % METHODS.length],
    statusCode: [400, 401, 403, 404, 500][i % 5],
    message:    MESSAGES[i],
    userId:     i % 3 === 0 ? null : `user_mock_${i}`,
    createdAt:  new Date(Date.now() - i * 3_600_000).toISOString(),
  }));

  res.json(errors);
});

// GET /api/master-admin/technical/jobs  (protected)
router.get('/jobs', masterAdminAuth, (_req: Request, res: Response) => {
  res.json([
    {
      name:     'support-auto-close',
      schedule: 'Daily 09:00',
      status:   'active',
      lastRun:  yesterday,
    },
    {
      name:     'db-backup',
      schedule: 'Daily 02:00',
      status:   'active',
      lastRun:  yesterday,
    },
  ]);
});

export default router;
