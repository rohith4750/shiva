const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.users.findMany();
  for (const u of users) {
    if (u.newpassword) {
      const match = await bcrypt.compare(u.newpassword, u.password_hash);
      console.log(`User: ${u.email} | Password: ${u.newpassword} | Valid Hash: ${match}`);
      if (!match) {
        // sync the hash
        const newHash = await bcrypt.hash(u.newpassword, 10);
        await prisma.users.update({
          where: { id: u.id },
          data: { password_hash: newHash }
        });
        console.log(` -> Updated password hash for ${u.email}`);
      }
    }
  }
}

run().finally(() => prisma.$disconnect());
