import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin@123456', 10);
  
  const admin = await prisma.masterAdmin.upsert({
    where: { email: 'superadmin@taskpilot.com' },
    update: { passwordHash: hash },
    create: {
      name: 'Super Admin',
      email: 'superadmin@taskpilot.com',
      passwordHash: hash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Password fixed for:', admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());