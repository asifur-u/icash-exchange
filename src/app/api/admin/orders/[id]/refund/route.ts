import { DeskError, toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { assertSameOrigin, noStore } from "@/lib/http";
import { clientIp, limit, withConcurrency } from "@/lib/limit";
import { refundOrder } from "@/lib/orders";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    if (!limit(`admin-refund:${clientIp(req)}`, 3, 60_000)) {
      throw new DeskError("RATE_LIMITED", "Max 3 refund requests per minute.");
    }
    const { id } = await context.params;
    const result = await withConcurrency(`admin-action:${clientIp(req)}`, 3, () => refundOrder(id));
    return Response.json({ ok: true, revealed: result.revealed }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
