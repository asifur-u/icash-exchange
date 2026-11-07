import { cookies } from "next/headers";
import { verifyUserSession } from "@/lib/auth";
import { getUserById } from "@/lib/users";

export async function getCurrentUser() {
  try {
    const jar = await cookies();
    const userId = verifyUserSession(jar.get("icash_user")?.value);
    if (!userId) return null;
    return await getUserById(userId);
  } catch (error) {
    console.error("[iCash] session lookup failed", error instanceof Error ? error.message : error);
    return null;
  }
}
