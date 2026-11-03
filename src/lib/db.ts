import { Prisma, PrismaClient } from "@prisma/client";
import { DeskError } from "@/lib/errors";
import { databaseConfigured } from "@/lib/prisma";

declare global {
  var __icashPrisma: PrismaClient | undefined;
}

export type Tx = Prisma.TransactionClient;

export function getPrisma() {
  if (!databaseConfigured()) {
    throw new DeskError("DB_OFF", "The desk database is not configured. Set DATABASE_URL to a Postgres URL.");
  }
  if (!globalThis.__icashPrisma) {
    globalThis.__icashPrisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return globalThis.__icashPrisma;
}

/** Interactive transaction with sane limits for a serverless Postgres (Neon). */
export function transaction<T>(fn: (tx: Tx) => Promise<T>) {
  return getPrisma().$transaction(fn, { maxWait: 5_000, timeout: 15_000 });
}

export function isUniqueViolation(error: unknown, field?: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  if (!field) return true;
  const target = error.meta?.target;
  return Array.isArray(target) ? target.includes(field) : String(target ?? "").includes(field);
}

export { databaseConfigured };
