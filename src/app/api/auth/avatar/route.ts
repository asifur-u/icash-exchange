import { DeskError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, noStore, readJson } from "@/lib/http";
import { deleteFromImageKit } from "@/lib/imagekit";
import { clientIp, rateLimit, withConcurrency } from "@/lib/limit";
import { saveAvatarImage } from "@/lib/proofs";
import { userAvatarSchema } from "@/lib/schemas";
import { getCurrentUser } from "@/lib/session";
import { getUserRecordById, updateUserAvatar } from "@/lib/users";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    if (!(await rateLimit(`avatar:${clientIp(request)}`, 3, 60_000))) {
      throw new DeskError("RATE_LIMITED", "Max 3 avatar uploads per minute.");
    }
    const user = await getCurrentUser();
    if (!user) throw new DeskError("UNAUTHORIZED", "Log in first.");
    const body = userAvatarSchema.parse(await readJson(request, 4_000_000));
    const previous = await getUserRecordById(user.id);

    const { next, fileId } = await withConcurrency(`user-write:${user.id}`, 3, async () => {
      const uploaded = await saveAvatarImage(user.id, body.avatarDataUrl);
      const updated = await updateUserAvatar(user.id, uploaded.url, uploaded.fileId);
      return { next: updated, fileId: uploaded.fileId };
    });

    if (previous?.imageKitFileId && previous.imageKitFileId !== fileId) {
      await deleteFromImageKit(previous.imageKitFileId);
    }
    return Response.json({ user: next }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
