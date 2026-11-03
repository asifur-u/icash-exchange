import { cookies } from "next/headers";
import { authenticateAdmin } from "@/lib/admins";
import { signAdminSession } from "@/lib/auth";
import { DeskError, toErrorResponse } from "@/lib/errors";
import { adminCookie } from "@/lib/guard";
import { assertSameOrigin, readJson } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/limit";
import { adminLoginSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const ip = clientIp(req);
    if (!(await rateLimit(`admin-login:${ip}`, 5, 15 * 60_000))) {
      throw new DeskError("RATE_LIMITED", "Max 5 login attempts. Wait fifteen minutes.");
    }
    const body = adminLoginSchema.parse(await readJson(req));
    if (!(await rateLimit(`admin-login-email:${body.email.toLowerCase()}`, 5, 15 * 60_000))) {
      throw new DeskError("RATE_LIMITED", "Max 5 login attempts for this email. Wait fifteen minutes.");
    }
    const admin = await authenticateAdmin(body.email, body.password);
    const jar = await cookies();
    jar.set("vaulta_admin", signAdminSession(admin.id), adminCookie);
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
