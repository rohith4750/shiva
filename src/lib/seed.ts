import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export async function ensureSeedUsers() {
  const adminExists = await prisma.users.findUnique({
    where: { email: "admin@nexvanta.com" },
  });

  if (!adminExists) {
    const superAdminRole = await prisma.roles.findFirst({
      where: { name: "SUPER_ADMIN" },
    });
    const hash = await bcrypt.hash("Password123!", 10);
    await prisma.users.create({
      data: {
        id: randomUUID(),
        first_name: "Admin",
        last_name: "Nexvanta",
        email: "admin@nexvanta.com",
        password_hash: hash,
        newpassword: "Password123!",
        role: "SUPER_ADMIN",
        role_id: superAdminRole?.id || null,
        department: "Executive",
        is_active: true,
      },
    });
  }
}
