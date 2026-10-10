const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.users.findMany({
    select: {
      email: true,
      role: true,
      first_name: true,
      last_name: true,
      newpassword: true
    }
  });
  console.log(JSON.stringify(users, null, 2));
}

run().finally(() => prisma.$disconnect());
