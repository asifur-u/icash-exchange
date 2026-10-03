import { createHmac, randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { decrypt, encrypt } from "@/lib/crypto";
import { formatBdt } from "@/lib/format";
import { lineTotal } from "@/lib/money";
import { applyPaidWebhook, confirmDemoPayment, createCheckout, getOrderForBuyer } from "@/lib/orders";
import { verifySignature } from "@/lib/payments";
import { getPublicProducts } from "@/lib/store";
import { uploadCodes } from "@/lib/vouchers";

beforeEach(() => {
  process.env.VAULTA_DATA_DIR = mkdtempSync(path.join(tmpdir(), "vaulta-"));
});

describe("money and codes", () => {
  it("prices a line in whole taka", () => {
    expect(lineTotal(500, 2)).toBe(1000);
    expect(formatBdt(1000)).toBe("BDT 1,000");
    expect(() => lineTotal(500, 6)).toThrow();
  });

  it("round-trips encryption and rejects a tampered payload", () => {
    const secret = "DEMO-1000-AB12-CD34";
    const cipher = encrypt(secret);
    expect(decrypt(cipher)).toBe(secret);
    const bytes = Buffer.from(cipher, "base64");
    bytes[bytes.length - 1] ^= 1;
    expect(() => decrypt(bytes.toString("base64"))).toThrow();
  });
});

describe("the desk", () => {
  it("keeps plaintext codes out of the store file", async () => {
    await getPublicProducts();
    const raw = readFileSync(path.join(process.env.VAULTA_DATA_DIR!, "store.json"), "utf8");
    expect(raw.includes("DEMO-")).toBe(false);
    expect(raw.includes("cipher")).toBe(true);
  });

  it("sells the last code only once", async () => {
    const [product] = await getPublicProducts();
    expect(product).toBeDefined();
    for (let index = 0; index < 7; index += 1) {
      await createCheckout({
        productSlug: product!.slug,
        quantity: 1,
        email: `hold${index}@example.com`,
      });
    }

    const results = await Promise.allSettled([
      createCheckout({ productSlug: product!.slug, quantity: 1, email: "a@example.com" }),
      createCheckout({ productSlug: product!.slug, quantity: 1, email: "b@example.com" }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);

    const after = await getPublicProducts();
    expect(after.find((item) => item.slug === product!.slug)?.stock).toBe(0);
  });

  it("delivers a code once, even if the webhook is repeated", async () => {
    const [product] = await getPublicProducts();
    const checkout = await createCheckout({
      productSlug: product!.slug,
      quantity: 1,
      email: "buyer@example.com",
    });

    const event = { id: "evt_1", orderId: checkout.orderId, paymentRef: "pay_1" };
    await Promise.all([applyPaidWebhook(event), applyPaidWebhook(event)]);

    const view = await getOrderForBuyer(checkout.orderId, checkout.token);
    expect(view.status).toBe("DELIVERED");
    expect(view.codes).toHaveLength(1);
    expect(view.codes[0]).toMatch(/^DEMO-/);

    const raw = readFileSync(path.join(process.env.VAULTA_DATA_DIR!, "store.json"), "utf8");
    expect(raw.includes(view.codes[0]!)).toBe(false);
    await expect(getOrderForBuyer(checkout.orderId, "not-the-token")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("confirms a demonstration payment and rejects a duplicate code upload", async () => {
    const [product] = await getPublicProducts();
    const checkout = await createCheckout({
      productSlug: product!.slug,
      quantity: 1,
      email: "guest@example.com",
      phone: "01700000000",
    });
    await confirmDemoPayment(checkout.orderId, checkout.token);
    const view = await getOrderForBuyer(checkout.orderId, checkout.token);
    expect(view.codes).toHaveLength(1);

    const fresh = `VAULTA-${randomBytes(3).toString("hex").toUpperCase()}`;
    await uploadCodes(product!.slug, fresh);
    await expect(uploadCodes(product!.slug, fresh)).rejects.toMatchObject({ code: "DUPLICATE_CODE" });
  });

  it("verifies the webhook signature on the raw body", () => {
    const raw = JSON.stringify({ id: "evt_9", orderId: "ord_1", paymentRef: "pay_9", status: "paid" });
    const signature = createHmac("sha256", "test-webhook-secret").update(raw).digest("hex");
    expect(verifySignature(raw, signature)).toBe(true);
    expect(verifySignature(`${raw} `, signature)).toBe(false);
    expect(verifySignature(raw, "nope")).toBe(false);
  });
});
