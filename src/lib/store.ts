import { randomBytes } from "node:crypto";
import type { Product } from "@prisma/client";
import { CATALOG } from "@/lib/catalog";
import { codeHash, encrypt } from "@/lib/crypto";
import { databaseConfigured, getPrisma, type Tx } from "@/lib/db";
import { DeskError } from "@/lib/errors";
import type { PublicProduct } from "@/lib/types";

export const HOLD_MS = 15 * 60 * 1000;

export function newId(prefix: string, bytes = 8) {
  return `${prefix}_${randomBytes(bytes).toString("hex")}`;
}

function demoCode(faceValue: number) {
  const left = randomBytes(3).toString("hex").toUpperCase();
  const right = randomBytes(3).toString("hex").toUpperCase();
  return `DEMO-${faceValue}-${left}-${right}`;
}

let catalogReady: Promise<void> | null = null;

/** Creates the catalog notes once (plus demo stock outside production). Safe to call concurrently. */
export function ensureCatalog() {
  catalogReady ??= (async () => {
    const prisma = getPrisma();
    for (const item of CATALOG) {
      const id = `prd_${item.slug}`;
      const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
      if (existing) continue;
      try {
        await prisma.product.create({
          data: {
            id,
            slug: item.slug,
            title: item.title,
            blurb: item.blurb,
            faceValue: item.faceValue,
            price: item.price,
          },
        });
      } catch {
        continue;
      }
      if (process.env.NODE_ENV === "production") continue;
      await prisma.voucherCode.createMany({
        data: Array.from({ length: 8 }, () => {
          const plain = demoCode(item.faceValue);
          return { id: newId("code", 6), productId: id, cipher: encrypt(plain), hash: codeHash(plain) };
        }),
        skipDuplicates: true,
      });
    }
  })().catch((error) => {
    catalogReady = null;
    throw error;
  });
  return catalogReady;
}

/** Forget the catalog check (tests truncate tables between runs). */
export function resetCatalogCache() {
  catalogReady = null;
}

/** Next shared reference number (IX-/SX-), atomic across instances. */
export async function nextNumber(tx: Tx, prefix: "IX" | "SX") {
  const counter = await tx.counter.upsert({
    where: { id: "desk" },
    create: { id: "desk", value: 1043 },
    update: { value: { increment: 1 } },
  });
  return `${prefix}-${String(counter.value - 1).padStart(4, "0")}`;
}

export async function addAudit(tx: Tx, actor: string, action: string, targetId?: string) {
  await tx.auditLog.create({ data: { actor, action, targetId } });
}

/** Expires PENDING orders whose stock hold is older than 15 minutes and frees their codes. */
export async function releaseStale(now = Date.now()) {
  const prisma = getPrisma();
  const cutoff = new Date(now - HOLD_MS);
  const stale = await prisma.order.findMany({
    where: { status: "PENDING", codes: { some: { status: "RESERVED", reservedAt: { lt: cutoff } } } },
    select: { id: true },
    take: 100,
  });
  for (const { id } of stale) {
    await prisma.$transaction(async (tx) => {
      const moved = await tx.order.updateMany({ where: { id, status: "PENDING" }, data: { status: "FAILED" } });
      if (moved.count === 0) return;
      await tx.voucherCode.updateMany({
        where: { orderId: id, status: "RESERVED" },
        data: { status: "AVAILABLE", orderId: null, reservedAt: null },
      });
      await addAudit(tx, "desk", "order.expired", id);
    });
  }
}

async function stockByProduct() {
  const rows = await getPrisma().voucherCode.groupBy({
    by: ["productId", "status"],
    _count: { _all: true },
  });
  const map = new Map<string, Record<string, number>>();
  for (const row of rows) {
    const entry = map.get(row.productId) ?? {};
    entry[row.status] = row._count._all;
    map.set(row.productId, entry);
  }
  return map;
}

export function toPublic(product: Product, stock: number): PublicProduct {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    blurb: product.blurb,
    faceValue: product.faceValue,
    price: product.price,
    stock,
  };
}

export async function productsWithStock() {
  await ensureCatalog();
  const [products, stock] = await Promise.all([
    getPrisma().product.findMany({ where: { active: true }, orderBy: { faceValue: "asc" } }),
    stockByProduct(),
  ]);
  return products.map((product) => ({ product, counts: stock.get(product.id) ?? {} }));
}

function catalogFallbackProducts(): PublicProduct[] {
  return CATALOG.map((item) => ({
    id: `prd_${item.slug}`,
    slug: item.slug,
    title: item.title,
    blurb: item.blurb,
    faceValue: item.faceValue,
    price: item.price,
    stock: 0,
  }));
}

function canUseDesk() {
  if (!databaseConfigured()) return false;
  if (process.env.NODE_ENV !== "production") return true;
  return Boolean(process.env.CODE_ENCRYPTION_KEY);
}

export async function getPublicProducts() {
  if (!canUseDesk()) return catalogFallbackProducts();
  await releaseStale();
  const rows = await productsWithStock();
  return rows.map(({ product, counts }) => toPublic(product, counts.AVAILABLE ?? 0));
}

export async function getPublicProduct(slug: string) {
  const products = await getPublicProducts();
  return products.find((product) => product.slug === slug) ?? null;
}

export async function requireProduct(tx: Tx, slug: string) {
  await ensureCatalog();
  const product = await tx.product.findFirst({ where: { slug, active: true } });
  if (!product) throw new DeskError("NOT_FOUND", "That note is not on the desk");
  return product;
}
