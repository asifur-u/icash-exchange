import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { User as UserRow } from "@prisma/client";
import { getPrisma, isUniqueViolation } from "@/lib/db";
import { DeskError } from "@/lib/errors";

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

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

/** Fixed dummy hash so missing-user logins still burn scrypt time. */
export const DUMMY_PASSWORD_HASH = (() => {
  const salt = "0".repeat(32);
  const hash = scryptSync("icash-dummy-password", salt, 32).toString("hex");
  return `${salt}:${hash}`;
})();

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) {
    // Still run a scrypt so callers can't skip work on malformed hashes.
    scryptSync(password, "0".repeat(32), 32);
    return false;
  }
  const next = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  if (next.length !== expected.length) return false;
  return timingSafeEqual(next, expected);
}

function toPublic(user: Pick<User, "id" | "name" | "email" | "phone" | "avatarUrl">): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl ?? null,
  };
}

function toUser(row: UserRow): User {
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

function notFound(error: unknown) {
  return (error as { code?: string })?.code === "P2025";
}

export function publicUser(user: User) {
  return toPublic(user);
}

export async function registerUser(input: { name: string; email: string; phone: string; password: string }) {
  try {
    const row = await getPrisma().user.create({
      data: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        passwordHash: hashPassword(input.password),
      },
    });
    return toPublic(row);
  } catch (error) {
    if (isUniqueViolation(error, "email")) {
      throw new DeskError("CONFLICT", "An account with this email already exists. Log in instead.");
    }
    throw error;
  }
}

export async function authenticateUser(email: string, password: string) {
  const row = await getPrisma().user.findUnique({ where: { email: email.trim().toLowerCase() } });
  // Always verify against a real or dummy hash (mitigates user-enumeration timing).
  const ok = verifyPassword(password, row?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!row || !ok) throw new DeskError("UNAUTHORIZED", "Email or password is wrong.");
  return toPublic(row);
}

export async function getUserById(id: string) {
  const row = await getPrisma().user.findUnique({ where: { id } });
  return row ? toPublic(row) : null;
}

export async function updateUserProfile(id: string, input: { name: string; phone: string }) {
  try {
    const row = await getPrisma().user.update({
      where: { id },
      data: { name: input.name.trim(), phone: input.phone.trim() },
    });
    return toPublic(row);
  } catch (error) {
    if (notFound(error)) throw new DeskError("NOT_FOUND", "Account not found.");
    throw error;
  }
}

export async function changeUserPassword(id: string, currentPassword: string, nextPassword: string) {
  const prisma = getPrisma();
  const row = await prisma.user.findUnique({ where: { id } });
  if (!row || !verifyPassword(currentPassword, row.passwordHash)) {
    throw new DeskError("UNAUTHORIZED", "Current password is wrong.");
  }
  await prisma.user.update({ where: { id }, data: { passwordHash: hashPassword(nextPassword) } });
}

export async function updateUserAvatar(id: string, avatarUrl: string, imageKitFileId: string) {
  try {
    const row = await getPrisma().user.update({ where: { id }, data: { avatarUrl, imageKitFileId } });
    return toPublic(row);
  } catch (error) {
    if (notFound(error)) throw new DeskError("NOT_FOUND", "Account not found.");
    throw error;
  }
}

export async function getUserRecordById(id: string) {
  const row = await getPrisma().user.findUnique({ where: { id } });
  return row ? toUser(row) : null;
}

export function fingerprint(email: string) {
  return createHash("sha256").update(email).digest("hex").slice(0, 12);
}
