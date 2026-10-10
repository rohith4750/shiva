const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const users = await prisma.users.findMany({
    include: { roles: true }
  });
  console.log('✅ Prisma query succeeded! Total users:', users.length);
  users.forEach(u => console.log(`  - ${u.email} | ${u.role} | Role Relation: ${u.roles?.name || 'none'}`));
}

test()
  .catch(err => {
    console.error('❌ Prisma query failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
