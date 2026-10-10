import { DeskError, toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { assertSameOrigin, noStore } from "@/lib/http";
import { clientIp, limit, withConcurrency } from "@/lib/limit";
import { revealOrderCodes } from "@/lib/orders";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    if (!limit(`admin-reveal:${clientIp(req)}`, 3, 60_000)) {
      throw new DeskError("RATE_LIMITED", "Max 3 reveal requests per minute.");
    }
    const { id } = await context.params;
    const result = await withConcurrency(`admin-action:${clientIp(req)}`, 3, () => revealOrderCodes(id));
    return Response.json({ ok: true, codes: result.codes }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
