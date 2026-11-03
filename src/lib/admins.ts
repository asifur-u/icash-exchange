import { getPrisma, isUniqueViolation, transaction } from "@/lib/db";
import { DeskError } from "@/lib/errors";
import { addAudit } from "@/lib/store";
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword, type PublicUser } from "@/lib/users";

export type DeskAdmin = PublicUser & { createdAt: string };

function toDeskAdmin(row: {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  createdAt: Date;
}): DeskAdmin {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avatarUrl,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function adminCount() {
  return getPrisma().user.count({ where: { role: "ADMIN" } });
}

export async function needsOwnerSetup() {
  return (await adminCount()) === 0;
}

export async function listAdmins(): Promise<DeskAdmin[]> {
  const rows = await getPrisma().user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, phone: true, avatarUrl: true, createdAt: true },
  });
  return rows.map(toDeskAdmin);
}

export async function getAdminById(id: string) {
  const row = await getPrisma().user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, avatarUrl: true, createdAt: true, role: true },
  });
  if (!row || row.role !== "ADMIN") return null;
  return toDeskAdmin(row);
}

/** Email + password for an ADMIN user. Same timing as a miss, so emails cannot be probed. */
export async function authenticateAdmin(email: string, password: string) {
  const row = await getPrisma().user.findUnique({ where: { email: email.trim().toLowerCase() } });
  const ok = verifyPassword(password, row?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!row || !ok || row.role !== "ADMIN") {
    throw new DeskError("UNAUTHORIZED", "Email or password is wrong.");
  }
  return toDeskAdmin(row);
}

/**
 * First owner on an empty desk. After this, only a signed-in admin can add more.
 * If the email already belongs to a customer, that account is promoted.
 */
export async function bootstrapOwner(input: { name: string; email: string; phone: string; password: string }) {
  try {
    return await transaction(async (tx) => {
      const count = await tx.user.count({ where: { role: "ADMIN" } });
      if (count > 0) {
        throw new DeskError("CONFLICT", "An owner already exists. Sign in with that email.");
      }
      const email = input.email.trim().toLowerCase();
      const data = {
        name: input.name.trim(),
        phone: input.phone.trim(),
        passwordHash: hashPassword(input.password),
        role: "ADMIN" as const,
      };
      const existing = await tx.user.findUnique({ where: { email } });
      const row = existing
        ? await tx.user.update({ where: { id: existing.id }, data })
        : await tx.user.create({ data: { ...data, email } });
      await addAudit(tx, row.email, existing ? "admin.promote" : "admin.bootstrap", row.id);
      return toDeskAdmin(row);
    });
  } catch (error) {
    if (isUniqueViolation(error, "email")) {
      throw new DeskError("CONFLICT", "An account with this email already exists.");
    }
    throw error;
  }
}

/** Signed-in owner creates another owner, or promotes an existing customer. */
export async function createAdmin(
  actorId: string,
  input: { name: string; email: string; phone: string; password: string },
) {
  try {
    return await transaction(async (tx) => {
      const email = input.email.trim().toLowerCase();
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing?.role === "ADMIN") {
        throw new DeskError("CONFLICT", "That email is already an owner.");
      }
      const data = {
        name: input.name.trim(),
        phone: input.phone.trim(),
        passwordHash: hashPassword(input.password),
        role: "ADMIN" as const,
      };
      const row = existing
        ? await tx.user.update({ where: { id: existing.id }, data })
        : await tx.user.create({ data: { ...data, email } });
      await addAudit(tx, actorId, existing ? "admin.promote" : "admin.create", row.id);
      return toDeskAdmin(row);
    });
  } catch (error) {
    if (isUniqueViolation(error, "email")) {
      throw new DeskError("CONFLICT", "An account with this email already exists.");
    }
    throw error;
  }
}

/** Drops owner access. The account stays as a customer. Last owner cannot be removed. */
export async function demoteAdmin(actorId: string, targetId: string) {
  if (actorId === targetId) {
    throw new DeskError("FORBIDDEN", "You cannot remove your own access.");
  }
  return transaction(async (tx) => {
    const count = await tx.user.count({ where: { role: "ADMIN" } });
    if (count <= 1) {
      throw new DeskError("FORBIDDEN", "The desk needs at least one owner.");
    }
    const moved = await tx.user.updateMany({
      where: { id: targetId, role: "ADMIN" },
      data: { role: "CUSTOMER" },
    });
    if (moved.count === 0) throw new DeskError("NOT_FOUND", "That owner is not on the desk.");
    await addAudit(tx, actorId, "admin.demote", targetId);
    return { id: targetId };
  });
}
