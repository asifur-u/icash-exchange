import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/auth";
import { DeskError } from "@/lib/errors";

export async function requireAdmin() {
  const jar = await cookies();
  if (!verifyAdminSession(jar.get("vaulta_admin")?.value)) {
    throw new DeskError("UNAUTHORIZED", "Admin sign-in required");
  }
}

export const adminCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 12,
};
