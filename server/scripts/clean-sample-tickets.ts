import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SAMPLE_TITLES = [
  'Set up project repository',
  'Design system and component library',
  'User authentication flow',
  'Database schema design',
  'API endpoint documentation',
  'Write unit tests for core modules',
  'Define project goals and KPIs',
  'Set up team communication channels',
  'Create project timeline',
  'Stakeholder review meeting',
  'Brand identity and logo design',
  'User research and personas',
  'Wireframes for main flows',
  'Design system tokens',
  'Usability testing session',
  'Q3 content calendar planning',
  'Social media strategy',
  'Email campaign setup',
  'SEO keyword research',
  'Landing page copy',
];

async function main() {
  const sprintTickets = await prisma.sprintTicket.deleteMany({
    where: { ticket: { title: { in: SAMPLE_TITLES } } },
  });
  console.log(`Deleted ${sprintTickets.count} sprint ticket links`);

  const tickets = await prisma.ticket.deleteMany({
    where: { title: { in: SAMPLE_TITLES } },
  });
  console.log(`Deleted ${tickets.count} sample tickets`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
