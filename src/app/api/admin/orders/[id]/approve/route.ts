import { toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { assertSameOrigin } from "@/lib/http";
import { approvePayment } from "@/lib/orders";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    const { id } = await context.params;
    const result = await approvePayment(id);
    return Response.json({
      ok: true,
      emailed: result.emailed,
      sms: result.sms,
      message: result.emailed
        ? "Approved. Voucher code emailed to the buyer."
        : "Approved. Code is on the order page. Configure SMTP to email codes.",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
