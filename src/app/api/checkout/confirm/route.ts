import { DeskError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, noStore, readJson, siteOrigin } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/limit";
import { confirmDemoPayment } from "@/lib/orders";
import { confirmSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (!(await rateLimit(`confirm:${clientIp(req)}`, 10, 60_000))) {
      throw new DeskError("RATE_LIMITED", "Too many attempts. Wait a minute.");
    }
    const body = confirmSchema.parse(await readJson(req));
    const result = await confirmDemoPayment(body.orderId, body.token);
    const origin = siteOrigin(req);
    return Response.json(
      { orderUrl: `${origin}/account/orders/${result.orderId}?t=${result.token}` },
      { headers: noStore },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
