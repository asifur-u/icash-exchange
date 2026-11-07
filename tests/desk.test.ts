import { createHmac, randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { decrypt, encrypt } from "@/lib/crypto";
import { getPrisma } from "@/lib/db";
import { formatBdt } from "@/lib/format";
import { lineTotal } from "@/lib/money";
import {
  applyPaidWebhook,
  approvePayment,
  confirmDemoPayment,
  createCheckout,
  getAdminSnapshot,
  getOrderForBuyer,
  submitPaymentProof,
} from "@/lib/orders";
import { verifySignature } from "@/lib/payments";
import { createSell, settleSell } from "@/lib/sells";
import { getPublicProducts } from "@/lib/store";
import { authenticateUser, registerUser } from "@/lib/users";
import { uploadCodes } from "@/lib/vouchers";
import { resetDb } from "./db";

const PIXEL = `data:image/png;base64,${Buffer.alloc(1200, 7).toString("base64")}`;

beforeEach(async () => {
  await resetDb();
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
  it("keeps plaintext codes out of the database", async () => {
    await getPublicProducts();
    const rows = await getPrisma().voucherCode.findMany({ select: { cipher: true, hash: true } });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((row) => row.cipher.includes("DEMO-") || row.hash.includes("DEMO-"))).toBe(false);
  });

  it("reserves the last code only once under concurrency", async () => {
    const [product] = await getPublicProducts();
    expect(product).toBeDefined();
    for (let index = 0; index < 7; index += 1) {
      await createCheckout({ productSlug: product!.slug, quantity: 1, email: `hold${index}@example.com` });
    }

    const results = await Promise.all([
      createCheckout({ productSlug: product!.slug, quantity: 1, email: "a@example.com" }),
      createCheckout({ productSlug: product!.slug, quantity: 1, email: "b@example.com" }),
    ]);
    const held = await Promise.all(
      results.map((result) => getPrisma().voucherCode.count({ where: { orderId: result.orderId } })),
    );
    expect(held.sort()).toEqual([0, 1]);

    const after = await getPublicProducts();
    expect(after.find((item) => item.slug === product!.slug)?.stock).toBe(0);
  });

  it("delivers a code once, even if the webhook is repeated", async () => {
    const [product] = await getPublicProducts();
    const checkout = await createCheckout({ productSlug: product!.slug, quantity: 1, email: "buyer@example.com" });

    const event = { id: "evt_1", orderId: checkout.orderId, paymentRef: "pay_1" };
    await Promise.all([applyPaidWebhook(event), applyPaidWebhook(event)]);

    const view = await getOrderForBuyer(checkout.orderId, checkout.token);
    expect(view.status).toBe("DELIVERED");
    expect(view.codes).toHaveLength(1);
    expect(view.codes[0]).toMatch(/^DEMO-/);
    expect(await getPrisma().voucherCode.count({ where: { orderId: checkout.orderId, status: "SOLD" } })).toBe(1);
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

  it("locks a token pack to the listed taka with no desk fee", async () => {
    const checkout = await createCheckout({
      amount: 750,
      quantity: 1,
      email: "pack@example.com",
      name: "45 tokens",
      lockTotal: true,
    });
    const order = await getPrisma().order.findUniqueOrThrow({ where: { id: checkout.orderId } });
    expect(order.voucher).toBe(750);
    expect(order.total).toBe(750);
    expect(order.name).toBe("45 tokens");
  });

  it("refuses a transaction ID that already backs another order", async () => {
    const first = await createCheckout({ amount: 750, quantity: 1, email: "one@example.com" });
    const second = await createCheckout({ amount: 750, quantity: 1, email: "two@example.com" });
    const proof = { method: "bkash" as const, transactionId: "TRX12345", proofDataUrl: PIXEL };
    await submitPaymentProof({ orderId: first.orderId, token: first.token, ...proof });
    await expect(
      submitPaymentProof({ orderId: second.orderId, token: second.token, ...proof }),
    ).rejects.toMatchObject({ code: "DUPLICATE_PAYMENT" });
  });

  it("approves once even when the admin double-clicks", async () => {
    const checkout = await createCheckout({ amount: 750, quantity: 1, email: "twice@example.com" });
    await submitPaymentProof({
      orderId: checkout.orderId,
      token: checkout.token,
      method: "nagad",
      transactionId: "NGD999",
      proofDataUrl: PIXEL,
    });
    const results = await Promise.allSettled([approvePayment(checkout.orderId), approvePayment(checkout.orderId)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await getPrisma().auditLog.count({ where: { action: "order.approve" } })).toBe(1);
  });

  it("keeps one live sell per voucher and books the margin", async () => {
    const input = {
      name: "Seller",
      email: "seller@example.com",
      phone: "01700000000",
      faceValue: 1000,
      method: "bkash" as const,
      payoutNumber: "01800000000",
      voucherCode: "ICASH-SELL-0001",
    };
    const sale = await createSell(input);
    await expect(createSell(input)).rejects.toMatchObject({ code: "DUPLICATE_CODE" });
    const row = await getPrisma().sell.findUniqueOrThrow({ where: { number: sale.number } });
    await settleSell(row.id, "PAID");
    await expect(settleSell(row.id, "PAID")).rejects.toMatchObject({ code: "NOT_PAYABLE" });

    const { ledger } = await getAdminSnapshot();
    expect(ledger.today.sellCount).toBe(1);
    expect(ledger.today.revenue).toBe(sale.faceValue - sale.payout);
  });

  it("creates the first owner then signs in with that email", async () => {
    const { authenticateAdmin, bootstrapOwner, createAdmin, demoteAdmin, needsOwnerSetup } = await import(
      "@/lib/admins"
    );
    expect(await needsOwnerSetup()).toBe(true);
    const owner = await bootstrapOwner({
      name: "Stolen",
      email: "Owner@Example.com",
      phone: "01755555555",
      password: "Ownerpass1",
    });
    expect(owner.email).toBe("owner@example.com");
    expect(await needsOwnerSetup()).toBe(false);
    await expect(bootstrapOwner({ ...owner, phone: "01755555555", password: "Ownerpass1", name: "Again" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(authenticateAdmin("owner@example.com", "Ownerpass1")).resolves.toMatchObject({ id: owner.id });
    await expect(authenticateAdmin("owner@example.com", "wrongpass1")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(authenticateAdmin("nobody@example.com", "Ownerpass1")).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    const second = await createAdmin(owner.id, {
      name: "Second",
      email: "second@example.com",
      phone: "01766666666",
      password: "Secondpass1",
    });
    await expect(demoteAdmin(owner.id, owner.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await demoteAdmin(owner.id, second.id);
    await expect(authenticateAdmin("second@example.com", "Secondpass1")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("registers and signs in a user", async () => {
    const user = await registerUser({ name: "Rahim", email: "Rahim@Example.com", phone: "01711111111", password: "s3cret-pass" });
    expect(user.email).toBe("rahim@example.com");
    await expect(
      registerUser({ name: "Again", email: "rahim@example.com", phone: "01711111111", password: "x" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(authenticateUser("rahim@example.com", "s3cret-pass")).resolves.toMatchObject({ id: user.id });
    await expect(authenticateUser("rahim@example.com", "wrong")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("verifies the webhook signature on the raw body", () => {
    const raw = JSON.stringify({ id: "evt_9", orderId: "ord_1", paymentRef: "pay_9", status: "paid" });
    const signature = createHmac("sha256", "test-webhook-secret").update(raw).digest("hex");
    expect(verifySignature(raw, signature)).toBe(true);
    expect(verifySignature(`${raw} `, signature)).toBe(false);
    expect(verifySignature(raw, "nope")).toBe(false);
  });
});
