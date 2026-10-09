import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.users.findFirst({
    where: {
      OR: [
        { role: 'SUPER_ADMIN' },
        { role: 'ADMIN' }
      ]
    }
  });

  if (admin) {
    console.log('Found Admin User:', {
      id: admin.id,
      email: admin.email,
      name: `${admin.first_name} ${admin.last_name}`,
      role: admin.role,
      hash: admin.password_hash
    });
    // Test common passwords
    for (const testPass of ['admin123', 'Admin@123', 'password', 'Password123!', '123456']) {
      const match = await bcrypt.compare(testPass, admin.password_hash);
      if (match) {
        console.log(`Password matches: "${testPass}"`);
      }
    }
  }

  // Also check if admin@nexvanta.com or admin@app.com exists
  const nexvantaUser = await prisma.users.findUnique({
    where: { email: 'admin@nexvanta.com' }
  });
  console.log('admin@nexvanta.com exists?', !!nexvantaUser);
}

main().catch(console.error).finally(() => prisma.$disconnect());
