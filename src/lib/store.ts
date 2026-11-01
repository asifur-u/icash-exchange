import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { CATALOG } from "@/lib/catalog";
import { encrypt, codeHash } from "@/lib/crypto";
import { DeskError } from "@/lib/errors";
import { dataDir } from "@/lib/paths";
import type { Audit, CodeStatus, Db, Product, PublicProduct } from "@/lib/types";

const HOLD_MS = 15 * 60 * 1000;

let chain: Promise<void> = Promise.resolve();

function storeFile() {
  return path.join(dataDir(), "store.json");
}

function demoCode(faceValue: number) {
  const left = randomBytes(3).toString("hex").toUpperCase();
  const right = randomBytes(3).toString("hex").toUpperCase();
  return `DEMO-${faceValue}-${left}-${right}`;
}

function createSeed(): Db {
  const categoryId = "cat_notes";
  const db: Db = {
    version: 1,
    categories: [{ id: categoryId, name: "Notes", slug: "notes" }],
    products: [],
    codes: [],
    orders: [],
    sells: [],
    audit: [],
    webhooks: [],
    nextNumber: 1042,
  };

  for (const item of CATALOG) {
    const productId = `prd_${item.slug}`;
    db.products.push({
      id: productId,
      title: item.title,
      slug: item.slug,
      blurb: item.blurb,
      faceValue: item.faceValue,
      price: item.price,
      active: true,
      categoryId,
    });
    for (let index = 0; index < 8; index += 1) {
      const plain = demoCode(item.faceValue);
      db.codes.push({
        id: `code_${randomBytes(6).toString("hex")}`,
        productId,
        cipher: encrypt(plain),
        hash: codeHash(plain),
        status: "AVAILABLE",
      });
    }
  }

  return db;
}

async function readDb(): Promise<Db> {
  try {
    const raw = await readFile(storeFile(), "utf8");
    const parsed = JSON.parse(raw) as Db;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.products) || !Array.isArray(parsed.codes)) {
      throw new Error("The local desk file is damaged. Rename .data/store.json and restart.");
    }
    if (!Array.isArray(parsed.sells)) parsed.sells = [];
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const seeded = createSeed();
    await writeDb(seeded);
    return seeded;
  }
}

async function writeDb(db: Db) {
  await mkdir(dataDir(), { recursive: true });
  await writeFile(storeFile(), JSON.stringify(db, null, 2), "utf8");
}

export function withStore<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const db = await readDb();
    const before = JSON.stringify(db);
    const result = await fn(db);
    if (JSON.stringify(db) !== before) await writeDb(db);
    return result;
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function addAudit(db: Db, actor: string, action: string, targetId?: string) {
  const entry: Audit = {
    id: `aud_${randomBytes(4).toString("hex")}`,
    actor,
    action,
    targetId,
    createdAt: new Date().toISOString(),
  };
  db.audit.push(entry);
  if (db.audit.length > 200) db.audit.splice(0, db.audit.length - 200);
}

export function countCodes(db: Db, productId: string, status: CodeStatus) {
  return db.codes.filter((code) => code.productId === productId && code.status === status).length;
}

export function toPublic(db: Db, product: Product): PublicProduct {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    blurb: product.blurb,
    faceValue: product.faceValue,
    price: product.price,
    stock: countCodes(db, product.id, "AVAILABLE"),
  };
}

export function releaseStale(db: Db, now = Date.now()) {
  const cutoff = now - HOLD_MS;
  for (const order of db.orders) {
    if (order.status !== "PENDING") continue;
    const stale = db.codes.some(
      (code) =>
        code.orderId === order.id &&
        code.status === "RESERVED" &&
        code.reservedAt != null &&
        Date.parse(code.reservedAt) < cutoff,
    );
    if (!stale) continue;
    for (const code of db.codes) {
      if (code.orderId === order.id && code.status === "RESERVED") {
        code.status = "AVAILABLE";
        delete code.orderId;
        delete code.reservedAt;
      }
    }
    order.status = "FAILED";
    addAudit(db, "desk", "order.expired", order.id);
  }
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

function canUseEncryptedStore() {
  if (process.env.NODE_ENV !== "production") return true;
  return Boolean(process.env.CODE_ENCRYPTION_KEY);
}

export async function getPublicProducts() {
  if (!canUseEncryptedStore()) return catalogFallbackProducts();
  return withStore((db) => {
    releaseStale(db);
    return db.products.filter((product) => product.active).map((product) => toPublic(db, product));
  });
}

export async function getPublicProduct(slug: string) {
  if (!canUseEncryptedStore()) {
    return catalogFallbackProducts().find((product) => product.slug === slug) ?? null;
  }
  return withStore((db) => {
    releaseStale(db);
    const product = db.products.find((item) => item.slug === slug && item.active);
    return product ? toPublic(db, product) : null;
  });
}

export function requireProduct(db: Db, slug: string) {
  const product = db.products.find((item) => item.slug === slug && item.active);
  if (!product) throw new DeskError("NOT_FOUND", "That note is not on the desk");
  return product;
}
