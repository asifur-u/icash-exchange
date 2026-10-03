import { createHmac, timingSafeEqual } from "node:crypto";

export function paymentMode(): "demo" | "live" {
  if (process.env.PAYMENT_MODE === "live") return "live";
  if (process.env.PAYMENT_MODE === "demo") return "demo";
  return process.env.NODE_ENV === "production" ? "live" : "demo";
}

export function verifySignature(raw: string, signature: string | null) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
