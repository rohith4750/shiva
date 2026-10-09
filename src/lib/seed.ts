import prisma from "@/lib/prisma";

export async function ensureSeedUsers() {
  const count = await prisma.user.count();
  if (count === 0) {
    await prisma.user.createMany({
      data: [
        {
          name: "Rohith Telidevara",
          email: "rohithtelidevara@gmail.com",
          password: "Rohith@143",
          newpassword: null,
          role: "Admin",
        }
      ],
    });
  }
}
