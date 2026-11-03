import { DeskError, toErrorResponse } from "@/lib/errors";
import { assertSameOrigin, noStore, readJson } from "@/lib/http";
import { later } from "@/lib/later";
import { clientIp, rateLimit, withConcurrency } from "@/lib/limit";
import { notifyAdminBuy, notifyAdminSell, notifyBuyerReceived } from "@/lib/notify";
import { createCheckout, submitPaymentProof } from "@/lib/orders";
import { deskRequestSchema } from "@/lib/schemas";
import { createSell } from "@/lib/sells";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const ip = clientIp(req);
    if (!(await rateLimit(`desk:${ip}`, 3, 60_000))) {
      throw new DeskError("RATE_LIMITED", "Max 3 requests per minute.");
    }
    if (!(await rateLimit(`desk-day:${ip}`, 20, 24 * 60 * 60_000))) {
      throw new DeskError("RATE_LIMITED", "Too many requests from this network today. Try again tomorrow.");
    }
    const body = deskRequestSchema.parse(await readJson(req, 4_000_000));
    if (!(await rateLimit(`desk-email:${body.email.toLowerCase()}`, 6, 60 * 60_000))) {
      throw new DeskError("RATE_LIMITED", "Too many requests for this email. Wait an hour.");
    }
    const result = await withConcurrency(`desk-run:${ip}`, 2, async () => {
      if (body.intent === "sell") {
        const sell = await createSell({
          name: body.name,
          email: body.email,
          phone: body.phone,
          faceValue: body.amount,
          method: body.method,
          payoutNumber: body.payoutNumber,
          voucherCode: body.voucherCode,
        });
        later(() =>
          notifyAdminSell({
            number: sell.number,
            name: body.name,
            email: body.email,
            phone: body.phone,
            faceValue: sell.faceValue,
            payout: sell.payout,
            method: body.method,
            payoutNumber: body.payoutNumber,
          }),
        );
        return { number: sell.number };
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
      const alert = {
        number: order.number,
        name: body.name,
        email: body.email,
        phone: body.phone,
        voucher: body.amount,
        total: order.total,
        method: body.method,
        transactionId: body.transactionId.trim().toUpperCase(),
      };
      later(async () => {
        await notifyAdminBuy(alert);
        await notifyBuyerReceived(alert);
      });
      return { number: order.number };
    });
    return Response.json({ number: result.number, email: body.email }, { headers: noStore });
  } catch (error) {
    return toErrorResponse(error);
  }
}
