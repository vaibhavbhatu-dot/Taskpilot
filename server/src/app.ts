import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

import { errorHandler } from './middleware/error.middleware';
import { authenticate } from './middleware/auth.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import teamRoutes from './routes/teams.routes';
import projectRoutes from './routes/projects.routes';
import ticketRoutes from './routes/tickets.routes';
import sprintRoutes from './routes/sprints.routes';
import commentRoutes from './routes/comments.routes';
import invitationRoutes from './routes/invitations.routes';
import notificationRoutes from './routes/notifications.routes';
import dashboardRoutes from './routes/dashboard.routes';
import searchRoutes from './routes/search.routes';
import adminRoutes from './routes/admin.routes';
import myWorkRoutes from './routes/mywork.routes';
import onboardingRoutes from './routes/onboarding.routes';
import supportRoutes from './routes/support.routes';
import adminSupportRoutes from './routes/admin.support.routes';

dotenv.config();

const app = express();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
    ];
    // Allow requests with no origin (e.g. mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/my-work', myWorkRoutes);
app.use('/api/onboarding', authenticate, onboardingRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin/support', adminSupportRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

export default app;
