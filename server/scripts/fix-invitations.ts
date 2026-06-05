/**
 * Backfill organizationId on existing Invitation rows that have none.
 * Run once after the migration:
 *   npx ts-node --project tsconfig.json scripts/fix-invitations.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const invitations = await prisma.invitation.findMany({
    where: { organizationId: null },
    include: { invitedBy: { select: { id: true, organizationId: true } } },
  });

  console.log(`Found ${invitations.length} invitation(s) without organizationId`);

  let fixed = 0;
  for (const inv of invitations) {
    const orgId = inv.invitedBy?.organizationId;
    if (orgId) {
      await prisma.invitation.update({
        where: { id: inv.id },
        data: { organizationId: orgId },
      });
      fixed++;
      console.log(`  Fixed: ${inv.email} → org ${orgId}`);
    } else {
      console.log(`  Skipped: ${inv.email} (inviter has no org)`);
    }
  }

  console.log(`\nDone. Fixed ${fixed} / ${invitations.length} invitation(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
