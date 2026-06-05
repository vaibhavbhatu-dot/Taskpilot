import cron from 'node-cron';
import prisma from '../utils/prisma';
import { sendAutoCloseWarning } from '../emails/support-emails';

export function startSupportCronJobs(): void {
  // Runs daily at 09:00 — warn tickets resolved 5 days ago, close tickets resolved 7+ days ago
  cron.schedule('0 9 * * *', async () => {
    const now = new Date();
    console.log('[CRON] Support auto-close check:', now.toISOString());

    const MS = 24 * 60 * 60 * 1000;
    const fiveDaysAgo  = new Date(now.getTime() - 5 * MS);
    const sixDaysAgo   = new Date(now.getTime() - 6 * MS);
    const sevenDaysAgo = new Date(now.getTime() - 7 * MS);

    // Send 2-day warning to tickets resolved exactly 5 days ago (window: day 5–6)
    const warnTickets = await prisma.supportTicket.findMany({
      where: {
        status: 'RESOLVED',
        resolvedAt: { lte: fiveDaysAgo, gt: sixDaysAgo },
      },
      include: { user: true },
    });

    for (const t of warnTickets) {
      try {
        await sendAutoCloseWarning(t, t.user);
        console.log(`[CRON] Warning sent: ${t.ticketNumber}`);
      } catch (e) {
        console.error('[CRON] Warning failed:', e);
      }
    }

    // Auto-close tickets resolved 7+ days ago
    const closeResult = await prisma.supportTicket.updateMany({
      where: {
        status: 'RESOLVED',
        resolvedAt: { lte: sevenDaysAgo },
      },
      data: { status: 'CLOSED' },
    });

    if (closeResult.count > 0) {
      console.log(`[CRON] Auto-closed ${closeResult.count} ticket(s)`);
    }
  });

  console.log('[CRON] Support auto-close scheduled (daily 09:00)');
}
