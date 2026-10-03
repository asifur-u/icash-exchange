import { randomBytes } from "node:crypto";
import { codeHash, encrypt } from "@/lib/crypto";
import { DeskError } from "@/lib/errors";
import { addAudit, requireProduct, withStore } from "@/lib/store";
import type { Db } from "@/lib/types";

const CODE_PATTERN = /^[A-Za-z0-9-]{6,64}$/;

export function reserveIn(db: Db, orderId: string, productId: string, quantity: number) {
  const available = db.codes.filter((code) => code.productId === productId && code.status === "AVAILABLE").slice(0, quantity);
  if (available.length < quantity) {
    throw new DeskError("OUT_OF_STOCK", "Not enough codes are ready for that note");
  }

  const ids: string[] = [];
  const reservedAt = new Date().toISOString();
  for (const code of available) {
    if (code.status !== "AVAILABLE") {
      throw new DeskError("RACE_LOST", "Someone else took the last code. Try again.");
    }
    code.status = "RESERVED";
    code.orderId = orderId;
    code.reservedAt = reservedAt;
    ids.push(code.id);
  }
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
  return withStore((db) => {
    const product = requireProduct(db, productSlug);
    const hashes = plains.map((plain) => codeHash(plain));
    const unique = new Set(hashes);
    if (unique.size !== hashes.length || db.codes.some((code) => unique.has(code.hash))) {
      throw new DeskError("DUPLICATE_CODE", "One of those codes is already on the desk");
    }
    for (let index = 0; index < plains.length; index += 1) {
      const plain = plains[index];
      const hash = hashes[index];
      if (!plain || !hash) continue;
      db.codes.push({
        id: `code_${randomBytes(6).toString("hex")}`,
        productId: product.id,
        cipher: encrypt(plain),
        hash,
        status: "AVAILABLE",
      });
    }
    addAudit(db, "admin", "codes.upload", product.id);
    return { added: plains.length };
  });
}
