import { Prisma } from "@prisma/client";
import { assertOrderToken, signOrderAccess } from "@/lib/auth";
import { decrypt, encrypt } from "@/lib/crypto";
import { getPrisma, isUniqueViolation, transaction, type Tx } from "@/lib/db";
import { deliveryProviders, dispatchCodes } from "@/lib/deliver";
import { DeskError } from "@/lib/errors";
import { deskPayTotal } from "@/lib/desk-fee";
import {
  IcashError,
  icashBalance,
  icashConfig,
  icashConfigured,
  icashInfo,
  icashIssue,
  type IcashIssue,
} from "@/lib/icash";
import { later } from "@/lib/later";
import { lineTotal } from "@/lib/money";
import { notifyAdminIssueFailed, notifyAdminLowBalance, notifyBuyerIssued } from "@/lib/notify";
import { paymentMode } from "@/lib/payments";
import { savePaymentProof } from "@/lib/proofs";
import {
  addAudit,
  ensureCatalog,
  newId,
  nextNumber,
  productsWithStock,
  releaseStale,
  requireProduct,
  toPublic,
} from "@/lib/store";
import type {
  AdminSnapshot,
  BuyerOrder,
  IssuanceDelivery,
  IssuanceView,
  Ledger,
  LedgerDay,
  LedgerFigures,
  PaymentMethod,
} from "@/lib/types";
import { reserveIn } from "@/lib/vouchers";

const STALE_ISSUING_MS = 2 * 60_000;
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

const withDetail = { product: true, issuance: true } satisfies Prisma.OrderInclude;
type OrderDetail = Prisma.OrderGetPayload<{ include: typeof withDetail }>;

async function requireOrder(tx: Tx, orderId: string) {
  const order = await tx.order.findUnique({ where: { id: orderId }, include: withDetail });
  if (!order) throw new DeskError("NOT_FOUND", "That order is not on the desk");
  return order;
}

function productTitle(order: { product: { title: string } | null; name?: string | null }) {
  return order.product?.title ?? order.name ?? "Note";
}

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : undefined;
}

function num(value: Prisma.Decimal | null | undefined) {
  return value == null ? undefined : Number(value);
}

/** Calendar day in Bangladesh time (UTC+6), e.g. 2026-11-03. */
export function dhakaDay(ms: number) {
  return new Date(ms + DHAKA_OFFSET_MS).toISOString().slice(0, 10);
}

function dhakaDayStart(ms: number) {
  return new Date(Date.parse(`${dhakaDay(ms)}T00:00:00+06:00`));
}

function maskCode(code: string) {
  if (code.includes("*")) return code;
  return `******${code.slice(-6)}`;
}

/** Plain codes for a delivered order: sold desk stock, plus an iCash voucher the desk kept. */
async function orderCodes(tx: Tx, order: OrderDetail) {
  const stock = await tx.voucherCode.findMany({
    where: { orderId: order.id, status: "SOLD" },
    orderBy: { createdAt: "asc" },
    select: { cipher: true },
  });
  const issued = order.issuance?.status === "ISSUED" ? order.issuance.codeCiphers : [];
  return [...stock.map((code) => decrypt(code.cipher)), ...issued.map(decrypt)];
}

function duplicatePayment(error: unknown) {
  return isUniqueViolation(error, "paymentRef") || isUniqueViolation(error, "transactionId");
}

