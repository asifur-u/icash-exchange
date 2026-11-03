import { cookies } from "next/headers";
import { assertCsrf } from "@/lib/csrf";
import { DeskError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, noStore, readJson } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/limit";
import { userLoginSchema } from "@/lib/schemas";
import { setUserSessionCookie } from "@/lib/user-session";
import { authenticateUser } from "@/lib/users";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  const started = Date.now();
  try {
    assertSameOrigin(req);
    assertCsrf(req);

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new DeskError("BAD_INPUT", "Send the form as JSON");
    }

    const body = userLoginSchema.parse(await readJson(req, 8_000));
    const emailKey = body.email.trim().toLowerCase();
    const ip = clientIp(req);

    if (!(await rateLimit(`user-login-ip:${ip}`, 5, 15 * 60_000))) {
      throw new DeskError(
        "RATE_LIMITED",
        "Too many login attempts from this network. Wait 15 minutes.",
      );
    }
    if (!(await rateLimit(`user-login-email:${emailKey}`, 3, 15 * 60_000))) {
      throw new DeskError(
        "RATE_LIMITED",
        "Too many tries for this email. Wait 15 minutes, then try again.",
      );
    }

    const user = await authenticateUser(body.email, body.password);
    const jar = await cookies();
    setUserSessionCookie(jar, user.id);

    // Floor response time so success/fail look similar.
    const elapsed = Date.now() - started;
    if (elapsed < 400) await sleep(400 - elapsed);

    return Response.json({ user }, { headers: noStore });
  } catch (error) {
    const elapsed = Date.now() - started;
    // Slow failed attempts (brute-force friction) without blocking the event loop forever.
    if (elapsed < 700) await sleep(700 - elapsed);
    return toErrorResponse(error);
  }
}
