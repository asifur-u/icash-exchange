import { cookies } from "next/headers";
import { verifyUserSession } from "@/lib/auth";
import { getUserById } from "@/lib/users";

export async function getCurrentUser() {
  const jar = await cookies();
  const userId = verifyUserSession(jar.get("icash_user")?.value);
  if (!userId) return null;
  return getUserById(userId);
}
