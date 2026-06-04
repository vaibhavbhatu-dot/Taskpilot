import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating default organization for existing seed data...');

  // Create the default org for existing data (only if it doesn't exist)
  let org = await prisma.organization.findUnique({ where: { domain: 'taskpilot.com' } });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'TaskPilot Demo Org',
        domain: 'taskpilot.com',
      },
    });
    console.log(`Created org: ${org.name} (${org.id})`);
  } else {
    console.log(`Org already exists: ${org.name} (${org.id})`);
  }

  const [users, projects, teams, sprints] = await Promise.all([
    prisma.user.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }),
    prisma.project.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }),
    prisma.team.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }),
    prisma.sprint.updateMany({ where: { organizationId: null }, data: { organizationId: org.id } }),
  ]);

  console.log(`Updated: ${users.count} users, ${projects.count} projects, ${teams.count} teams, ${sprints.count} sprints`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
