import { getPrisma } from "@/lib/db";
import { DeskError, toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { assertSameOrigin, noStore } from "@/lib/http";
import { clientIp, rateLimit, withConcurrency } from "@/lib/limit";
import { approvePayment } from "@/lib/orders";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    if (!(await rateLimit(`admin-approve:${clientIp(req)}`, 12, 60_000))) {
      throw new DeskError("RATE_LIMITED", "Max 12 approvals per minute.");
    }
    const { id } = await context.params;
    const result = await withConcurrency(`admin-action:${clientIp(req)}`, 3, () => approvePayment(id));
    const order = await getPrisma().order.findUnique({ where: { id }, select: { email: true } });
    const email = order?.email ?? "";
    const codes = result.codes ?? [];
    const message =
      result.via === "icash"
        ? `Approved. iCash is sending the voucher to ${email}.`
        : codes.length > 0
          ? "Approved. Code ready to copy below."
          : "Approved. Code unlocked on the order page.";
    return Response.json(
      { ok: true, codes, masked: result.masked, via: result.via, email, message },
      { headers: noStore },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
