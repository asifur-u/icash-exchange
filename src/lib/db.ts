import { Prisma, PrismaClient } from "@prisma/client";
import { DeskError } from "@/lib/errors";
import { databaseConfigured } from "@/lib/prisma";

declare global {
  var __icashPrisma: PrismaClient | undefined;
}

export type Tx = Prisma.TransactionClient;

function withPoolParams(raw: string) {
  const extra: string[] = [];
  if (!/[?&]connection_limit=/.test(raw)) {
    extra.push(process.env.NODE_ENV === "development" ? "connection_limit=5" : "connection_limit=10");
  }
  if (!/[?&]pool_timeout=/.test(raw)) extra.push("pool_timeout=20");
  if (!/[?&]connect_timeout=/.test(raw)) extra.push("connect_timeout=10");
  if (extra.length === 0) return raw;
  return `${raw}${raw.includes("?") ? "&" : "?"}${extra.join("&")}`;
}

export function getPrisma() {
  if (!databaseConfigured()) {
    throw new DeskError("DB_OFF", "The desk database is not configured. Set DATABASE_URL to a Postgres URL.");
  }
  if (!globalThis.__icashPrisma) {
    globalThis.__icashPrisma = new PrismaClient({
      log: ["error"],
      datasourceUrl: withPoolParams(process.env.DATABASE_URL!.trim()),
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
