import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/db";
import { resetIcashToken } from "@/lib/icash";
import { rateLimit, resetLimits } from "@/lib/limit";
import {
  approvePayment,
  confirmDemoPayment,
  createCheckout,
  getAdminSnapshot,
  getOrderForBuyer,
  issueVoucherForOrder,
} from "@/lib/orders";
import { resetDb } from "./db";

type Forced = (body: Record<string, unknown>) => { status: number; json: unknown };

function reply(status: number, json: unknown) {
  return new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } });
}

function fakeIcash() {
  const calls: Array<{ path: string; body?: Record<string, unknown>; auth: string | null }> = [];
  const issued = new Map<string, { currency: string; amount: number; code: string; destination_email?: string }>();
  const createQueue: Forced[] = [];
  let tokens = 0;

  const remember = (body: Record<string, unknown>) => {
    const ref = String(body.reseller_reference_order_id);
    const card = {
      currency: String(body.card_currency),
      amount: Number(body.card_amount),
      code: body.destination_email ? "******ab12cd" : "FULL-CODE-ab12cd",
      destination_email: body.destination_email as string | undefined,
    };
    issued.set(ref, card);
    return card;
  };

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL, init: RequestInit = {}) => {
      const url = new URL(String(input));
      const body = init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined;
      calls.push({ path: url.pathname, body, auth: new Headers(init.headers).get("authorization") });

      if (url.pathname.endsWith("/api-auth")) {
        tokens += 1;
        return reply(200, { status: "success", data: { access_token: `tok${tokens}`, expires_in: 360000 } });
      }
      if (url.pathname.endsWith("/issuance/create")) {
        const forced = createQueue.shift();
        if (forced) {
          const out = forced(body!);
          return reply(out.status, out.json);
        }
        if (issued.has(String(body!.reseller_reference_order_id))) {
          return reply(500, { status: "failure", internal_term: "card_api_error", message: "dup" });
        }
        const card = remember(body!);
        return reply(200, {
          status: "success",
          uuid: "uuid-1",
          total_amount: Number(body!.card_amount) * 0.0083,
          exchange_rate: 0.0083,
          cards: [{ currency: card.currency, amount: card.amount, code: card.code }],
        });
      }
      if (url.pathname.endsWith("/issuance/info")) {
        const ref = url.searchParams.get("reseller_reference_order_id")!;
        const card = issued.get(ref);
        return reply(
          200,
          card
            ? { status: "success", uuid: "uuid-1", reseller_reference_order_id: ref, creation_date: "2026-11-03", issuances: [card] }
            : { status: "success", uuid: null, reseller_reference_order_id: null, creation_date: null, issuances: null },
        );
      }
      if (url.pathname.endsWith("/balance")) {
        return reply(200, { status: "success", currency: "USD", balance: "120.50" });
      }
      return reply(404, { status: "failure", internal_term: "not_found" });
    }),
  );

  return {
    calls,
    issued,
    createQueue,
    remember,
    creates: () => calls.filter((call) => call.path.endsWith("/issuance/create")).length,
    tokens: () => tokens,
  };
}

async function reviewingOrder(amount = 1000, email = "buyer@example.com") {
  const checkout = await createCheckout({ amount, quantity: 1, email });
  const transactionId = `TX${checkout.orderId.slice(-8)}`;
  await getPrisma().order.update({
    where: { id: checkout.orderId },
    data: { status: "REVIEWING", transactionId, paymentRef: `bkash_${transactionId}` },
  });
  return checkout;
}

async function orderIssuance(orderId: string) {
  return getPrisma().order.findUniqueOrThrow({ where: { id: orderId }, include: { issuance: true } });
}

beforeEach(async () => {
  await resetDb();
  process.env.ICASH_API_KEY = "k".repeat(16);
  process.env.ICASH_API_SECRET = "s".repeat(32);
  resetIcashToken();
  resetLimits();
});

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("ICASH_") || key.startsWith("UPSTASH_") || key === "REDIS_URL") delete process.env[key];
  }
  vi.unstubAllGlobals();
});

