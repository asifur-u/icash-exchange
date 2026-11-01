import { DeskError, toErrorResponse } from "@/lib/errors";
import { requireAdmin } from "@/lib/guard";
import { assertSameOrigin, noStore, readJson } from "@/lib/http";
import { clientIp, limit, withConcurrency } from "@/lib/limit";
import { settleSell } from "@/lib/sells";
import { z } from "zod";

const bodySchema = z.object({
  status: z.enum(["PAID", "REJECTED"]),
});

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(req);
    await requireAdmin();
    if (!limit(`admin-sell:${clientIp(req)}`, 6, 60_000)) {
      throw new DeskError("RATE_LIMITED", "Max 6 sale updates per minute.");
    }
    const { id } = await context.params;
    const body = bodySchema.parse(await readJson(req));
    const result = await withConcurrency(`admin-action:${clientIp(req)}`, 3, () => settleSell(id, body.status));
    return Response.json({ ok: true, ...result }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
