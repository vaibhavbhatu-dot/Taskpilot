import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.masterAdmin.findFirst({
    where: { role: 'SUPER_ADMIN' },
  });

  if (existing) {
    console.log('Super Admin already exists:', existing.email);
    return;
  }

  const email    = 'superadmin@taskpilot.com';
  const password = 'Admin@123456';
  const hash     = await bcrypt.hash(password, 10);

  await prisma.masterAdmin.create({
    data: {
      name:         'Super Admin',
      email,
      passwordHash: hash,
      role:         'SUPER_ADMIN',
      status:       'ACTIVE',
    },
  });

  console.log('✓ Super Admin created');
  console.log('  Email:    ', email);
  console.log('  Password: ', password);
  console.log('  ⚠ Change this password after your first login.');
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
