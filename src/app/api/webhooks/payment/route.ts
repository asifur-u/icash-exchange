import { DeskError } from "@/lib/errors";
import { applyPaidWebhook } from "@/lib/orders";
import { verifySignature } from "@/lib/payments";
import { webhookSchema } from "@/lib/schemas";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-signature"))) {
    return new Response("invalid", { status: 401 });
  }

  try {
    const event = webhookSchema.parse(JSON.parse(raw) as unknown);
    if (event.status !== "paid") return new Response("ok");
    await applyPaidWebhook(event);
    return new Response("ok");
  } catch (error) {
    if (error instanceof DeskError && error.code === "NOT_FOUND") {
      return new Response("invalid", { status: 404 });
    }
    console.error("webhook_failed");
    return new Response("invalid", { status: 400 });
  }
}
