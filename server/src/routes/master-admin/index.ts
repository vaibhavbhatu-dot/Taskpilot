import { Router } from 'express';
import { masterAdminAuth } from '../../middleware/masterAdminAuth.middleware';
import authRoutes          from './auth.routes';
import dashboardRoutes     from './dashboard.routes';
import orgsRoutes          from './organisations.routes';
import usersRoutes         from './users.routes';
import supportRoutes       from './support.routes';
import auditRoutes         from './audit-logs.routes';
import adminAccountsRoutes from './admin-accounts.routes';
import technicalRoutes     from './technical.routes';
import configRoutes        from './config.routes';

const router = Router();

// Auth — self-contained (login public; me/logout enforce auth internally)
router.use('/auth', authRoutes);

// Technical — /health is public; /errors and /jobs enforce auth inside the router
router.use('/technical', technicalRoutes);

// Everything below requires a valid master admin token
router.use(masterAdminAuth);
router.use('/dashboard',     dashboardRoutes);
router.use('/organisations',  orgsRoutes);
router.use('/users',         usersRoutes);
router.use('/support',       supportRoutes);
router.use('/audit-logs',    auditRoutes);
router.use('/admin-accounts', adminAccountsRoutes);
router.use('/config',        configRoutes);

export default router;
