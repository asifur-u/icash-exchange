import { DeskError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, noStore, readJson } from "@/lib/http";
import { deleteFromImageKit } from "@/lib/imagekit";
import { saveAvatarImage } from "@/lib/proofs";
import { userAvatarSchema } from "@/lib/schemas";
import { getCurrentUser } from "@/lib/session";
import { getUserRecordById, updateUserAvatar } from "@/lib/users";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await getCurrentUser();
    if (!user) throw new DeskError("UNAUTHORIZED", "Log in first.");
    const body = userAvatarSchema.parse(await readJson(request, 4_000_000));
    const previous = await getUserRecordById(user.id);
    const uploaded = await saveAvatarImage(user.id, body.avatarDataUrl);
    const next = await updateUserAvatar(user.id, uploaded.url, uploaded.fileId);
    if (previous?.imageKitFileId && previous.imageKitFileId !== uploaded.fileId) {
      await deleteFromImageKit(previous.imageKitFileId);
    }
    return Response.json({ user: next }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
