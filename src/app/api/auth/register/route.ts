import { cookies } from "next/headers";
import { signUserSession } from "@/lib/auth";
import { DeskError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, noStore, readJson } from "@/lib/http";
import { clientIp, limit } from "@/lib/limit";
import { userRegisterSchema } from "@/lib/schemas";
import { registerUser } from "@/lib/users";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (!limit(`register:${clientIp(req)}`, 3, 10 * 60_000)) {
      throw new DeskError("RATE_LIMITED", "Max 3 register attempts. Wait a few minutes.");
    }
    const body = userRegisterSchema.parse(await readJson(req));
    const user = await registerUser(body);
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
