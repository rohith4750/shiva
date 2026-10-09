import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export async function ensureSeedUsers() {
  const superAdminExists = await prisma.users.findUnique({
    where: { email: "rohithtelidevara@gmail.com" },
  });

  if (!superAdminExists) {
    const superAdminRole = await prisma.roles.findFirst({
      where: { name: "SUPER_ADMIN" },
    });
    const hash = await bcrypt.hash("Rohith@143", 10);
    await prisma.users.create({
      data: {
        id: randomUUID(),
        first_name: "Rohith",
        last_name: "Telidevara",
        email: "rohithtelidevara@gmail.com",
        password_hash: hash,
        newpassword: "Rohith@143",
        role: "SUPER_ADMIN",
        role_id: superAdminRole?.id || null,
        department: "Executive",
        is_active: true,
      },
    });
  }
}
