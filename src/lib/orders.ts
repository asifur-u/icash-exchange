import { randomBytes } from "node:crypto";
import { assertOrderToken, signOrderAccess } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { deliveryProviders, dispatchCodes } from "@/lib/deliver";
import { DeskError } from "@/lib/errors";
import { lineTotal } from "@/lib/money";
import { paymentMode } from "@/lib/payments";
import { savePaymentProof } from "@/lib/proofs";
import { addAudit, countCodes, releaseStale, requireProduct, toPublic, withStore } from "@/lib/store";
import type { AdminSnapshot, BuyerOrder, Db, Order, PaymentMethod } from "@/lib/types";
import { reserveIn } from "@/lib/vouchers";

function requireOrder(db: Db, orderId: string) {
  const order = db.orders.find((item) => item.id === orderId);
  if (!order) throw new DeskError("NOT_FOUND", "That order is not on the desk");
  return order;
}

function productTitle(db: Db, order: Order) {
  const item = order.items[0];
  const product = item ? db.products.find((entry) => entry.id === item.productId) : undefined;
  return product?.title ?? "Note";
}

export async function createCheckout(input: {
  productSlug: string;
  quantity: number;
  email: string;
  phone?: string;
  userId?: string;
}) {
  return withStore((db) => {
    releaseStale(db);
    const product = requireProduct(db, input.productSlug);
    const email = input.email.toLowerCase();
    const pending = db.orders.filter((order) => {
      if (order.status !== "PENDING" && order.status !== "REVIEWING") return false;
      if (input.userId && order.userId === input.userId) return true;
      return order.email === email;
    }).length;
    if (pending >= 3) {
      throw new DeskError("TOO_MANY_PENDING", "Max 3 open requests at a time. Finish one, or wait 15 minutes.");
    }

    const total = lineTotal(product.price, input.quantity);
    const orderId = `ord_${randomBytes(8).toString("hex")}`;
    const codeIds = reserveIn(db, orderId, product.id, input.quantity);
    const number = `IX-${String(db.nextNumber).padStart(4, "0")}`;
    db.nextNumber += 1;

    const order: Order = {
      id: orderId,
      number,
      email,
      status: "PENDING",
      total,
      items: [
        {
          id: `item_${randomBytes(4).toString("hex")}`,
          productId: product.id,
          quantity: input.quantity,
          unitPrice: product.price,
        },
      ],
      codeIds,
      createdAt: new Date().toISOString(),
    };
    if (input.phone) order.phone = input.phone;
    if (input.userId) order.userId = input.userId;
    db.orders.push(order);
    addAudit(db, email, "order.create", orderId);

    return {
      orderId,
      number,
      total,
      token: signOrderAccess(orderId),
    };
  });
}

export async function submitPaymentProof(input: {
  orderId: string;
  token: string;
  method: PaymentMethod;
  transactionId: string;
  proofDataUrl: string;
}) {
  assertOrderToken(input.orderId, input.token);
  const txn = input.transactionId.trim().toUpperCase();
  const proofFile = await savePaymentProof(input.orderId, input.proofDataUrl);

  await withStore((db) => {
    releaseStale(db);
    const order = requireOrder(db, input.orderId);
    if (order.status !== "PENDING" && order.status !== "REVIEWING") {
      throw new DeskError("NOT_PAYABLE", "This order is not waiting for a deposit");
    }
    const clash = db.orders.find(
      (item) => item.transactionId === txn && item.id !== order.id && item.status !== "FAILED",
    );
    if (clash) throw new DeskError("DUPLICATE_PAYMENT", "That transaction ID is already used");

    order.status = "REVIEWING";
    order.paymentMethod = input.method;
    order.transactionId = txn;
    order.proofFile = proofFile;
    order.proofSubmittedAt = new Date().toISOString();
    order.paymentRef = `${input.method}_${txn}`;
    addAudit(db, order.email, "order.proof", order.id);
  });

  return { orderId: input.orderId, token: input.token };
}

export async function approvePayment(orderId: string) {
  await withStore((db) => {
    const order = requireOrder(db, orderId);
    if (order.status !== "REVIEWING" && order.status !== "PENDING") {
      throw new DeskError("NOT_PAYABLE", "This order is not waiting for approval");
    }
    if (!order.transactionId && !order.paymentRef) {
      throw new DeskError("BAD_INPUT", "No payment proof on this order yet");
    }
    const ref = order.paymentRef ?? `manual_${order.transactionId ?? order.id}`;
    const clash = db.orders.find((item) => item.paymentRef === ref && item.id !== order.id);
    if (clash) throw new DeskError("DUPLICATE_PAYMENT", "That payment is already used");
    order.status = "PAID";
    order.paidAt = new Date().toISOString();
    order.paymentRef = ref;
    addAudit(db, "admin", "order.approve", order.id);
  });
  // Unlock codes for the desk. Owner copies and sends manually (use Resend if email needed).
  const unlocked = await deliverOrder(orderId, { notify: false });
  return { orderId, emailed: false, sms: false, codes: unlocked.codes };
}

