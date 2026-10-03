import { toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { assertSameOrigin } from "@/lib/http";
import { refundOrder } from "@/lib/orders";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    const { id } = await context.params;
    const result = await refundOrder(id);
    return Response.json({ ok: true, revealed: result.revealed });
  } catch (error) {
    return toErrorResponse(error);
  }
}
