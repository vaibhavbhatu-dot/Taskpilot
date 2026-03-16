import nodemailer from 'nodemailer';

// In development, log emails to console instead of sending
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025,
  ignoreTLS: true,
});

export async function sendInvitationEmail(
  to: string,
  inviterName: string,
  token: string
): Promise<void> {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const inviteLink = `${clientUrl}/invite/${token}`;

  const mailOptions = {
    from: '"TaskPilot" <noreply@taskpilot.local>',
    to,
    subject: `You've been invited to join TaskPilot`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563EB;">Welcome to TaskPilot!</h2>
        <p>${inviterName} has invited you to join TaskPilot.</p>
        <p>Click the button below to set up your account:</p>
        <a href="${inviteLink}" 
           style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; 
                  border-radius: 8px; text-decoration: none; font-weight: 500;">
          Set Up Your Account
        </a>
        <p style="color: #64748B; margin-top: 24px; font-size: 14px;">
          This invitation expires in 72 hours.
        </p>
      </div>
    `,
  };

  // In development, just log the invitation link
  console.log('──────────────────────────────────────────');
  console.log('📧 INVITATION EMAIL (Dev Mode)');
  console.log(`   To: ${to}`);
  console.log(`   From: ${inviterName}`);
  console.log(`   Link: ${inviteLink}`);
  console.log('──────────────────────────────────────────');

  try {
    await transporter.sendMail(mailOptions);
  } catch {
    // In dev, SMTP may not be available — that's fine, we already logged it
    console.log('   (SMTP not available — email logged above)');
  }
}
