import { PrismaClient } from "@prisma/client";
import { databaseConfigured } from "@/lib/prisma";

declare global {
  // eslint-disable-next-line no-var
  var __icashPrisma: PrismaClient | undefined;
}

export function getPrisma() {
  if (!databaseConfigured()) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalThis.__icashPrisma) {
    globalThis.__icashPrisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return globalThis.__icashPrisma;
}

export { databaseConfigured };