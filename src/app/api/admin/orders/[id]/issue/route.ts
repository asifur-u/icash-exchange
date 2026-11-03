import { DeskError, toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { assertSameOrigin, noStore } from "@/lib/http";
import { clientIp, rateLimit, withConcurrency } from "@/lib/limit";
import { issueVoucherForOrder } from "@/lib/orders";

/** Retries iCash issuance for a paid order. Safe to repeat — the order id is the iCash reference. */
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    if (!(await rateLimit(`admin-issue:${clientIp(req)}`, 6, 60_000))) {
      throw new DeskError("RATE_LIMITED", "Max 6 retries per minute.");
    }
    const { id } = await context.params;
    const result = await withConcurrency(`admin-action:${clientIp(req)}`, 3, () => issueVoucherForOrder(id));
    return Response.json(
      {
        ok: true,
        codes: result.codes,
        masked: result.masked,
        message: `Voucher generated: ${result.masked.join(", ")}.`,
      },
      { headers: noStore },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
