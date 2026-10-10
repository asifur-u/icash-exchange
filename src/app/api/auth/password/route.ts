import { DeskError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, noStore, readJson } from "@/lib/http";
import { userPasswordSchema } from "@/lib/schemas";
import { getCurrentUser } from "@/lib/session";
import { changeUserPassword } from "@/lib/users";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new DeskError("UNAUTHORIZED", "Log in first.");
    const body = userPasswordSchema.parse(await readJson(request));
    await changeUserPassword(user.id, body.currentPassword, body.nextPassword);
    return Response.json({ ok: true }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
