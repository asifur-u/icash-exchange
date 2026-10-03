import { DeskError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, noStore, readJson, siteOrigin } from "@/lib/http";
import { clientIp, limit } from "@/lib/limit";
import { createCheckout } from "@/lib/orders";
import { checkoutSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (!limit(`checkout:${clientIp(req)}`, 10, 60_000)) {
      throw new DeskError("RATE_LIMITED", "Too many attempts. Wait a minute.");
    }
    const body = checkoutSchema.parse(await readJson(req));
    const result = await createCheckout({
      productSlug: body.productSlug,
      quantity: body.quantity,
      email: body.email,
      phone: body.phone,
    });
    const origin = siteOrigin(req);
    return Response.json(
      {
        orderId: result.orderId,
        number: result.number,
        paymentUrl: `${origin}/pay/${result.orderId}?t=${result.token}`,
      },
      { headers: noStore },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