export async function createCheckout(input: {
  productSlug?: string;
  amount?: number;
  quantity: number;
  email: string;
  name?: string;
  phone?: string;
  userId?: string;
  /** Token packs: buyer sends the listed taka, no extra desk fee. */
  lockTotal?: boolean;
}) {
  await ensureCatalog();
  await releaseStale();
  const typed = input.amount && input.amount > 0 ? Math.round(input.amount) : 0;
  const email = input.email.toLowerCase();

  return transaction(async (tx) => {
    const matched = typed ? await tx.product.findFirst({ where: { active: true, faceValue: typed } }) : null;
    const product = matched ?? (input.productSlug ? await requireProduct(tx, input.productSlug) : null);
    if (!product && !typed) throw new DeskError("BAD_INPUT", "Enter an amount");

    const pending = await tx.order.count({
      where: {
        status: { in: ["PENDING", "REVIEWING"] },
        OR: [{ email }, ...(input.userId ? [{ userId: input.userId }] : [])],
      },
    });
    if (pending >= 3) {
      throw new DeskError("TOO_MANY_PENDING", "Max 3 open requests at a time. Finish one, or wait 15 minutes.");
    }

    const voucher = typed || lineTotal(product?.price ?? 0, input.quantity);
    const total = input.lockTotal ? voucher : deskPayTotal(voucher);
    const orderId = newId("ord");
    const number = await nextNumber(tx, "IX");
    await tx.order.create({
      data: {
        id: orderId,
        number,
        email,
        name: input.name?.trim() || undefined,
        phone: input.phone || undefined,
        userId: input.userId,
        productId: product?.id,
        voucher,
        total,
      },
    });

    const canReserve = Boolean(!icashConfigured() && product && product.faceValue === voucher);
    const codeIds = canReserve && product ? await reserveIn(tx, orderId, product.id, input.quantity) : [];
    if (codeIds.length > 0) {
      await tx.order.update({ where: { id: orderId }, data: { quantity: input.quantity } });
    }
    await addAudit(tx, email, "order.create", orderId);

    return { orderId, number, total, token: signOrderAccess(orderId) };
  });
}

export async function submitPaymentProof(input: {
  orderId: string;
  token: string;
  method: PaymentMethod;
  transactionId: string;
  proofDataUrl?: string;
  payerNumber?: string;
}) {
  assertOrderToken(input.orderId, input.token);
  const txn = input.transactionId.trim().toUpperCase();
  const proofFile = input.proofDataUrl ? await savePaymentProof(input.orderId, input.proofDataUrl) : null;
  await releaseStale();

  try {
    await transaction(async (tx) => {
      const order = await requireOrder(tx, input.orderId);
      if (order.status !== "PENDING" && order.status !== "REVIEWING") {
        throw new DeskError("NOT_PAYABLE", "This order is not waiting for a deposit");
      }
      const clash = await tx.order.findFirst({
        where: { transactionId: txn, id: { not: order.id }, status: { not: "FAILED" } },
        select: { id: true },
      });
      if (clash) throw new DeskError("DUPLICATE_PAYMENT", "That transaction ID is already used");

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "REVIEWING",
          paymentMethod: input.method,
          transactionId: txn,
          ...(proofFile ? { proofFile } : {}),
          proofSubmittedAt: new Date(),
          paymentRef: `${input.method}_${txn}`,
          ...(input.payerNumber ? { phone: input.payerNumber } : {}),
        },
      });
      await addAudit(tx, order.email, "order.proof", order.id);
    });
  } catch (error) {
    if (duplicatePayment(error)) throw new DeskError("DUPLICATE_PAYMENT", "That transaction ID is already used");
    throw error;
  }

  return { orderId: input.orderId, token: input.token };
}

export async function approvePayment(orderId: string) {
  try {
    await transaction(async (tx) => {
      const order = await requireOrder(tx, orderId);
      if (order.status !== "REVIEWING" && order.status !== "PENDING") {
        throw new DeskError("NOT_PAYABLE", "This order is not waiting for approval");
      }
      if (!order.transactionId && !order.paymentRef) {
        throw new DeskError("BAD_INPUT", "No payment proof on this order yet");
      }
      const ref = order.paymentRef ?? `manual_${order.transactionId ?? order.id}`;
      const moved = await tx.order.updateMany({
        where: { id: orderId, status: { in: ["REVIEWING", "PENDING"] } },
        data: { status: "PAID", paidAt: new Date(), paymentRef: ref },
      });
      if (moved.count === 0) throw new DeskError("NOT_PAYABLE", "This order is not waiting for approval");
      await addAudit(tx, "admin", "order.approve", orderId);
    });
  } catch (error) {
    if (duplicatePayment(error)) throw new DeskError("DUPLICATE_PAYMENT", "That payment is already used");
    throw error;
  }

  try {
    return { orderId, ...(await fulfil(orderId, "admin")) };
  } catch (error) {
    if (error instanceof DeskError && (error.code === "ICASH_FAILED" || error.code === "OVER_LIMIT")) {
      throw new DeskError(
        error.code,
        `Payment approved, but the voucher was not generated: ${error.message} Retry it from the iCash section.`,
      );
    }
    throw error;
  }
}

