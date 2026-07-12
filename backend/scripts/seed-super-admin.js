const prisma = require('../src/config/prisma');
const { hashPassword } = require('../src/services/auth.service');

async function main() {
  const email = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || 'Platform Admin';

  if (!email || !password) {
    throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required');
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: 'SUPER_ADMIN',
      organizationId: null,
      departmentId: null,
      status: 'ACTIVE',
    },
    create: {
      name,
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
      organizationId: null,
      status: 'ACTIVE',
    },
    select: { id: true, email: true, role: true, status: true },
  });

  // eslint-disable-next-line no-console
  console.log(`[seed-super-admin] ${user.email} is ${user.role} (${user.status})`);
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
