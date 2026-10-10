import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeskError } from "@/lib/errors";
import { databaseConfigured, getPrisma } from "@/lib/db";
import { dataDir } from "@/lib/paths";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  avatarUrl?: string | null;
  imageKitFileId?: string | null;
  createdAt: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
};

type UserDb = {
  version: 1;
  users: User[];
};

let chain: Promise<void> = Promise.resolve();

function usersFile() {
  return path.join(dataDir(), "users.json");
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  if (next.length !== expected.length) return false;
  return timingSafeEqual(next, expected);
}

function toPublic(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl ?? null,
  };
}

function mapPrismaUser(row: {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  avatarUrl: string | null;
  imageKitFileId: string | null;
  createdAt: Date;
}): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    passwordHash: row.passwordHash,
    avatarUrl: row.avatarUrl,
    imageKitFileId: row.imageKitFileId,
    createdAt: row.createdAt.toISOString(),
  };
}

async function readUsers(): Promise<UserDb> {
  try {
    const raw = await readFile(usersFile(), "utf8");
    const parsed = JSON.parse(raw) as UserDb;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.users)) {
      throw new Error("User file damaged");
    }
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return { version: 1, users: [] };
  }
}

async function writeUsers(db: UserDb) {
  await mkdir(dataDir(), { recursive: true });
  await writeFile(usersFile(), JSON.stringify(db, null, 2));
}

function withUsers<T>(fn: (db: UserDb) => T | Promise<T>) {
  const run = chain.then(async () => {
    const db = await readUsers();
    const result = await fn(db);
    await writeUsers(db);
    return result;
  });
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function publicUser(user: User) {
  return toPublic(user);
}

export async function registerUser(input: { name: string; email: string; phone: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const phone = input.phone.trim();
  const passwordHash = hashPassword(input.password);

  if (databaseConfigured()) {
    const prisma = getPrisma();
    try {
      const row = await prisma.user.create({
        data: { name, email, phone, passwordHash },
      });
      return toPublic(mapPrismaUser(row));
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") {
        throw new DeskError("CONFLICT", "An account with this email already exists. Log in instead.");
      }
      throw error;
    }
  }

  return withUsers((db) => {
    if (db.users.some((user) => user.email === email)) {
      throw new DeskError("CONFLICT", "An account with this email already exists. Log in instead.");
    }
    const user: User = {
      id: `usr_${randomBytes(8).toString("hex")}`,
      name,
      email,
      phone,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return toPublic(user);
  });
}

export async function authenticateUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();

  if (databaseConfigured()) {
    const row = await getPrisma().user.findUnique({ where: { email: normalized } });
    if (!row || !verifyPassword(password, row.passwordHash)) {
      throw new DeskError("UNAUTHORIZED", "Email or password is wrong.");
    }
    return toPublic(mapPrismaUser(row));
  }

  const db = await readUsers();
  const user = db.users.find((item) => item.email === normalized);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new DeskError("UNAUTHORIZED", "Email or password is wrong.");
  }
  return toPublic(user);
}

export async function getUserById(id: string) {
  if (databaseConfigured()) {
    const row = await getPrisma().user.findUnique({ where: { id } });
    return row ? toPublic(mapPrismaUser(row)) : null;
  }
  const db = await readUsers();
  const user = db.users.find((item) => item.id === id);
  return user ? toPublic(user) : null;
}

export async function updateUserProfile(id: string, input: { name: string; phone: string }) {
  const name = input.name.trim();
  const phone = input.phone.trim();

  if (databaseConfigured()) {
    try {
      const row = await getPrisma().user.update({
        where: { id },
        data: { name, phone },
      });
      return toPublic(mapPrismaUser(row));
    } catch {
      throw new DeskError("NOT_FOUND", "Account not found.");
    }
  }

  return withUsers((db) => {
    const user = db.users.find((item) => item.id === id);
    if (!user) throw new DeskError("NOT_FOUND", "Account not found.");
    user.name = name;
    user.phone = phone;
    return toPublic(user);
  });
}

export async function changeUserPassword(id: string, currentPassword: string, nextPassword: string) {
  if (databaseConfigured()) {
    const row = await getPrisma().user.findUnique({ where: { id } });
    if (!row || !verifyPassword(currentPassword, row.passwordHash)) {
      throw new DeskError("UNAUTHORIZED", "Current password is wrong.");
    }
    await getPrisma().user.update({
      where: { id },
      data: { passwordHash: hashPassword(nextPassword) },
    });
    return;
  }

  await withUsers((db) => {
    const user = db.users.find((item) => item.id === id);
    if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
      throw new DeskError("UNAUTHORIZED", "Current password is wrong.");
    }
    user.passwordHash = hashPassword(nextPassword);
  });
}

export async function updateUserAvatar(id: string, avatarUrl: string, imageKitFileId: string) {
  if (databaseConfigured()) {
    const row = await getPrisma().user.update({
      where: { id },
      data: { avatarUrl, imageKitFileId },
    });
    return toPublic(mapPrismaUser(row));
  }

  return withUsers((db) => {
    const user = db.users.find((item) => item.id === id);
    if (!user) throw new DeskError("NOT_FOUND", "Account not found.");
    user.avatarUrl = avatarUrl;
    user.imageKitFileId = imageKitFileId;
    return toPublic(user);
  });
}

export async function getUserRecordById(id: string) {
  if (databaseConfigured()) {
    const row = await getPrisma().user.findUnique({ where: { id } });
    return row ? mapPrismaUser(row) : null;
  }
  const db = await readUsers();
  return db.users.find((item) => item.id === id) ?? null;
}

export function fingerprint(email: string) {
  return createHash("sha256").update(email).digest("hex").slice(0, 12);
}
