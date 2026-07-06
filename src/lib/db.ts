import { PrismaClient } from "@prisma/client";

// Next.js hot-reload spawns fresh module instances; reuse one client in dev
// to avoid exhausting database connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