describe("iCash issuance", () => {
  it("generates one voucher on approval and lets iCash email the buyer", async () => {
    const icash = fakeIcash();
    const checkout = await reviewingOrder(1000, "Buyer@Example.com");

    const result = await approvePayment(checkout.orderId);
    expect(result.via).toBe("icash");
    expect(result.masked).toEqual(["******ab12cd"]);
    expect(result.codes).toEqual([]);

    const create = icash.calls.find((call) => call.path.endsWith("/issuance/create"))!;
    expect(create.auth).toBe("bearer tok1");
    expect(create.body).toMatchObject({
      country: "BD",
      card_currency: "BDT",
      card_amount: 1000,
      quantity: 1,
      destination_email: "buyer@example.com",
      reseller_reference_order_id: checkout.orderId,
    });

    const order = await orderIssuance(checkout.orderId);
    expect(order.status).toBe("DELIVERED");
    expect(order.issuance).toMatchObject({ status: "ISSUED", uuid: "uuid-1", amount: 1000, delivery: "icash" });
    expect(order.issuance?.codeCiphers).toEqual([]);
    expect(Number(order.issuance?.cost)).toBeCloseTo(8.3);

    const snapshot = await getAdminSnapshot();
    expect(snapshot.ledger.today.issued).toBe(1);
    expect(snapshot.ledger.today.issuedFace).toBe(1000);
    expect(snapshot.ledger.today.buyFee).toBe(order.total - 1000);
    expect(snapshot.ledger.today.revenue).toBe(order.total - 1000);
    expect(JSON.stringify(snapshot)).not.toContain("codeCiphers");
  });

  it("never buys twice when iCash issued but the answer was lost", async () => {
    const icash = fakeIcash();
    icash.createQueue.push((body) => {
      icash.remember(body);
      return { status: 502, json: { status: "failure", internal_term: "gateway_lost" } };
    });
    const checkout = await reviewingOrder();

    await expect(approvePayment(checkout.orderId)).rejects.toMatchObject({ code: "ICASH_FAILED" });
    expect((await orderIssuance(checkout.orderId)).issuance?.status).toBe("FAILED");

    const retry = await issueVoucherForOrder(checkout.orderId);
    expect(retry.masked).toEqual(["******ab12cd"]);
    expect(icash.creates()).toBe(1);
    expect((await orderIssuance(checkout.orderId)).status).toBe("DELIVERED");
  });

  it("records a low balance and succeeds on retry", async () => {
    const icash = fakeIcash();
    icash.createQueue.push(() => ({
      status: 412,
      json: { status: "failure", internal_term: "reseller_not_enough_balance", message: "Not enough balance" },
    }));
    const checkout = await reviewingOrder();

    await expect(approvePayment(checkout.orderId)).rejects.toMatchObject({ code: "ICASH_FAILED" });
    const failed = await orderIssuance(checkout.orderId);
    expect(failed.status).toBe("PAID");
    expect(failed.issuance).toMatchObject({ status: "FAILED", error: "reseller_not_enough_balance" });
    expect((await getAdminSnapshot()).ledger.queue.failed).toBe(1);

    await issueVoucherForOrder(checkout.orderId);
    expect((await orderIssuance(checkout.orderId)).issuance).toMatchObject({ status: "ISSUED", attempts: 2 });
    await expect(issueVoucherForOrder(checkout.orderId)).resolves.toMatchObject({ masked: ["******ab12cd"] });
    expect(icash.creates()).toBe(2);
  });

  it("refreshes an expired access token once", async () => {
    const icash = fakeIcash();
    icash.createQueue.push(() => ({ status: 400, json: { status: "failure", internal_term: "error_jwt_exception" } }));
    const checkout = await reviewingOrder();
    await approvePayment(checkout.orderId);
    expect(icash.tokens()).toBe(2);
    expect((await orderIssuance(checkout.orderId)).issuance?.status).toBe("ISSUED");
  });

  it("keeps the full code encrypted when the desk emails it", async () => {
    process.env.ICASH_DELIVERY = "desk";
    const icash = fakeIcash();
    const checkout = await reviewingOrder(500);
    const result = await approvePayment(checkout.orderId);

    expect(result.codes).toEqual(["FULL-CODE-ab12cd"]);
    expect(icash.calls.find((call) => call.path.endsWith("/create"))!.body).not.toHaveProperty("destination_email");
    const stored = await orderIssuance(checkout.orderId);
    expect(stored.issuance?.codeCiphers).toHaveLength(1);
    expect(JSON.stringify(stored).includes("FULL-CODE")).toBe(false);
    const view = await getOrderForBuyer(checkout.orderId, checkout.token);
    expect(view.codes).toEqual(["FULL-CODE-ab12cd"]);
  });

  it("stops at the daily cap and leaves the order ready to retry", async () => {
    process.env.ICASH_DAILY_CAP = "1500";
    fakeIcash();
    const first = await reviewingOrder(1000, "one@example.com");
    const second = await reviewingOrder(1000, "two@example.com");
    await approvePayment(first.orderId);
    await expect(approvePayment(second.orderId)).rejects.toMatchObject({ code: "OVER_LIMIT" });
    expect((await orderIssuance(second.orderId)).issuance).toMatchObject({ status: "FAILED", error: "desk_limit" });
  });

  it("refuses demo self-confirmation while iCash is connected", async () => {
    const icash = fakeIcash();
    const checkout = await createCheckout({ amount: 1000, quantity: 1, email: "demo@example.com" });
    await expect(confirmDemoPayment(checkout.orderId, checkout.token)).rejects.toMatchObject({ code: "LIVE_MODE" });
    expect(icash.creates()).toBe(0);
  });
});

describe("shared rate limit", () => {
  it("uses Upstash counts and falls back to memory when it is down", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    let count = 0;
    let down = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        if (down) return new Response("nope", { status: 500 });
        count += 1;
        return reply(200, [{ result: count }, { result: 1 }]);
      }),
    );
    expect(await rateLimit("t:1", 2, 60_000)).toBe(true);
    expect(await rateLimit("t:1", 2, 60_000)).toBe(true);
    expect(await rateLimit("t:1", 2, 60_000)).toBe(false);
    down = true;
    expect(await rateLimit("t:2", 1, 60_000)).toBe(true);
    expect(await rateLimit("t:2", 1, 60_000)).toBe(false);
  });
});