async function markPaid(orderId: string, paymentRef: string) {
  try {
    await transaction(async (tx) => {
      const order = await requireOrder(tx, orderId);
      if (order.status === "PAID" || order.status === "DELIVERED") return;
      if (order.status !== "PENDING") throw new DeskError("NOT_PAYABLE", "This order can no longer be paid");
      const moved = await tx.order.updateMany({
        where: { id: orderId, status: "PENDING" },
        data: { status: "PAID", paidAt: new Date(), paymentRef },
      });
      if (moved.count > 0) await addAudit(tx, "desk", "order.paid", orderId);
    });
  } catch (error) {
    if (duplicatePayment(error)) throw new DeskError("DUPLICATE_PAYMENT", "That payment is already used");
    throw error;
  }
}

export type FulfilResult = {
  via: "stock" | "icash";
  emailed: boolean;
  sms: boolean;
  /** Plain codes for the admin to copy (stock or desk-delivered iCash). */
  codes: string[];
  /** Masked iCash codes (iCash emailed the full code itself). */
  masked: string[];
};

/** Sends the voucher for a PAID order. iCash is used whenever it is connected, so the code goes to the buyer's email. */
async function fulfil(orderId: string, actor: string): Promise<FulfilResult> {
  if (icashConfigured()) return issueVoucherForOrder(orderId, actor);
  const sent = await deliverOrder(orderId, { notify: true });
  return { via: "stock", emailed: sent.email, sms: sent.sms, codes: sent.codes, masked: [] };
}

/**
 * Generates the voucher for a PAID order through iCash. Idempotent: the order id is the
 * iCash reference, and any earlier attempt is looked up before a new one is created.
 */
