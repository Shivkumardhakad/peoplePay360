import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL;
  const datasources =
    dbUrl && dbUrl.includes(":6543") && !dbUrl.includes("pgbouncer=true")
      ? { db: { url: dbUrl.includes("?") ? `${dbUrl}&pgbouncer=true` : `${dbUrl}?pgbouncer=true` } }
      : undefined;

  return new PrismaClient({
    ...(datasources ? { datasources } : {}),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
