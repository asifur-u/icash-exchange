import { demoteAdmin } from "@/lib/admins";
import { DeskError, toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { assertSameOrigin, noStore } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/limit";

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    const me = await requireAdmin();
    if (!(await rateLimit(`admin-staff:${clientIp(req)}`, 6, 60_000))) {
      throw new DeskError("RATE_LIMITED", "Max 6 owner changes per minute.");
    }
    const { id } = await context.params;
    await demoteAdmin(me.id, id);
    return Response.json({ ok: true }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
