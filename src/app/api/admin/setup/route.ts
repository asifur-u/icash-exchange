import { cookies } from "next/headers";
import { bootstrapOwner } from "@/lib/admins";
import { signAdminSession } from "@/lib/auth";
import { DeskError, toErrorResponse } from "@/lib/errors";
import { adminCookie } from "@/lib/guard";
import { assertSameOrigin, readJson } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/limit";
import { adminAccountSchema } from "@/lib/schemas";

/** Creates the first owner when the desk has none. Later owners are added from Settings. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (!(await rateLimit(`admin-setup:${clientIp(req)}`, 3, 60 * 60_000))) {
      throw new DeskError("RATE_LIMITED", "Too many setup attempts. Wait an hour.");
    }
    const body = adminAccountSchema.parse(await readJson(req));
    const admin = await bootstrapOwner(body);
    const jar = await cookies();
    jar.set("vaulta_admin", signAdminSession(admin.id), adminCookie);
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
