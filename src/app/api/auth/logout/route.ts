import { cookies } from "next/headers";
import { assertSameOrigin, noStore } from "@/lib/http";
import { clearUserSessionCookie } from "@/lib/user-session";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
  } catch {
    // Still clear cookie even if origin check fails on edge cases.
  }
  const jar = await cookies();
  clearUserSessionCookie(jar);
  return Response.json({ ok: true }, { headers: noStore });
}
