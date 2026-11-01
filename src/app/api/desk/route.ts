import { DeskError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, noStore, readJson } from "@/lib/http";
import { clientIp, limit, withConcurrency } from "@/lib/limit";
import { createCheckout, submitPaymentProof } from "@/lib/orders";
import { deskRequestSchema } from "@/lib/schemas";
import { createSell } from "@/lib/sells";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (!limit(`desk:${clientIp(req)}`, 3, 60_000)) {
      throw new DeskError("RATE_LIMITED", "Max 3 requests per minute.");
    }
    const body = deskRequestSchema.parse(await readJson(req, 4_000_000));
    const result = await withConcurrency(`desk-run:${clientIp(req)}`, 2, async () => {
      if (body.intent === "sell") {
        return createSell({
          name: body.name,
          email: body.email,
          phone: body.phone,
          faceValue: body.amount,
          method: body.method,
          payoutNumber: body.payoutNumber,
          voucherCode: body.voucherCode,
        });
      }

      const order = await createCheckout({
        amount: body.amount,
        quantity: 1,
        email: body.email,
        name: body.name,
        phone: body.phone,
      });
      await submitPaymentProof({
        orderId: order.orderId,
        token: order.token,
        method: body.method,
        transactionId: body.transactionId,
        proofDataUrl: body.proofDataUrl,
      });
      return { number: order.number };
    });
    return Response.json({ number: result.number, email: body.email }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
