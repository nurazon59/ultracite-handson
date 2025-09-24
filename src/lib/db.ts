import { PrismaClient } from "@/generated/prisma";

interface GlobalWithPrisma {
  prisma?: PrismaClient;
}

const globalWithPrisma = global as GlobalWithPrisma;

export const prisma = globalWithPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalWithPrisma.prisma = prisma;
}
