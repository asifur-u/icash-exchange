import { DeskError, toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { assertSameOrigin, noStore } from "@/lib/http";
import { clientIp, limit, withConcurrency } from "@/lib/limit";
import { approvePayment } from "@/lib/orders";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    if (!limit(`admin-approve:${clientIp(req)}`, 3, 60_000)) {
      throw new DeskError("RATE_LIMITED", "Max 3 approve requests per minute.");
    }
    const { id } = await context.params;
    const result = await withConcurrency(`admin-action:${clientIp(req)}`, 3, () => approvePayment(id));
    const codes = result.codes ?? [];
    return Response.json(
      {
        ok: true,
        codes,
        message: codes.length > 0 ? "Approved. Code ready to copy below." : "Approved. Code unlocked on the order page.",
      },
      { headers: noStore },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