export async function issueVoucherForOrder(orderId: string, actor = "admin"): Promise<FulfilResult> {
  if (!icashConfigured()) throw new DeskError("ICASH_OFF", "iCash is not connected on this server.");
  const config = icashConfig();

  const claim = await transaction(async (tx) => {
    // One claim at a time across every instance, so the daily cap cannot be overrun by a race.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('icash-issue'))`;
    const order = await requireOrder(tx, orderId);
    const current = order.issuance;
    if (current?.status === "ISSUED") {
      return { done: true as const, masked: current.masked, delivery: current.delivery as IssuanceDelivery };
    }
    if (order.status !== "PAID") throw new DeskError("NOT_PAID", "Approve the payment first.");
    if (current?.status === "ISSUING" && Date.now() - current.startedAt.getTime() < STALE_ISSUING_MS) {
      throw new DeskError("ISSUING", "iCash is already generating this voucher. Wait a moment.");
    }
    const amount = order.voucher;
    if (!(amount > 0)) throw new DeskError("BAD_INPUT", "This order has no voucher amount.");

    const [inFlight, issuedToday] = await Promise.all([
      tx.order.aggregate({
        where: { id: { not: orderId }, issuance: { status: "ISSUING" } },
        _sum: { voucher: true },
      }),
      tx.issuance.aggregate({
        where: { orderId: { not: orderId }, status: "ISSUED", issuedAt: { gte: dhakaDayStart(Date.now()) } },
        _sum: { amount: true },
      }),
    ]);
    const committed = (inFlight._sum.voucher ?? 0) + (issuedToday._sum.amount ?? 0);
    const blocked =
      amount > config.maxPerOrder
        ? `Over the per-order iCash limit (${config.maxPerOrder}). Raise ICASH_MAX_PER_ORDER to allow it.`
        : committed + amount > config.dailyCap
          ? `Today's iCash limit (${config.dailyCap}) is reached. Raise ICASH_DAILY_CAP or retry tomorrow.`
          : null;

    const fields = {
      status: blocked ? ("FAILED" as const) : ("ISSUING" as const),
      delivery: config.delivery,
      environment: config.environment,
      startedAt: new Date(),
      amount,
      currency: config.currency,
      error: blocked ? "desk_limit" : null,
      errorMessage: blocked,
    };
    const issuance = await tx.issuance.upsert({
      where: { orderId },
      create: { orderId, ref: orderId, attempts: blocked ? 0 : 1, ...fields },
      update: { ...fields, attempts: { increment: blocked ? 0 : 1 } },
    });
    if (blocked) {
      await addAudit(tx, actor, "icash.issue_blocked", orderId);
      return { done: false as const, blocked: true as const, message: blocked };
    }
    await addAudit(tx, actor, "icash.issue_start", orderId);
    return {
      done: false as const,
      blocked: false as const,
      ref: issuance.ref,
      amount,
      email: order.email,
      phone: order.phone ?? undefined,
      number: order.number,
      title: productTitle(order),
      total: order.total,
      recover: Boolean(current),
    };
  });

  if (claim.done) {
    return { via: "icash", emailed: claim.delivery === "icash", sms: false, codes: [], masked: claim.masked };
  }
  if (claim.blocked) throw new DeskError("OVER_LIMIT", claim.message);

  let result: IcashIssue | null = null;
  try {
    if (claim.recover) {
      const existing = await icashInfo(claim.ref);
      if (existing.cards.length > 0) result = { uuid: existing.uuid ?? undefined, cards: existing.cards };
    }
    result ??= await icashIssue({ ref: claim.ref, amount: claim.amount, email: claim.email });
  } catch (error) {
    const term = error instanceof IcashError ? error.term : "unexpected";
    const message = error instanceof IcashError ? error.message : "Unexpected error while talking to iCash.";
    await transaction(async (tx) => {
      await tx.issuance.update({
        where: { orderId },
        data: { status: "FAILED", error: term, errorMessage: message },
      });
      await addAudit(tx, "icash", "icash.issue_failed", orderId);
    });
    later(() =>
      notifyAdminIssueFailed({ number: claim.number, email: claim.email, amount: claim.amount, term, message }),
    );
    throw new DeskError("ICASH_FAILED", message);
  }

  const codes = result.cards.map((card) => card.code);
  const full = codes.every((code) => !code.includes("*"));
  const masked = codes.map(maskCode);
  const issuedAt = new Date();
  const issuedFace = result.cards.reduce((sum, card) => sum + card.amount, 0) || claim.amount;

  await transaction(async (tx) => {
    await tx.issuance.update({
      where: { orderId },
      data: {
        status: "ISSUED",
        issuedAt,
        uuid: result.uuid ?? null,
        cost: result.totalAmount ?? null,
        exchangeRate: result.exchangeRate ?? null,
        currency: result.cards[0]?.currency || config.currency,
        amount: Math.round(issuedFace),
        masked,
        codeCiphers: full ? codes.map((code) => encrypt(code)) : [],
        error: null,
        errorMessage: null,
      },
    });
    await tx.order.updateMany({
      where: { id: orderId, status: "PAID" },
      data: { status: "DELIVERED", deliveredAt: issuedAt },
    });
    await addAudit(tx, "icash", "icash.issued", orderId);
  });

  const deskSends = config.delivery === "desk" && full;
  later(async () => {
    if (deskSends) {
      await dispatchCodes({
        email: claim.email,
        phone: claim.phone,
        number: claim.number,
        title: claim.title,
        total: claim.total,
        codes,
      });
    } else {
      await notifyBuyerIssued({ email: claim.email, number: claim.number, amount: issuedFace, masked });
    }
    if (config.lowBalance > 0) {
      const balance = await icashBalance();
      if (balance.balance < config.lowBalance) {
        await notifyAdminLowBalance({ ...balance, floor: config.lowBalance });
      }
    }
  });

  return { via: "icash", emailed: true, sms: false, codes: deskSends ? codes : [], masked };
}

/** Moves reserved stock codes to SOLD and emails them. Safe to call twice. */
export async function deliverOrder(orderId: string, options?: { notify?: boolean }) {
  const notify = options?.notify !== false;

  const payload = await transaction(async (tx) => {
    const order = await requireOrder(tx, orderId);
    const base = {
      email: order.email,
      phone: order.phone ?? undefined,
      number: order.number,
      title: productTitle(order),
      total: order.total,
    };
    if (order.status === "DELIVERED") {
      return { ...base, codes: await orderCodes(tx, order), already: true as const };
    }
    if (order.status !== "PAID") throw new DeskError("NOT_PAID", "Payment is not confirmed");

    const reserved = await tx.voucherCode.findMany({
      where: { orderId, status: "RESERVED" },
      orderBy: { createdAt: "asc" },
    });
    if (order.quantity === 0 && reserved.length === 0) {
      await addAudit(tx, "desk", "order.custom_amount", orderId);
      return { ...base, codes: [] as string[], already: false as const };
    }
    if (reserved.length !== order.quantity) {
      throw new DeskError("NO_CODES", "Reserved codes do not match this order");
    }

    const soldAt = new Date();
    const moved = await tx.order.updateMany({
      where: { id: orderId, status: "PAID" },
      data: { status: "DELIVERED", deliveredAt: soldAt },
    });
    if (moved.count === 0) {
      return { ...base, codes: await orderCodes(tx, await requireOrder(tx, orderId)), already: true as const };
    }
    await tx.voucherCode.updateMany({
      where: { id: { in: reserved.map((code) => code.id) } },
      data: { status: "SOLD", soldAt },
    });
    await addAudit(tx, "desk", "order.deliver", orderId);
    return { ...base, codes: reserved.map((code) => decrypt(code.cipher)), already: false as const };
  });

  if (!notify || payload.already || payload.codes.length === 0) {
    return { email: false, sms: false, codes: payload.codes };
  }

  const prisma = getPrisma();
  try {
    const sent = await dispatchCodes(payload);
    await prisma.auditLog.create({
      data: { actor: "desk", action: sent.email ? "order.email_sent" : "order.email_skipped", targetId: orderId },
    });
    return { ...sent, codes: payload.codes };
  } catch (error) {
    console.error("delivery_notify_failed", (error as Error)?.message);
    await prisma.auditLog.create({ data: { actor: "desk", action: "order.email_failed", targetId: orderId } });
    return { email: false, sms: false, codes: payload.codes };
  }
}

