const prisma = require('../src/config/prisma');

async function main() {
  const slug = process.env.DEFAULT_ORGANIZATION_SLUG || 'default-organization';
  const name = process.env.DEFAULT_ORGANIZATION_NAME || 'Default Organization';

  const organization = await prisma.organization.upsert({
    where: { slug },
    update: { name, status: 'ACTIVE' },
    create: { slug, name, status: 'ACTIVE' },
  });

  const organizationId = organization.id;
  const models = [
    ['user', { role: { not: 'SUPER_ADMIN' } }],
    ['department', {}],
    ['assetCategory', {}],
    ['asset', {}],
    ['allocation', {}],
    ['transfer', {}],
    ['booking', {}],
    ['maintenanceRequest', {}],
    ['auditCycle', {}],
    ['auditItem', {}],
    ['notification', {}],
    ['activityLog', {}],
  ];

  for (const [model, extraWhere] of models) {
    // eslint-disable-next-line no-await-in-loop
    const result = await prisma[model].updateMany({
      where: { organizationId: null, ...extraWhere },
      data: { organizationId },
    });
    // eslint-disable-next-line no-console
    console.log(`[backfill] ${model}: ${result.count} rows assigned to ${organization.slug}`);
  }
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
