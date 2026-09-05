import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@peoplepay360.com";
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name: "System Admin",
      role: UserRole.ADMIN,
      passwordHash,
    },
    create: {
      email,
      name: "System Admin",
      role: UserRole.ADMIN,
      passwordHash,
    },
  });

  console.log("✅ Admin user verified in DB:", admin.email, admin.role);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
