import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TaskPilot database...');

  // Create initial Admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskpilot.com' },
    update: {},
    create: {
      email: 'admin@taskpilot.com',
      password: hashedPassword,
      fullName: 'System Admin',
      designation: 'System Administrator',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Admin user created: ${admin.email} (password: admin123)`);

  // Create sample team
  const team = await prisma.team.upsert({
    where: { name: 'Engineering' },
    update: {},
    create: {
      name: 'Engineering',
      leadId: admin.id,
    },
  });

  // Update admin's team
  await prisma.user.update({
    where: { id: admin.id },
    data: { teamId: team.id },
  });

  console.log(`✅ Team created: ${team.name}`);

  // Create sample project
  const project = await prisma.project.upsert({
    where: { key: 'WEB' },
    update: {},
    create: {
      name: 'Web Platform',
      key: 'WEB',
      leadId: admin.id,
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Project created: ${project.name} (${project.key})`);

  // Create sample tickets
  const ticketData = [
    { title: 'Set up CI/CD pipeline', type: 'TASK' as const, priority: 'HIGH' as const, storyPoints: 5 },
    { title: 'Design system components', type: 'TASK' as const, priority: 'MEDIUM' as const, storyPoints: 8 },
    { title: 'Fix login page layout issue', type: 'BUG' as const, priority: 'CRITICAL' as const, storyPoints: 2 },
    { title: 'Add dark mode support', type: 'FEATURE' as const, priority: 'LOW' as const, storyPoints: 13 },
    { title: 'Optimize database queries', type: 'IMPROVEMENT' as const, priority: 'HIGH' as const, storyPoints: 5 },
    { title: 'Write API documentation', type: 'TASK' as const, priority: 'MEDIUM' as const, storyPoints: 3 },
  ];

  for (let i = 0; i < ticketData.length; i++) {
    const t = ticketData[i];
    await prisma.ticket.upsert({
      where: { ticketNumber: `WEB-${i + 1}` },
      update: {},
      create: {
        ticketNumber: `WEB-${i + 1}`,
        title: t.title,
        description: `Description for ${t.title}`,
        projectId: project.id,
        type: t.type,
        priority: t.priority,
        status: i < 2 ? 'TODO' : i < 4 ? 'IN_PROGRESS' : 'BACKLOG',
        storyPoints: t.storyPoints,
        createdById: admin.id,
        assignedToId: admin.id,
        teamId: team.id,
      },
    });
  }

  console.log(`✅ ${ticketData.length} sample tickets created`);

  // Create a sprint
  const sprint = await prisma.sprint.create({
    data: {
      name: 'Sprint 1',
      projectId: project.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      goal: 'Complete initial project setup',
      status: 'ACTIVE',
      createdById: admin.id,
    },
  });

  // Add first 4 tickets to sprint
  const tickets = await prisma.ticket.findMany({
    where: { projectId: project.id },
    take: 4,
  });

  for (const ticket of tickets) {
    await prisma.sprintTicket.create({
      data: {
        sprintId: sprint.id,
        ticketId: ticket.id,
        statusAtStart: ticket.status,
        pointsAtStart: ticket.storyPoints,
      },
    });
  }

  console.log(`✅ Sprint created: ${sprint.name} (with ${tickets.length} tickets)`);

  console.log('\n🎉 Seeding complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Login credentials:');
  console.log('  Email: admin@taskpilot.com');
  console.log('  Password: admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
