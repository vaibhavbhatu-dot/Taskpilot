import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { getString } from '../utils/query';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../utils/jwt';

const router = Router();

// Cross-site cookies (frontend on a different domain than the API, e.g. Netlify
// frontend + Railway backend) are only sent by the browser when the cookie is
// SameSite=None and Secure. In local dev (same-site localhost over http) we keep
// SameSite=Lax, since None+Secure would be rejected on a non-HTTPS origin.
const isProd = process.env.NODE_ENV === 'production';

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ?? undefined,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        designation: user.designation,
        organizationId: user.organizationId,
        onboardingCompleted: user.onboardingCompleted,
        emailVerified: user.emailVerified,
        timezone: user.timezone,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      res.status(401).json({ error: 'Refresh token required' });
      return;
    }

    const payload = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    const newPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ?? undefined,
    };

    const accessToken = generateAccessToken(newPayload);
    const refreshToken = generateRefreshToken(newPayload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax' });
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/invite/:token — Verify invitation token
router.get('/invite/:token', async (req: Request, res: Response) => {
  try {
    const token = getString(req.params.token);

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { invitedBy: { select: { fullName: true } } },
    });

    if (!invitation) {
      res.status(404).json({ error: 'Invalid invitation' });
      return;
    }

    if (invitation.status !== 'PENDING') {
      res.status(400).json({ error: 'Invitation already used or revoked' });
      return;
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      res.status(400).json({ error: 'Invitation has expired' });
      return;
    }

    res.json({
      email: invitation.email,
      invitedBy: invitation.invitedBy.fullName,
      presetRole: invitation.presetRole,
      presetManagerId: invitation.presetManagerId,
      presetTeamId: invitation.presetTeamId,
    });
  } catch (error) {
    console.error('Invite verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/setup — Complete profile setup from invitation
router.post('/setup', async (req: Request, res: Response) => {
  try {
    const { token, fullName, designation, managerId, password, avatar } = req.body;

    if (!token || !fullName || !password) {
      res.status(400).json({ error: 'Token, full name, and password are required' });
      return;
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { invitedBy: { select: { organizationId: true } } },
    });

    if (!invitation || invitation.status !== 'PENDING') {
      res.status(400).json({ error: 'Invalid or expired invitation' });
      return;
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      res.status(400).json({ error: 'Invitation has expired' });
      return;
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Inherit the inviter's organization
    const inviterOrgId = invitation.invitedBy.organizationId;

    // Create user and update invitation in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: invitation.email,
          password: hashedPassword,
          fullName,
          designation: designation || null,
          role: invitation.presetRole,
          managerId: managerId || invitation.presetManagerId || null,
          teamId: invitation.presetTeamId || null,
          avatar: avatar || null,
          status: 'ACTIVE',
          organizationId: inviterOrgId || null,
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });

      return newUser;
    });

    // Auto-login after setup
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ?? undefined,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        designation: user.designation,
        organizationId: user.organizationId,
        onboardingCompleted: user.onboardingCompleted,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error('Profile setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me — Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const tokenStr = authHeader.split(' ')[1];
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(tokenStr) || {} as any;
      // Try access token verification instead
      const { verifyAccessToken } = require('../utils/jwt');
      payload = verifyAccessToken(tokenStr);
    } catch {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatar: true,
        designation: true,
        teamId: true,
        managerId: true,
        status: true,
        emailVerified: true,
        onboardingCompleted: true,
        timezone: true,
        organizationId: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, companyName } = req.body;

    if (!fullName || !email || !password || !companyName) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ message: 'An account with this email already exists' });
      return;
    }

    const emailDomain = email.split('@')[1];
    const domainExists = await prisma.user.findFirst({
      where: { email: { endsWith: '@' + emailDomain }, emailVerified: true },
    });

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create org + user in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: companyName,
          domain: emailDomain || null,
        },
      });

      return tx.user.create({
        data: {
          fullName,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'ADMIN',
          status: 'PENDING',
          emailVerified: false,
          organizationId: org.id,
        },
      });
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.verificationToken.create({
      data: {
        email: email.toLowerCase(),
        token: randomBytes(32).toString('hex'),
        otp,
        type: 'EMAIL_VERIFY',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const devOtp = process.env.NODE_ENV !== 'production' ? otp : undefined;

    if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'noreply@taskpilot.com',
          to: email,
          subject: 'Verify your TaskPilot account',
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2>Verify your email</h2>
            <p>Hi ${fullName},</p>
            <p>Enter this code to verify your TaskPilot account:</p>
            <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#2563EB;padding:24px;background:#EFF6FF;border-radius:8px;text-align:center;margin:24px 0">${otp}</div>
            <p style="color:#94A3B8;font-size:14px">This code expires in 15 minutes. If you didn't sign up, ignore this email.</p>
          </div>`,
        }),
      });
    }

    res.status(201).json({
      message: 'Account created. Please verify your email.',
      userId: user.id,
      email: user.email,
      companyDomainExists: !!domainExists,
      existingCompanyName: domainExists ? emailDomain : null,
      ...(devOtp && { devOtp }),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Failed to create account' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ message: 'Email and OTP are required' });
      return;
    }

    const verification = await prisma.verificationToken.findFirst({
      where: {
        email: email.toLowerCase(),
        type: 'EMAIL_VERIFY',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      res.status(400).json({ message: 'OTP expired. Please request a new one.' });
      return;
    }

    if (verification.attempts >= 5) {
      await prisma.verificationToken.delete({ where: { id: verification.id } });
      res.status(400).json({ message: 'Too many attempts. Please request a new OTP.' });
      return;
    }

    const isDevBypass = process.env.NODE_ENV !== 'production' && otp === '000000';

    if (!isDevBypass && verification.otp !== otp) {
      await prisma.verificationToken.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = 5 - (verification.attempts + 1);
      res.status(400).json({
        message: `Invalid OTP. ${remaining} attempts remaining.`,
        attemptsRemaining: remaining,
      });
      return;
    }

    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { emailVerified: true, status: 'ACTIVE' },
    });

    await prisma.verificationToken.delete({ where: { id: verification.id } });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ?? undefined,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Email verified successfully',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        emailVerified: true,
        isNewUser: true,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      res.status(404).json({ message: 'No account found with this email' });
      return;
    }

    await prisma.verificationToken.deleteMany({
      where: { email: email.toLowerCase(), type: 'EMAIL_VERIFY' },
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.verificationToken.create({
      data: {
        email: email.toLowerCase(),
        token: randomBytes(32).toString('hex'),
        otp,
        type: 'EMAIL_VERIFY',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const devOtp = process.env.NODE_ENV !== 'production' ? otp : undefined;

    if (process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'noreply@taskpilot.com',
          to: email,
          subject: 'Your new TaskPilot verification code',
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2>New verification code</h2>
            <p>Here is your new verification code:</p>
            <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#2563EB;padding:24px;background:#EFF6FF;border-radius:8px;text-align:center;margin:24px 0">${otp}</div>
            <p style="color:#94A3B8;font-size:14px">This code expires in 15 minutes.</p>
          </div>`,
        }),
      });
    }

    res.json({
      message: 'New OTP sent to your email',
      ...(devOtp && { devOtp }),
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
});

export default router;
