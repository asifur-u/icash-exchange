import { Prisma } from "@prisma/client";
import { codeHash, encrypt } from "@/lib/crypto";
import { isUniqueViolation, transaction, type Tx } from "@/lib/db";
import { DeskError } from "@/lib/errors";
import { addAudit, ensureCatalog, newId, requireProduct } from "@/lib/store";

const CODE_PATTERN = /^[A-Za-z0-9-]{6,64}$/;

/** Holds `quantity` stock codes for an order. Concurrent buyers skip each other's locked rows. */
export async function reserveIn(tx: Tx, orderId: string, productId: string, quantity: number) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id" FROM "VoucherCode"
    WHERE "productId" = ${productId} AND "status" = 'AVAILABLE'
    ORDER BY "createdAt"
    LIMIT ${quantity}
    FOR UPDATE SKIP LOCKED`);
  if (rows.length < quantity) return [];
  const ids = rows.map((row) => row.id);
  await tx.voucherCode.updateMany({
    where: { id: { in: ids } },
    data: { status: "RESERVED", orderId, reservedAt: new Date() },
  });
  return ids;
}

export function parseCodeList(csv: string) {
  let parts = csv
    .split(/[\n,]/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts[0]?.toLowerCase() === "code") parts = parts.slice(1);
  if (parts.length === 0) throw new DeskError("BAD_INPUT", "Add at least one code");
  if (parts.length > 200) throw new DeskError("BAD_INPUT", "Upload 200 codes or fewer at a time");
  if (parts.some((part) => !CODE_PATTERN.test(part))) {
    throw new DeskError("BAD_INPUT", "Codes use letters, numbers, and hyphens, 6 to 64 characters");
  }
  return parts;
}

export async function uploadCodes(productSlug: string, csv: string) {
  const plains = parseCodeList(csv);
  const hashes = plains.map((plain) => codeHash(plain));
  if (new Set(hashes).size !== hashes.length) {
    throw new DeskError("DUPLICATE_CODE", "One of those codes is already on the desk");
  }
  await ensureCatalog();
  try {
    return await transaction(async (tx) => {
      const product = await requireProduct(tx, productSlug);
      await tx.voucherCode.createMany({
        data: plains.map((plain, index) => ({
          id: newId("code", 6),
          productId: product.id,
          cipher: encrypt(plain),
          hash: hashes[index]!,
        })),
      });
      await addAudit(tx, "admin", "codes.upload", product.id);
      return { added: plains.length };
    });
  } catch (error) {
    if (isUniqueViolation(error, "hash")) {
      throw new DeskError("DUPLICATE_CODE", "One of those codes is already on the desk");
    }
    throw error;
  }
}
