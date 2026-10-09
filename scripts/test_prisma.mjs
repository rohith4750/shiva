import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany({
    include: {
      roles: {
        include: {
          role_permissions: {
            include: { permissions: true }
          }
        }
      }
    }
  });

  console.log('Total users in database:', users.length);
  for (const u of users) {
    const isMatch = await bcrypt.compare('Rohith@143', u.password_hash);
    console.log({
      id: u.id,
      email: u.email,
      name: `${u.first_name} ${u.last_name}`,
      role: u.roles?.name || u.role,
      passwordMatches: isMatch,
      newpassword: u.newpassword,
      permissionsCount: u.roles?.role_permissions?.length || 0
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
