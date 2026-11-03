import { DeskError, toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { assertSameOrigin, noStore } from "@/lib/http";
import { clientIp, rateLimit, withConcurrency } from "@/lib/limit";
import { releasePending } from "@/lib/orders";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    if (!(await rateLimit(`admin-release:${clientIp(req)}`, 3, 60_000))) {
      throw new DeskError("RATE_LIMITED", "Max 3 release requests per minute.");
    }
    const { id } = await context.params;
    await withConcurrency(`admin-action:${clientIp(req)}`, 3, () => releasePending(id));
    return Response.json({ ok: true }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
