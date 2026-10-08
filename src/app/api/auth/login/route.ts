import { cookies } from "next/headers";
import { signUserSession } from "@/lib/auth";
import { DeskError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, noStore, readJson } from "@/lib/http";
import { clientIp, limit } from "@/lib/limit";
import { userLoginSchema } from "@/lib/schemas";
import { authenticateUser } from "@/lib/users";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (!limit(`user-login:${clientIp(req)}`, 12, 10 * 60_000)) {
      throw new DeskError("RATE_LIMITED", "Too many attempts. Wait a few minutes.");
    }
    const body = userLoginSchema.parse(await readJson(req));
    const user = await authenticateUser(body.email, body.password);
    const jar = await cookies();
    jar.set("icash_user", signUserSession(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return Response.json({ user }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