export async function confirmDemoPayment(orderId: string, token: string) {
  assertOrderToken(orderId, token);
  if (paymentMode() !== "demo") {
    throw new DeskError("LIVE_MODE", "This desk is waiting for the payment gateway.");
  }
  if (icashConfigured()) {
    // A self-confirmed demo payment must never spend the real iCash reseller balance.
    throw new DeskError("LIVE_MODE", "Demo confirmation is off while iCash is connected.");
  }
  await markPaid(orderId, `demo_${orderId}`);
  await deliverOrder(orderId);
  return { orderId, token };
}

export async function applyPaidWebhook(event: { id: string; orderId: string; paymentRef: string }) {
  const action = await transaction(async (tx) => {
    const order = await requireOrder(tx, event.orderId);
    const fresh = await tx.webhookEvent.createMany({ data: [{ id: event.id }], skipDuplicates: true });
    if (fresh.count === 0) {
      const now = await requireOrder(tx, event.orderId);
      return now.status === "PAID" ? "deliver" : "done";
    }
    const clash = await tx.order.findFirst({
      where: { paymentRef: event.paymentRef, id: { not: order.id } },
      select: { id: true },
    });
    if (clash) throw new DeskError("DUPLICATE_PAYMENT", "That payment is already used");
    if (order.status === "PENDING") {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", paidAt: new Date(), paymentRef: event.paymentRef },
      });
      await addAudit(tx, "gateway", "order.paid", order.id);
      return "deliver";
    }
    return order.status === "PAID" ? "deliver" : "done";
  });

  if (action === "deliver") await fulfil(event.orderId, "gateway");
}

export async function listOrdersForUser(userId: string) {
  await releaseStale();
  const rows = await getPrisma().order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: withDetail,
  });
  return rows.map((order) => ({
    id: order.id,
    number: order.number,
    status: order.status,
    total: order.total,
    title: productTitle(order),
    createdAt: order.createdAt.toISOString(),
    paymentMethod: order.paymentMethod ?? undefined,
    transactionId: order.transactionId ?? undefined,
    proofSubmittedAt: iso(order.proofSubmittedAt),
    deliveredAt: iso(order.deliveredAt),
    token: signOrderAccess(order.id),
  }));
}

export async function getOrderForBuyer(orderId: string, token: string | undefined): Promise<BuyerOrder> {
  assertOrderToken(orderId, token);
  await releaseStale();
  const prisma = getPrisma();
  const order = await requireOrder(prisma, orderId);
  const codes = order.status === "DELIVERED" ? await orderCodes(prisma, order) : [];
  return {
    id: order.id,
    number: order.number,
    email: order.email,
    phone: order.phone ?? undefined,
    status: order.status,
    total: order.total,
    quantity: order.quantity,
    title: productTitle(order),
    createdAt: order.createdAt.toISOString(),
    paidAt: iso(order.paidAt),
    deliveredAt: iso(order.deliveredAt),
    paymentMethod: order.paymentMethod ?? undefined,
    transactionId: order.transactionId ?? undefined,
    proofSubmittedAt: iso(order.proofSubmittedAt),
    codes,
  };
}

