import { DeskError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, noStore, readJson } from "@/lib/http";
import { clientIp, rateLimit, withConcurrency } from "@/lib/limit";
import { userPasswordSchema } from "@/lib/schemas";
import { getCurrentUser } from "@/lib/session";
import { changeUserPassword } from "@/lib/users";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (!(await rateLimit(`password:${clientIp(request)}`, 3, 10 * 60_000))) {
      throw new DeskError("RATE_LIMITED", "Max 3 password changes. Wait a few minutes.");
    }
    const user = await getCurrentUser();
    if (!user) throw new DeskError("UNAUTHORIZED", "Log in first.");
    const body = userPasswordSchema.parse(await readJson(request));
    await withConcurrency(`user-write:${user.id}`, 3, () =>
      changeUserPassword(user.id, body.currentPassword, body.nextPassword),
    );
    return Response.json({ ok: true }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
