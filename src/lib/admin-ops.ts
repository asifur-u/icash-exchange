import type { AdminSnapshot } from "@/lib/types";
import { formatBdt } from "@/lib/format";

const ACTION_LABELS: Record<string, string> = {
  "order.create": "Order created",
  "order.proof": "Deposit proof received",
  "order.approve": "Owner approved deposit",
  "order.paid": "Order marked paid",
  "order.deliver": "Code delivered",
  "order.email_failed": "Delivery email failed",
  "order.reveal_codes": "Codes revealed",
  "order.refund_void": "Refunded · codes voided",
  "order.refund_release": "Refunded · hold released",
  "order.release": "Hold released / rejected",
  "order.resend": "Delivery email resent",
  "order.resend_skipped": "Resend skipped",
  "order.expired": "Unpaid hold expired",
  "codes.upload": "Codes uploaded to stock",
};

export function humanAction(action: string) {
  return ACTION_LABELS[action] ?? action.replace(/\./g, " · ");
}

export function waitMinutes(fromIso: string | undefined, now = Date.now()) {
  if (!fromIso) return null;
  const t = +new Date(fromIso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now - t) / 60000));
}

export function waitLabel(minutes: number | null) {
  if (minutes == null) return "—";
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m waiting`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m waiting` : `${h}h waiting`;
}

export function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function buildDeskAlerts(snapshot: AdminSnapshot) {
  const alerts: Array<{ id: string; tone: "hot" | "warn" | "ok"; title: string; body: string }> = [];
  const now = Date.now();

  const reviewing = snapshot.orders.filter((o) => o.status === "REVIEWING");
  const aging = reviewing.filter((o) => (waitMinutes(o.proofSubmittedAt ?? o.createdAt, now) ?? 0) >= 30);
  if (aging.length > 0) {
    alerts.push({
      id: "aging-inbox",
      tone: "hot",
      title: `${aging.length} proof${aging.length > 1 ? "s" : ""} waiting 30m+`,
      body: "Customers are waiting — open Inbox and match TrxID first.",
    });
  } else if (reviewing.length > 0) {
    alerts.push({
      id: "inbox",
      tone: "warn",
      title: `${reviewing.length} in review queue`,
      body: "Deposit proofs ready for owner match.",
    });
  }

  const pending = snapshot.orders.filter((o) => o.status === "PENDING");
  if (pending.length > 0) {
    alerts.push({
      id: "pending-pay",
      tone: "warn",
      title: `${pending.length} awaiting deposit`,
      body: "Buyer started checkout but has not submitted proof yet.",
    });
  }

  for (const product of snapshot.products) {
    if (product.stock <= 2) {
      alerts.push({
        id: `stock-${product.id}`,
        tone: product.stock === 0 ? "hot" : "warn",
        title:
          product.stock === 0
            ? `${formatBdt(product.faceValue)} sold out`
            : `${formatBdt(product.faceValue)} low stock (${product.stock})`,
        body: "Upload more codes in Stock before demand spikes.",
      });
    }
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "clear",
      tone: "ok",
      title: "Desk healthy",
      body: "Inbox clear, stock looks fine — ready for the next deposit.",
    });
  }

  return alerts;
}

export function buildTodayStats(snapshot: AdminSnapshot) {
  const today = dayKey(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = dayKey(yesterdayDate);

  const isDay = (iso: string, key: string) => dayKey(new Date(iso)) === key;

  const todayOrders = snapshot.orders.filter((o) => isDay(o.createdAt, today));
  const yesterdayOrders = snapshot.orders.filter((o) => isDay(o.createdAt, yesterday));
  const todayDelivered = todayOrders.filter((o) => o.status === "DELIVERED");
  const todayRevenue = todayDelivered.reduce((s, o) => s + o.total, 0);
  const yesterdayRevenue = yesterdayOrders
    .filter((o) => o.status === "DELIVERED")
    .reduce((s, o) => s + o.total, 0);

  const waitSamples = snapshot.orders
    .filter((o) => o.status === "REVIEWING")
    .map((o) => waitMinutes(o.proofSubmittedAt ?? o.createdAt))
    .filter((n): n is number => n != null);
  const avgWait =
    waitSamples.length > 0
      ? Math.round(waitSamples.reduce((a, b) => a + b, 0) / waitSamples.length)
      : null;

  const emailCounts = new Map<string, number>();
  for (const order of snapshot.orders) {
    emailCounts.set(order.email, (emailCounts.get(order.email) ?? 0) + 1);
  }
  const repeatBuyers = [...emailCounts.values()].filter((n) => n > 1).length;

  return {
    todayCount: todayOrders.length,
    yesterdayCount: yesterdayOrders.length,
    todayRevenue,
    yesterdayRevenue,
    todayDelivered: todayDelivered.length,
    avgWaitMinutes: avgWait,
    repeatBuyers,
    uniqueBuyers: emailCounts.size,
  };
}

export function exportOrdersCsv(snapshot: AdminSnapshot) {
  const headers = [
    "number",
    "status",
    "email",
    "phone",
    "title",
    "faceValue",
    "quantity",
    "total",
    "paymentMethod",
    "transactionId",
    "paymentRef",
    "hasProof",
    "createdAt",
    "paidAt",
    "deliveredAt",
    "proofSubmittedAt",
  ];
  const lines = [headers.join(",")];
  for (const order of snapshot.orders) {
    const row = [
      order.number,
      order.status,
      order.email,
      order.phone ?? "",
      order.title,
      order.faceValue ?? "",
      order.quantity,
      order.total,
      order.paymentMethod ?? "",
      order.transactionId ?? "",
      order.paymentRef ?? "",
      order.hasProof ? "yes" : "no",
      order.createdAt,
      order.paidAt ?? "",
      order.deliveredAt ?? "",
      order.proofSubmittedAt ?? "",
    ].map((cell) => {
      const raw = String(cell);
      return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
    });
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

export function downloadText(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function repeatCount(snapshot: AdminSnapshot, email: string) {
  return snapshot.orders.filter((o) => o.email === email).length;
}