function issuanceView(issuance: OrderDetail["issuance"]): IssuanceView | undefined {
  if (!issuance) return undefined;
  return {
    status: issuance.status,
    delivery: issuance.delivery as IssuanceDelivery,
    environment: issuance.environment === "production" ? "production" : "test",
    attempts: issuance.attempts,
    startedAt: issuance.startedAt.toISOString(),
    issuedAt: iso(issuance.issuedAt),
    uuid: issuance.uuid ?? undefined,
    currency: issuance.currency ?? undefined,
    amount: issuance.amount ?? undefined,
    cost: num(issuance.cost),
    exchangeRate: num(issuance.exchangeRate),
    masked: issuance.masked.length ? issuance.masked : undefined,
    error: issuance.error ?? undefined,
    errorMessage: issuance.errorMessage ?? undefined,
  };
}

export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  await ensureCatalog();
  await releaseStale();
  const prisma = getPrisma();
  const [products, orders, audit, codeCounts, orderCount, ledger] = await Promise.all([
    productsWithStock(),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
      include: { ...withDetail, _count: { select: { codes: { where: { status: "SOLD" } } } } },
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 120 }),
    prisma.voucherCode.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.count(),
    buildLedger(),
  ]);
  const totalFor = (status: string) => codeCounts.find((row) => row.status === status)?._count._all ?? 0;

  return {
    products: products.map(({ product, counts }) => ({
      ...toPublic(product, counts.AVAILABLE ?? 0),
      reserved: counts.RESERVED ?? 0,
      sold: counts.SOLD ?? 0,
      voided: counts.VOID ?? 0,
    })),
    orders: orders.map((order) => ({
      id: order.id,
      number: order.number,
      email: order.email,
      name: order.name ?? undefined,
      phone: order.phone ?? undefined,
      status: order.status,
      total: order.total,
      quantity: order.quantity,
      title: productTitle(order),
      faceValue: order.product?.faceValue,
      createdAt: order.createdAt.toISOString(),
      paidAt: iso(order.paidAt),
      deliveredAt: iso(order.deliveredAt),
      paymentMethod: order.paymentMethod ?? undefined,
      paymentRef: order.paymentRef ?? undefined,
      transactionId: order.transactionId ?? undefined,
      hasProof: Boolean(order.proofFile),
      proofSubmittedAt: iso(order.proofSubmittedAt),
      hasCodes:
        order.status === "DELIVERED" && (order._count.codes > 0 || Boolean(order.issuance?.codeCiphers.length)),
      voucher: order.voucher,
      issuance: issuanceView(order.issuance),
    })),
    ledger,
    audit: audit.map((entry) => ({
      id: entry.id,
      actor: entry.actor,
      action: entry.action,
      targetId: entry.targetId ?? undefined,
      createdAt: entry.createdAt.toISOString(),
    })),
    totals: {
      orderCount,
      codeReady: totalFor("AVAILABLE"),
      codeHeld: totalFor("RESERVED"),
      codeSold: totalFor("SOLD"),
      codeVoid: totalFor("VOID"),
    },
  };
}

function emptyFigures(): LedgerFigures {
  return {
    buyCount: 0,
    buyGross: 0,
    buyFee: 0,
    issued: 0,
    issuedFace: 0,
    icashCost: 0,
    sellCount: 0,
    sellFace: 0,
    sellPayout: 0,
    revenue: 0,
  };
}

type LedgerRow = {
  day: string;
  buy_count: number;
  buy_gross: number;
  buy_fee: number;
  issued: number;
  issued_face: number;
  icash_cost: number;
  sell_count: number;
  sell_face: number;
  sell_payout: number;
  sell_margin: number;
};

