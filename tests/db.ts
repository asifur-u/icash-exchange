import { getPrisma } from "@/lib/db";
import { resetCatalogCache } from "@/lib/store";

/** Empties every desk table so each test starts from a fresh catalog. */
export async function resetDb() {
  const prisma = getPrisma();
  await prisma.$executeRawUnsafe(
    `TRUNCATE "AuditLog", "Issuance", "VoucherCode", "Order", "Sell", "WebhookEvent", "Product", "User" CASCADE`,
  );
  await prisma.counter.upsert({ where: { id: "desk" }, create: { id: "desk", value: 1042 }, update: { value: 1042 } });
  resetCatalogCache();
}
