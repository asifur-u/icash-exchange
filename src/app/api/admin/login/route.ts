import { cookies } from "next/headers";
import { adminPasswordMatches, signAdminSession } from "@/lib/auth";
import { DeskError, toErrorResponse } from "@/lib/errors";
import { adminCookie } from "@/lib/guard";
import { assertSameOrigin, readJson } from "@/lib/http";
import { clientIp, limit } from "@/lib/limit";
import { loginSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (!limit(`login:${clientIp(req)}`, 3, 10 * 60_000)) {
      throw new DeskError("RATE_LIMITED", "Max 3 login attempts. Wait ten minutes.");
    }
    const body = loginSchema.parse(await readJson(req));
    if (!adminPasswordMatches(body.password)) {
      throw new DeskError("UNAUTHORIZED", "That password does not match.");
    }
    const jar = await cookies();
    jar.set("vaulta_admin", signAdminSession(), adminCookie);
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
