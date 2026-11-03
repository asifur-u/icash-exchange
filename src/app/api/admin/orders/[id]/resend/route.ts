import { DeskError, toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { assertSameOrigin, noStore } from "@/lib/http";
import { clientIp, rateLimit, withConcurrency } from "@/lib/limit";
import { resendOrder } from "@/lib/orders";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    if (!(await rateLimit(`admin-resend:${clientIp(req)}`, 3, 60_000))) {
      throw new DeskError("RATE_LIMITED", "Max 3 resend requests per minute.");
    }
    const { id } = await context.params;
    const result = await withConcurrency(`admin-action:${clientIp(req)}`, 3, () => resendOrder(id));
    return Response.json(result, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