/** Money in and out per Bangladesh calendar day (SQL), plus today, this month, and all time. */
export async function buildLedger(now = Date.now(), span = 30): Promise<Ledger> {
  const prisma = getPrisma();
  const [rows, awaitingApproval, issuing, failed, openSells] = await Promise.all([
    prisma.$queryRaw<LedgerRow[]>(Prisma.sql`
      WITH buys AS (
        SELECT to_char(COALESCE("paidAt", "deliveredAt", "createdAt") AT TIME ZONE 'Asia/Dhaka', 'YYYY-MM-DD') AS day,
               count(*)::float8 AS buy_count,
               sum("total")::float8 AS buy_gross,
               sum(GREATEST("total" - "voucher", 0))::float8 AS buy_fee
        FROM "Order"
        WHERE "status" IN ('PAID', 'DELIVERED')
        GROUP BY 1
      ), issued AS (
        SELECT to_char(i."issuedAt" AT TIME ZONE 'Asia/Dhaka', 'YYYY-MM-DD') AS day,
               sum(GREATEST(cardinality(i."masked"), 1))::float8 AS issued,
               sum(COALESCE(i."amount", o."voucher"))::float8 AS issued_face,
               sum(COALESCE(i."cost", 0))::float8 AS icash_cost
        FROM "Issuance" i
        JOIN "Order" o ON o."id" = i."orderId"
        WHERE i."status" = 'ISSUED' AND i."issuedAt" IS NOT NULL
        GROUP BY 1
      ), sells AS (
        SELECT to_char(COALESCE("settledAt", "createdAt") AT TIME ZONE 'Asia/Dhaka', 'YYYY-MM-DD') AS day,
               count(*)::float8 AS sell_count,
               sum("faceValue")::float8 AS sell_face,
               sum("payout")::float8 AS sell_payout,
               sum(GREATEST("faceValue" - "payout", 0))::float8 AS sell_margin
        FROM "Sell"
        WHERE "status" = 'PAID'
        GROUP BY 1
      )
      SELECT day,
             COALESCE(b.buy_count, 0) AS buy_count,
             COALESCE(b.buy_gross, 0) AS buy_gross,
             COALESCE(b.buy_fee, 0) AS buy_fee,
             COALESCE(i.issued, 0) AS issued,
             COALESCE(i.issued_face, 0) AS issued_face,
             COALESCE(i.icash_cost, 0) AS icash_cost,
             COALESCE(s.sell_count, 0) AS sell_count,
             COALESCE(s.sell_face, 0) AS sell_face,
             COALESCE(s.sell_payout, 0) AS sell_payout,
             COALESCE(s.sell_margin, 0) AS sell_margin
      FROM buys b
      FULL JOIN issued i USING (day)
      FULL JOIN sells s USING (day)`),
    prisma.order.count({ where: { status: "REVIEWING" } }),
    prisma.issuance.count({ where: { status: "ISSUING" } }),
    prisma.order.count({ where: { status: "PAID", issuance: { status: "FAILED" } } }),
    prisma.sell.aggregate({ where: { status: "OPEN" }, _count: { _all: true }, _sum: { faceValue: true } }),
  ]);

  const today = dhakaDay(now);
  const month = today.slice(0, 7);
  const days = new Map<string, LedgerDay>();
  for (let index = span - 1; index >= 0; index -= 1) {
    const date = dhakaDay(now - index * 86_400_000);
    days.set(date, { date, ...emptyFigures() });
  }
  const all = emptyFigures();
  const todayFigures = emptyFigures();
  const monthFigures = emptyFigures();

  for (const row of rows) {
    const apply = (figures: LedgerFigures) => {
      figures.buyCount += row.buy_count;
      figures.buyGross += row.buy_gross;
      figures.buyFee += row.buy_fee;
      figures.issued += row.issued;
      figures.issuedFace += row.issued_face;
      figures.icashCost += row.icash_cost;
      figures.sellCount += row.sell_count;
      figures.sellFace += row.sell_face;
      figures.sellPayout += row.sell_payout;
      figures.revenue += row.buy_fee + row.sell_margin;
    };
    apply(all);
    if (row.day === today) apply(todayFigures);
    if (row.day.startsWith(month)) apply(monthFigures);
    const day = days.get(row.day);
    if (day) apply(day);
  }

  return {
    days: [...days.values()],
    today: todayFigures,
    month: monthFigures,
    all,
    queue: {
      awaitingApproval,
      issuing,
      failed,
      openSells: openSells._count._all,
      openSellFace: openSells._sum.faceValue ?? 0,
    },
  };
}

/** On-demand plaintext codes for the owner desk — never put these in page props. */
export async function revealOrderCodes(orderId: string) {
  return transaction(async (tx) => {
    const order = await requireOrder(tx, orderId);
    if (order.status !== "DELIVERED" && order.status !== "PAID") {
      throw new DeskError("NOT_FOUND", "Codes are only available after approval.");
    }
    const reserved = await tx.voucherCode.findMany({
      where: { orderId, status: "RESERVED" },
      select: { cipher: true },
    });
    const codes = [...reserved.map((code) => decrypt(code.cipher)), ...(await orderCodes(tx, order))];
    if (codes.length === 0 && order.issuance?.masked.length) {
      throw new DeskError(
        "NOT_FOUND",
        `iCash emailed this code straight to the buyer, so the desk only sees ${order.issuance.masked.join(", ")}.`,
      );
    }
    if (codes.length === 0) throw new DeskError("NOT_FOUND", "No codes on this order yet.");
    await addAudit(tx, "admin", "order.reveal_codes", orderId);
    return { codes };
  });
}

