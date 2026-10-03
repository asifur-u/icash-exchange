import { toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { assertSameOrigin } from "@/lib/http";
import { resendOrder } from "@/lib/orders";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    const { id } = await context.params;
    const result = await resendOrder(id);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
