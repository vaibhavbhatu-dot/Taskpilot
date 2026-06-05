import { PrismaClient } from '@prisma/client';

export async function generateSupportTicketNumber(
  prisma: PrismaClient
): Promise<string> {
  const count = await prisma.supportTicket.count();
  const num = String(count + 1).padStart(4, '0');
  return `SPT-${num}`;
}
