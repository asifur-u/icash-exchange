import { DeskError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, noStore, readJson } from "@/lib/http";
import { userProfileSchema } from "@/lib/schemas";
import { getCurrentUser } from "@/lib/session";
import { updateUserProfile } from "@/lib/users";

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new DeskError("UNAUTHORIZED", "Log in first.");
    const body = userProfileSchema.parse(await readJson(request));
    const next = await updateUserProfile(user.id, body);
    return Response.json({ user: next }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
