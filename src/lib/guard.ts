import { cookies } from "next/headers";
import { getAdminById, type DeskAdmin } from "@/lib/admins";
import { verifyAdminSession } from "@/lib/auth";
import { DeskError } from "@/lib/errors";
import { cookieSecure } from "@/lib/http";

export async function getAdminSession(): Promise<DeskAdmin | null> {
  const jar = await cookies();
  const userId = verifyAdminSession(jar.get("vaulta_admin")?.value);
  if (!userId) return null;
  return getAdminById(userId);
}

export async function requireAdmin() {
  const admin = await getAdminSession();
  if (!admin) throw new DeskError("UNAUTHORIZED", "Admin sign-in required");
  return admin;
}

export const adminCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
    secure: cookieSecure(),
  path: "/",
  maxAge: 60 * 60 * 12,
};
