import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { getString } from '../../utils/query';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const ALLOWED_EXTS = /^(jpg|jpeg|png|gif|pdf|doc|docx|txt|zip)$/;

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    ALLOWED_EXTS.test(ext) ? cb(null, true) : cb(new Error(`File type .${ext} is not allowed`));
  },
});

const router = Router();

// POST /api/master-admin/support/upload
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    res.json({
      url:          `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      size:         req.file.size,
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /api/master-admin/support/tickets
router.get('/tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status   = typeof req.query.status   === 'string' ? req.query.status   : undefined;
    const priority = typeof req.query.priority === 'string' ? req.query.priority : undefined;
    const page     = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
    const limit    = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const skip     = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status)   where.status   = status;
    if (priority) where.priority = priority;

    const [data, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        select: {
          id:           true,
          ticketNumber: true,
          subject:      true,
          category:     true,
          status:       true,
          priority:     true,
          createdAt:    true,
          updatedAt:    true,
          user:         { select: { id: true, fullName: true, email: true } },
          organization: { select: { id: true, name: true } },
          _count:       { select: { messages: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    res.json({ data, total, page, limit });
  } catch (err) {
    next(err);
  }
});

// GET /api/master-admin/support/tickets/:id
router.get('/tickets/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getString(req.params.id);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user:         { select: { id: true, fullName: true, email: true, avatar: true } },
        organization: { select: { id: true, name: true } },
        messages: {
          include: {
            author: { select: { id: true, fullName: true, avatar: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Support ticket not found' });
      return;
    }

    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/master-admin/support/tickets/:id/status
router.patch('/tickets/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id     = getString(req.params.id);
    const status = typeof req.body.status === 'string' ? req.body.status : undefined;

    if (!status) {
      res.status(400).json({ error: 'status is required' });
      return;
    }

    const existing = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'Support ticket not found' });
      return;
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: status as any,
        ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
      },
      include: {
        user:         { select: { id: true, fullName: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId:    req.masterAdmin!.adminId,
        action:     'SUPPORT_TICKET_STATUS_CHANGED',
        targetType: 'SupportTicket',
        targetId:   id,
        details:    { previousStatus: existing.status, newStatus: status },
        ipAddress:  getString(req.ip) || null,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /api/master-admin/support/tickets/:id/reply
router.post('/tickets/:id/reply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id            = getString(req.params.id);
    const { message, attachmentUrl } = req.body;

    if (typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Support ticket not found' });
      return;
    }

    const newMessage = await prisma.supportMessage.create({
      data: {
        ticketId:      id,
        authorId:      null,
        isAdminReply:  true,
        content:       message.trim(),
        attachmentUrl: attachmentUrl || null,
      },
    });

    // Advance OPEN tickets to IN_PROGRESS on first admin reply
    if (ticket.status === 'OPEN') {
      await prisma.supportTicket.update({
        where: { id },
        data:  { status: 'IN_PROGRESS', updatedAt: new Date() },
      });
    } else {
      await prisma.supportTicket.update({
        where: { id },
        data:  { updatedAt: new Date() },
      });
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId:    req.masterAdmin!.adminId,
        action:     'SUPPORT_TICKET_REPLIED',
        targetType: 'SupportTicket',
        targetId:   id,
        ipAddress:  getString(req.ip) || null,
      },
    });

    res.status(201).json(newMessage);
  } catch (err) {
    next(err);
  }
});

// POST /api/master-admin/support/tickets/:id/note
router.post('/tickets/:id/note', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id   = getString(req.params.id);
    const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';

    if (!note) {
      res.status(400).json({ error: 'note is required' });
      return;
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Support ticket not found' });
      return;
    }

    const newNote = await prisma.supportMessage.create({
      data: {
        ticketId:       id,
        authorId:       null,
        isAdminReply:   true,
        isInternalNote: true,
        content:        note,
      },
    });

    res.status(201).json(newNote);
  } catch (err) {
    next(err);
  }
});

export default router;
