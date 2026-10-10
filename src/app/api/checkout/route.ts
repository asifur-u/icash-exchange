import { DeskError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, noStore, readJson, siteOrigin } from "@/lib/http";
import { clientIp, limit, withConcurrency } from "@/lib/limit";
import { createCheckout } from "@/lib/orders";
import { checkoutSchema } from "@/lib/schemas";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (!limit(`checkout:${clientIp(req)}`, 3, 60_000)) {
      throw new DeskError("RATE_LIMITED", "Max 3 checkout requests per minute.");
    }
    const user = await getCurrentUser();
    if (!user) {
      throw new DeskError("UNAUTHORIZED", "Log in or create an account before you buy.");
    }
    const body = checkoutSchema.parse(await readJson(req));
    const result = await withConcurrency(`checkout-run:${user.id}`, 3, () =>
      createCheckout({
        productSlug: body.productSlug,
        quantity: body.quantity,
        email: user.email,
        phone: body.phone || user.phone,
        userId: user.id,
      }),
    );
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
