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
    const codes = result.codes ?? [];
    return Response.json({
      ok: true,
      emailed: false,
      sms: false,
      codes,
      message:
        codes.length > 0
          ? `Approved. Code ready to copy: ${codes.join(" · ")}`
          : "Approved. Code unlocked on the order page.",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
