import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const findings: Array<{ area: string; count: number; examples?: string[] }> = [];

  const demoEmails = [
    'admin@denuel.local',
    'landlord@denuel.local',
    'agent@denuel.local',
    'tenant@denuel.local',
  ];

  const demoPropertyTitles = [
    '3-bedroom family house in Kabulonga',
    '1-bedroom apartment near University of Zambia',
    'Luxury 5-Bedroom Villa in Kabulonga',
    '3-Bedroom Modern Townhouse in Rhodes Park',
    '2-Bedroom Apartment in Woodlands',
    'Prime Plot in Ibex Hill',
    'Commercial Building on Cairo Road',
    '4-Bedroom Family Home in Roma',
  ];

  const demoProviders = [
    'Lusaka Express Movers',
    'Sparkle Clean Services',
    'FixIt Plumbing & Electrical',
  ];

  const demoGuideSlugs = [
    'renting-guide-zambia',
    'first-time-buyer-guide',
    'moving-checklist',
  ];

  const demoLenders = [
    'Zambia National Building Society',
    'Stanbic Bank Zambia',
    'First National Bank Zambia',
  ];

  const users = await prisma.user.findMany({
    where: { email: { in: demoEmails } },
    select: { email: true },
  });
  if (users.length) findings.push({ area: 'users', count: users.length, examples: users.map((x) => x.email) });

  const properties = await prisma.property.findMany({
    where: { title: { in: demoPropertyTitles } },
    select: { title: true },
  });
  if (properties.length) findings.push({ area: 'properties', count: properties.length, examples: properties.map((x) => x.title) });

  const providers = await prisma.serviceProvider.findMany({
    where: { businessName: { in: demoProviders } },
    select: { businessName: true },
  });
  if (providers.length) findings.push({ area: 'service providers', count: providers.length, examples: providers.map((x) => x.businessName) });

  const guides = await prisma.guide.findMany({
    where: { slug: { in: demoGuideSlugs } },
    select: { slug: true },
  });
  if (guides.length) findings.push({ area: 'guides', count: guides.length, examples: guides.map((x) => x.slug) });

  const lenders = await prisma.mortgageLender.findMany({
    where: { name: { in: demoLenders } },
    select: { name: true },
  });
  if (lenders.length) findings.push({ area: 'mortgage lenders', count: lenders.length, examples: lenders.map((x) => x.name) });

  if (findings.length === 0) {
    console.log('PASS: no known legacy demo records were found.');
    return;
  }

  console.error('FAIL: known legacy demo records are still present.');
  for (const finding of findings) {
    console.error(`- ${finding.area}: ${finding.count}`);
    for (const example of finding.examples || []) console.error(`  • ${example}`);
  }

  process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error('Demo-data audit failed:', error instanceof Error ? error.message : 'unknown error');
    process.exitCode = 2;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
