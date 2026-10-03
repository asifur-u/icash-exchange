import { DeskError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, noStore, readJson, siteOrigin } from "@/lib/http";
import { clientIp, limit } from "@/lib/limit";
import { submitPaymentProof } from "@/lib/orders";
import { paymentProofSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (!limit(`payproof:${clientIp(req)}`, 8, 60_000)) {
      throw new DeskError("RATE_LIMITED", "Too many attempts. Wait a minute.");
    }
    const body = paymentProofSchema.parse(await readJson(req, 4_000_000));
    const result = await submitPaymentProof({
      orderId: body.orderId,
      token: body.token,
      method: body.method,
      transactionId: body.transactionId,
      proofDataUrl: body.proofDataUrl,
    });
    const origin = siteOrigin(req);
    return Response.json(
      { orderUrl: `${origin}/orders/${result.orderId}?t=${result.token}` },
      { headers: noStore },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