async function markPaid(orderId: string, paymentRef: string) {
  await withStore((db) => {
    const order = requireOrder(db, orderId);
    if (order.status === "PENDING") {
      const clash = db.orders.find((item) => item.paymentRef === paymentRef && item.id !== order.id);
      if (clash) throw new DeskError("DUPLICATE_PAYMENT", "That payment is already used");
      order.status = "PAID";
      order.paidAt = new Date().toISOString();
      order.paymentRef = paymentRef;
      addAudit(db, "desk", "order.paid", order.id);
      return;
    }
    if (order.status === "PAID" || order.status === "DELIVERED") return;
    throw new DeskError("NOT_PAYABLE", "This order can no longer be paid");
  });
}

export async function deliverOrder(orderId: string, options?: { notify?: boolean }) {
  const notify = options?.notify !== false;

  const payload = await withStore((db) => {
    const order = requireOrder(db, orderId);
    if (order.status === "DELIVERED") {
      const codes = db.codes
        .filter((code) => code.orderId === order.id && code.status === "SOLD")
        .map((code) => decrypt(code.cipher));
      return {
        email: order.email,
        phone: order.phone,
        number: order.number,
        title: productTitle(db, order),
        total: order.total,
        codes,
        already: true as const,
      };
    }
    if (order.status !== "PAID") throw new DeskError("NOT_PAID", "Payment is not confirmed");

    const expected = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const codes = db.codes.filter((code) => code.orderId === order.id && code.status === "RESERVED");
    if (codes.length !== expected) {
      throw new DeskError("NO_CODES", "Reserved codes do not match this order");
    }

    const plain = codes.map((code) => decrypt(code.cipher));
    const soldAt = new Date().toISOString();
    for (const code of codes) {
      code.status = "SOLD";
      code.soldAt = soldAt;
    }
    order.status = "DELIVERED";
    order.deliveredAt = soldAt;
    addAudit(db, "desk", "order.deliver", order.id);

    return {
      email: order.email,
      phone: order.phone,
      number: order.number,
      title: productTitle(db, order),
      total: order.total,
      codes: plain,
      already: false as const,
    };
  });

  if (!notify || payload.already) {
    return { email: false, sms: false, codes: payload.codes };
  }

  try {
    const sent = await dispatchCodes(payload);
    await withStore((db) => {
      addAudit(
        db,
        "desk",
        sent.email ? "order.email_sent" : "order.email_skipped",
        orderId,
      );
    });
    return { ...sent, codes: payload.codes };
  } catch (error) {
    console.error("delivery_notify_failed", error);
    await withStore((db) => {
      addAudit(db, "desk", "order.email_failed", orderId);
    });
    return { email: false, sms: false, codes: payload.codes };
  }
}

export async function confirmDemoPayment(orderId: string, token: string) {
  assertOrderToken(orderId, token);
  if (paymentMode() !== "demo") {
    throw new DeskError("LIVE_MODE", "This desk is waiting for the payment gateway.");
  }
  await markPaid(orderId, `demo_${orderId}`);
  await deliverOrder(orderId);
  return { orderId, token };
}

export async function applyPaidWebhook(event: { id: string; orderId: string; paymentRef: string }) {
  const action = await withStore((db) => {
    const order = requireOrder(db, event.orderId);
    if (db.webhooks.includes(event.id)) {
      return order.status === "PAID" ? "deliver" : "done";
    }
    const clash = db.orders.find((item) => item.paymentRef === event.paymentRef && item.id !== order.id);
    if (clash) throw new DeskError("DUPLICATE_PAYMENT", "That payment is already used");
    db.webhooks.push(event.id);
    if (db.webhooks.length > 5000) db.webhooks.splice(0, db.webhooks.length - 4000);
    if (order.status === "PENDING") {
      order.status = "PAID";
      order.paidAt = new Date().toISOString();
      order.paymentRef = event.paymentRef;
      addAudit(db, "gateway", "order.paid", order.id);
      return "deliver";
    }
    if (order.status === "PAID") return "deliver";
    return "done";
  });

  if (action === "deliver") await deliverOrder(event.orderId);
}

