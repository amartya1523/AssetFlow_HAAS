const prisma = require('./src/config/prisma');
async function seed() {
  let b2 = await prisma.asset.findFirst({ where: { name: 'Room B2' } });
  if (!b2) {
    b2 = await prisma.asset.create({
      data: {
        assetTag: 'RM-B2',
        name: 'Room B2',
        category: 'FACILITY',
        status: 'AVAILABLE',
        isBookable: true
      }
    });
    console.log('Created Room B2:', b2.id);
  } else {
    console.log('Room B2 exists:', b2.id);
  }
}
seed().catch(console.error).finally(() => prisma.$disconnect());
