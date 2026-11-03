import { DeskError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, noStore, readJson } from "@/lib/http";
import { clientIp, rateLimit, withConcurrency } from "@/lib/limit";
import { userProfileSchema } from "@/lib/schemas";
import { getCurrentUser } from "@/lib/session";
import { updateUserProfile } from "@/lib/users";

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    if (!(await rateLimit(`profile:${clientIp(request)}`, 3, 60_000))) {
      throw new DeskError("RATE_LIMITED", "Max 3 profile updates per minute.");
    }
    const user = await getCurrentUser();
    if (!user) throw new DeskError("UNAUTHORIZED", "Log in first.");
    const body = userProfileSchema.parse(await readJson(request));
    const next = await withConcurrency(`user-write:${user.id}`, 3, () => updateUserProfile(user.id, body));
    return Response.json({ user: next }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