export async function listOrdersForUser(userId: string) {
  return withStore((db) => {
    releaseStale(db);
    return db.orders
      .filter((order) => order.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((order) => ({
        id: order.id,
        number: order.number,
        status: order.status,
        total: order.total,
        title: productTitle(db, order),
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod,
        transactionId: order.transactionId,
        proofSubmittedAt: order.proofSubmittedAt,
        deliveredAt: order.deliveredAt,
        token: signOrderAccess(order.id),
      }));
  });
}

export async function getOrderForBuyer(orderId: string, token: string | undefined): Promise<BuyerOrder> {
  assertOrderToken(orderId, token);
  return withStore((db) => {
    releaseStale(db);
    const order = requireOrder(db, orderId);
    const item = order.items[0];
    const codes =
      order.status === "DELIVERED"
        ? db.codes
            .filter((code) => code.orderId === order.id && code.status === "SOLD")
            .map((code) => decrypt(code.cipher))
        : [];
    return {
      id: order.id,
      number: order.number,
      email: order.email,
      phone: order.phone,
      status: order.status,
      total: order.total,
      quantity: item?.quantity ?? 0,
      title: productTitle(db, order),
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      deliveredAt: order.deliveredAt,
      paymentMethod: order.paymentMethod,
      transactionId: order.transactionId,
      proofSubmittedAt: order.proofSubmittedAt,
      codes,
    };
  });
}

export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  return withStore((db) => {
    releaseStale(db);
    return {
      products: db.products
        .filter((product) => product.active)
        .map((product) => ({
          ...toPublic(db, product),
          reserved: countCodes(db, product.id, "RESERVED"),
          sold: countCodes(db, product.id, "SOLD"),
          voided: countCodes(db, product.id, "VOID"),
        })),
      orders: [...db.orders]
        .reverse()
        .slice(0, 40)
        .map((order) => {
          const soldCodes = db.codes.filter((code) => code.orderId === order.id && code.status === "SOLD");
          return {
            id: order.id,
            number: order.number,
            email: order.email,
            phone: order.phone,
            status: order.status,
            total: order.total,
            quantity: order.items[0]?.quantity ?? 0,
            title: productTitle(db, order),
            createdAt: order.createdAt,
            paymentMethod: order.paymentMethod,
            transactionId: order.transactionId,
            hasProof: Boolean(order.proofFile),
            proofSubmittedAt: order.proofSubmittedAt,
            hasCodes: order.status === "DELIVERED" && soldCodes.length > 0,
          };
        }),
      audit: [...db.audit].reverse().slice(0, 20),
    };
  });
}

/** On-demand plaintext codes for the owner desk — never put these in page props. */
export async function revealOrderCodes(orderId: string) {
  return withStore((db) => {
    const order = requireOrder(db, orderId);
    if (order.status !== "DELIVERED" && order.status !== "PAID") {
      throw new DeskError("NOT_FOUND", "Codes are only available after approval.");
    }
    const codes = db.codes
      .filter((code) => code.orderId === order.id && (code.status === "SOLD" || code.status === "RESERVED"))
      .map((code) => decrypt(code.cipher));
    if (codes.length === 0) throw new DeskError("NOT_FOUND", "No codes on this order yet.");
    addAudit(db, "admin", "order.reveal_codes", order.id);
    return { codes };
  });
}

export async function refundOrder(orderId: string) {
  return withStore((db) => {
    const order = requireOrder(db, orderId);
    if (order.status !== "PAID" && order.status !== "DELIVERED") {
      throw new DeskError("NOT_PAYABLE", "Only a paid or delivered order can be refunded");
    }
    const revealed = order.status === "DELIVERED";
    for (const code of db.codes) {
      if (code.orderId !== order.id) continue;
      if (code.status !== "RESERVED" && code.status !== "SOLD") continue;
      if (revealed) {
        code.status = "VOID";
      } else {
        code.status = "AVAILABLE";
        delete code.orderId;
        delete code.reservedAt;
        delete code.soldAt;
      }
    }
    order.status = "REFUNDED";
    addAudit(db, "admin", revealed ? "order.refund_void" : "order.refund_release", order.id);
    return { revealed };
  });
}

export async function releasePending(orderId: string) {
  return withStore((db) => {
    const order = requireOrder(db, orderId);
    if (order.status !== "PENDING" && order.status !== "REVIEWING") {
      throw new DeskError("NOT_PAYABLE", "Only an unpaid hold can be released");
    }
    for (const code of db.codes) {
      if (code.orderId === order.id && code.status === "RESERVED") {
        code.status = "AVAILABLE";
        delete code.orderId;
        delete code.reservedAt;
      }
    }
    order.status = "FAILED";
    addAudit(db, "admin", "order.release", order.id);
  });
}

export async function resendOrder(orderId: string) {
  const ready = deliveryProviders();
  if (!ready.email && !ready.sms) {
    await withStore((db) => {
      const order = requireOrder(db, orderId);
      if (order.status !== "DELIVERED") {
        throw new DeskError("NOT_DELIVERED", "The code is not ready to send again");
      }
      addAudit(db, "admin", "order.resend_skipped", order.id);
    });
    return {
      email: false,
      sms: false,
      message: "No email or SMS provider is configured. The buyer still has the code on the order page.",
    };
  }

  const payload = await withStore((db) => {
    const order = requireOrder(db, orderId);
    if (order.status !== "DELIVERED") {
      throw new DeskError("NOT_DELIVERED", "The code is not ready to send again");
    }
    const codes = db.codes
      .filter((code) => code.orderId === order.id && code.status === "SOLD")
      .map((code) => decrypt(code.cipher));
    addAudit(db, "admin", "order.resend", order.id);
    return {
      email: order.email,
      phone: order.phone,
      number: order.number,
      title: productTitle(db, order),
      total: order.total,
      codes,
    };
  });

  try {
    const sent = await dispatchCodes(payload);
    return {
      ...sent,
      message: sent.email ? "Voucher email sent again." : "No email provider configured.",
    };
  } catch {
    console.error("delivery_notify_failed");
    return { email: false, sms: false, message: "The provider did not accept the message." };
  }
}
