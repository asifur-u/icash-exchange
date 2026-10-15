import { cookies } from "next/headers";
import { assertCsrf } from "@/lib/csrf";
import { DeskError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, noStore, readJson } from "@/lib/http";
import { clientIp, limit } from "@/lib/limit";
import { userRegisterSchema } from "@/lib/schemas";
import { setUserSessionCookie } from "@/lib/user-session";
import { registerUser } from "@/lib/users";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    assertCsrf(req);

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new DeskError("BAD_INPUT", "Send the form as JSON");
    }

    const body = userRegisterSchema.parse(await readJson(req, 8_000));
    const ip = clientIp(req);
    const emailKey = body.email.trim().toLowerCase();

    if (!limit(`register-ip:${ip}`, 3, 30 * 60_000)) {
      throw new DeskError(
        "RATE_LIMITED",
        "Too many registrations from this network. Wait and try again.",
      );
    }
    if (!limit(`register-email:${emailKey}`, 2, 60 * 60_000)) {
      throw new DeskError(
        "RATE_LIMITED",
        "Too many attempts for this email. Wait a while, or log in instead.",
      );
    }

    const user = await registerUser(body);
    const jar = await cookies();
    setUserSessionCookie(jar, user.id);
    return Response.json({ user }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
