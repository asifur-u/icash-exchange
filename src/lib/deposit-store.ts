import { getPrisma } from "@/lib/db";
import {
  DEPOSITS_KEY,
  mergeDepositAccounts,
  type DepositOverrides,
  type PaymentMethodId,
} from "@/lib/deposit";

async function ensureTable() {
  const prisma = getPrisma();
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "DeskSetting" (
      "key" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DeskSetting_pkey" PRIMARY KEY ("key")
    )
  `);
}

async function readOverrides(): Promise<DepositOverrides> {
  try {
    await ensureTable();
    const rows = await getPrisma().$queryRaw<Array<{ value: string }>>`
      SELECT "value" FROM "DeskSetting" WHERE "key" = ${DEPOSITS_KEY}
    `;
    const raw = rows[0]?.value;
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DepositOverrides;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function resolveDepositAccounts() {
  return mergeDepositAccounts(await readOverrides());
}

export async function ensureDepositNumberColumn() {
  const prisma = getPrisma();
  await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "depositNumber" TEXT`);
}

/** Stamp today's wallet onto old receipts that never stored one. Later admin edits will not touch them. */
export async function freezeLegacyDepositNumbers() {
  const prisma = getPrisma();
  const accounts = await resolveDepositAccounts();
  for (const account of accounts) {
    await prisma.$executeRaw`
      UPDATE "Order"
      SET "depositNumber" = ${account.number}
      WHERE "depositNumber" IS NULL
        AND "paymentMethod"::text = ${account.id}
    `;
  }
}

export async function walletNumberFor(method: string) {
  const accounts = await resolveDepositAccounts();
  return accounts.find((item) => item.id === method)?.number ?? "";
}

export function normalizeWalletNumber(raw: string, kind: "mobile" | "bank") {
  const digits = raw.replace(/\D/g, "");
  if (kind === "bank") return digits;
  if (digits.startsWith("880") && digits.length >= 13) return digits.slice(2);
  if (digits.startsWith("88") && digits.length >= 12) return `0${digits.slice(2)}`;
  if (/^1\d{9}$/.test(digits)) return `0${digits}`;
  return digits;
}

export async function saveDepositAccount(
  id: PaymentMethodId,
  input: { number: string; name: string },
  actor: string,
) {
  const prisma = getPrisma();
  await ensureTable();
  const current = await readOverrides();
  current[id] = { number: input.number.trim(), name: input.name.trim() };
  const payload = JSON.stringify(current);
  await prisma.$executeRaw`
    INSERT INTO "DeskSetting" ("key", "value", "updatedAt")
    VALUES (${DEPOSITS_KEY}, ${payload}, NOW())
    ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = NOW()
  `;
  await prisma.auditLog.create({
    data: { actor, action: "deposit.update", targetId: id },
  });
  const next = await resolveDepositAccounts();
  const account = next.find((item) => item.id === id);
  if (!account) throw new Error("Wallet did not save");
  return account;
}
