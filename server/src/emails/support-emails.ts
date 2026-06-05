const APP_URL = () => process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173';

async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<{ success: boolean }> {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n[EMAIL DEV] ─────────────────────────────`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`────────────────────────────────────────\n`);
    return { success: true };
  }

  if (!process.env.RESEND_API_KEY) {
    console.warn('[EMAIL] RESEND_API_KEY not set');
    return { success: false };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'TaskPilot Support <support@taskpilot.com>',
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      console.error('[EMAIL] Resend error:', await res.text());
      return { success: false };
    }

    return { success: true };
  } catch (err) {
    console.error('[EMAIL] Network error:', err);
    return { success: false };
  }
}

// ─── Email 1 — Ticket confirmation to submitter ────────────────────────────

export async function sendTicketConfirmation(
  ticket: { ticketNumber: string; subject: string; category: string; id: string },
  user: { email: string; fullName: string },
) {
  return sendEmail(
    user.email,
    `[${ticket.ticketNumber}] We received your request`,
    `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0F172A">
      <div style="background:#2563EB;padding:24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:20px">TaskPilot Support</h1>
      </div>
      <div style="background:#F8FAFC;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px">
        <p>Hi ${user.fullName},</p>
        <p>We received your support request and will respond within <strong>24 hours</strong>.</p>
        <div style="background:white;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin:20px 0;font-size:14px">
          <p style="margin:4px 0">
            <span style="color:#64748B">Ticket:</span>
            <strong style="color:#2563EB;font-family:monospace;margin-left:8px">${ticket.ticketNumber}</strong>
          </p>
          <p style="margin:4px 0">
            <span style="color:#64748B">Subject:</span>
            <span style="margin-left:8px">${ticket.subject}</span>
          </p>
          <p style="margin:4px 0">
            <span style="color:#64748B">Category:</span>
            <span style="margin-left:8px">${ticket.category}</span>
          </p>
        </div>
        <a href="${APP_URL()}/support/my-tickets/${ticket.id}"
           style="display:inline-block;background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Track your ticket →
        </a>
        <p style="color:#94A3B8;font-size:12px;margin-top:24px">Didn't submit this? You can ignore this email.</p>
      </div>
    </div>`,
  );
}

// ─── Email 2 — New ticket alert to support team ────────────────────────────

export async function sendAdminNewTicketAlert(
  ticket: {
    ticketNumber: string;
    subject: string;
    category: string;
    description: string;
    id: string;
    metadata?: Record<string, string> | null | unknown;
  },
  user: { email: string; fullName: string },
  org: { name: string },
) {
  const to = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || 'support@taskpilot.com';

  return sendEmail(
    to,
    `🎫 [${ticket.ticketNumber}] ${ticket.subject}`,
    `<div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#0F172A">New Support Ticket</h2>
      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:14px">
        <strong style="color:#C2410C">${ticket.ticketNumber}</strong>
        <span style="color:#92400E;margin-left:8px">${ticket.category}</span>
      </div>
      <table style="width:100%;font-size:14px;margin-bottom:16px">
        <tr>
          <td style="color:#64748B;padding:5px 0;width:120px">From</td>
          <td>${user.fullName} (${user.email})</td>
        </tr>
        <tr>
          <td style="color:#64748B;padding:5px 0">Organisation</td>
          <td>${org.name}</td>
        </tr>
        <tr>
          <td style="color:#64748B;padding:5px 0">Subject</td>
          <td><strong>${ticket.subject}</strong></td>
        </tr>
      </table>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:16px;margin-bottom:16px;font-size:14px;white-space:pre-wrap;color:#0F172A">${ticket.description}</div>
      ${(ticket.metadata as any)?.page ? `<p style="font-size:12px;color:#94A3B8">Page: ${(ticket.metadata as any).page}</p>` : ''}
    </div>`,
  );
}

// ─── Email 3 — Admin reply notification to user ────────────────────────────

export async function sendAdminReplyNotification(
  ticket: { ticketNumber: string; subject: string; id: string },
  messageContent: string,
  user: { email: string; fullName: string },
) {
  return sendEmail(
    user.email,
    `[${ticket.ticketNumber}] Reply from TaskPilot Support`,
    `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0F172A">
      <div style="background:#2563EB;padding:24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:20px">New Reply</h1>
      </div>
      <div style="background:#F8FAFC;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px">
        <p>Hi ${user.fullName},</p>
        <p>Support replied to your ticket <strong>${ticket.ticketNumber}</strong>:</p>
        <div style="background:white;border-left:4px solid #2563EB;padding:16px;border-radius:0 8px 8px 0;margin:20px 0;font-size:14px;white-space:pre-wrap">${messageContent}</div>
        <a href="${APP_URL()}/support/my-tickets/${ticket.id}"
           style="display:inline-block;background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          View conversation →
        </a>
      </div>
    </div>`,
  );
}

// ─── Email 4 — Ticket resolved ─────────────────────────────────────────────

export async function sendTicketResolvedEmail(
  ticket: { ticketNumber: string; subject: string; id: string },
  user: { email: string; fullName: string },
) {
  return sendEmail(
    user.email,
    `[${ticket.ticketNumber}] Your ticket is resolved ✓`,
    `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0F172A">
      <div style="background:#10B981;padding:24px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:20px">Ticket Resolved</h1>
      </div>
      <div style="background:#F8FAFC;padding:32px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 12px 12px">
        <p>Hi ${user.fullName},</p>
        <p>Your ticket <strong>${ticket.ticketNumber}</strong> — "${ticket.subject}" has been resolved.</p>
        <p style="font-size:14px;color:#64748B;margin:20px 0">Was this helpful?</p>
        <div>
          <a href="${APP_URL()}/api/support/tickets/${ticket.id}/feedback?v=yes"
             style="display:inline-block;background:#10B981;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:8px">
            ✓ Yes, resolved
          </a>
          <a href="${APP_URL()}/api/support/tickets/${ticket.id}/reopen"
             style="display:inline-block;background:white;color:#EF4444;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;border:1px solid #EF4444">
            ✗ No, reopen
          </a>
        </div>
        <p style="color:#94A3B8;font-size:12px;margin-top:24px">This ticket closes automatically in 7 days.</p>
      </div>
    </div>`,
  );
}

// ─── Email 5 — Auto-close warning ──────────────────────────────────────────

export async function sendAutoCloseWarning(
  ticket: { ticketNumber: string; id: string },
  user: { email: string; fullName: string },
) {
  return sendEmail(
    user.email,
    `[${ticket.ticketNumber}] Closing in 2 days`,
    `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#0F172A">
      <p>Hi ${user.fullName},</p>
      <p>Your resolved ticket <strong>${ticket.ticketNumber}</strong> closes in <strong>2 days</strong>.</p>
      <p>Still need help?</p>
      <a href="${APP_URL()}/support/my-tickets/${ticket.id}"
         style="display:inline-block;background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
        View ticket →
      </a>
    </div>`,
  );
}