export async function refundOrder(orderId: string) {
  return transaction(async (tx) => {
    const order = await requireOrder(tx, orderId);
    if (order.status !== "PAID" && order.status !== "DELIVERED") {
      throw new DeskError("NOT_PAYABLE", "Only a paid or delivered order can be refunded");
    }
    const revealed = order.status === "DELIVERED";
    const moved = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: { status: "REFUNDED" },
    });
    if (moved.count === 0) throw new DeskError("NOT_PAYABLE", "This order changed. Refresh and try again.");
    if (revealed) {
      await tx.voucherCode.updateMany({
        where: { orderId, status: { in: ["RESERVED", "SOLD"] } },
        data: { status: "VOID" },
      });
    } else {
      await tx.voucherCode.updateMany({
        where: { orderId, status: { in: ["RESERVED", "SOLD"] } },
        data: { status: "AVAILABLE", orderId: null, reservedAt: null, soldAt: null },
      });
    }
    const issued = order.issuance?.status === "ISSUED";
    await addAudit(
      tx,
      "admin",
      issued ? "order.refund_issued" : revealed ? "order.refund_void" : "order.refund_release",
      orderId,
    );
    return { revealed, issued };
  });
}

export async function releasePending(orderId: string) {
  return transaction(async (tx) => {
    const moved = await tx.order.updateMany({
      where: { id: orderId, status: { in: ["PENDING", "REVIEWING"] } },
      data: { status: "FAILED", paymentRef: null },
    });
    if (moved.count === 0) {
      await requireOrder(tx, orderId);
      throw new DeskError("NOT_PAYABLE", "Only an unpaid hold can be released");
    }
    await tx.voucherCode.updateMany({
      where: { orderId, status: "RESERVED" },
      data: { status: "AVAILABLE", orderId: null, reservedAt: null },
    });
    await addAudit(tx, "admin", "order.release", orderId);
  });
}

export async function resendOrder(orderId: string) {
  const prisma = getPrisma();
  const ready = deliveryProviders();
  if (!ready.email && !ready.sms) {
    const order = await requireOrder(prisma, orderId);
    if (order.status !== "DELIVERED") {
      throw new DeskError("NOT_DELIVERED", "The code is not ready to send again");
    }
    await prisma.auditLog.create({ data: { actor: "admin", action: "order.resend_skipped", targetId: orderId } });
    return {
      email: false,
      sms: false,
      message: "No email or SMS provider is configured. The buyer still has the code on the order page.",
    };
  }

  const order = await requireOrder(prisma, orderId);
  if (order.status !== "DELIVERED") {
    throw new DeskError("NOT_DELIVERED", "The code is not ready to send again");
  }
  const codes = await orderCodes(prisma, order);
  if (codes.length === 0 && order.issuance?.delivery === "icash") {
    throw new DeskError(
      "NOT_DELIVERED",
      "iCash emailed this voucher directly, so the desk cannot resend it. Ask iCash support to resend, quoting the order number.",
    );
  }
  await prisma.auditLog.create({ data: { actor: "admin", action: "order.resend", targetId: orderId } });

  try {
    const sent = await dispatchCodes({
      email: order.email,
      phone: order.phone ?? undefined,
      number: order.number,
      title: productTitle(order),
      total: order.total,
      codes,
    });
    return {
      ...sent,
      message: sent.email ? "Voucher email sent again." : "No email provider configured.",
    };
  } catch {
    console.error("delivery_notify_failed");
    return { email: false, sms: false, message: "The provider did not accept the message." };
  }
}

/** Storage key for an order's deposit screenshot (admin proof viewer). */
export async function proofFileFor(orderId: string) {
  const order = await getPrisma().order.findUnique({ where: { id: orderId }, select: { proofFile: true } });
  if (!order?.proofFile) throw new DeskError("NOT_FOUND", "No screenshot on this order");
  return order.proofFile;
}
