"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell, type AdminSection } from "@/components/admin/admin-shell";
import { type IcashDeskConfig } from "@/components/admin/icash-desk";
import { OrderReceipts } from "@/components/admin/order-receipts";
import { PaymentDesk } from "@/components/admin/payment-desk";
import { StatementDesk } from "@/components/admin/statement-desk";
import { useT } from "@/i18n/provider";
import {
  dayKey,
  humanAction,
} from "@/lib/admin-ops";
import { formatBdt, formatWhen } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/swal";
import type { DeskAdmin } from "@/lib/admins";
import type { AdminSnapshot } from "@/lib/types";

type ActivityRow = {
  id: string;
  at: string;
  title: string;
  body: string;
  tone: "ok" | "warn" | "info" | "bad";
};

async function post(url: string, body?: unknown, method = "POST") {
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: method === "GET" || method === "DELETE" ? undefined : body ? JSON.stringify(body) : "{}",
  });
  const data = (await response.json()) as {
    error?: { message?: string };
    message?: string;
    added?: number;
    codes?: string[];
    masked?: string[];
    via?: string;
    email?: string;
  };
  if (!response.ok) throw new Error(data.error?.message ?? "The desk refused that action");
  return data;
}

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

function statusStyle(status: string) {
  if (status === "DELIVERED") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (status === "REVIEWING") return "border-amber-300/35 bg-amber-300/10 text-amber-100";
  if (status === "PENDING") return "border-sky-300/30 bg-sky-300/10 text-sky-100";
  if (status === "PAID") return "border-violet-300/30 bg-violet-300/10 text-violet-100";
  if (status === "FAILED" || status === "REFUNDED") return "border-red-400/30 bg-red-400/10 text-red-200";
  return "border-white/15 bg-white/5 text-white/70";
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export type AdminDeskConfig = {
  paymentMode: "demo" | "live";
  feePercent: number;
  siteUrl: string;
  deposits: Array<{
    id: string;
    label: string;
    hint: string;
    number: string;
    name: string;
    note?: string;
  }>;
  icash: IcashDeskConfig;
};

export type DeskSale = {
  id: string;
  number: string;
  name: string;
  email: string;
  phone: string;
  faceValue: number;
  payout: number;
  method: string;
  payoutNumber: string;
  code: string;
  status: string;
  createdAt: string;
};

export function AdminDashboard({
  snapshot,
  sells = [],
  desk,
  me,
  staff = [],
}: {
  sells?: DeskSale[];
  snapshot: AdminSnapshot;
  desk: AdminDeskConfig;
  me: DeskAdmin;
  staff?: DeskAdmin[];
}) {
  const t = useT();
  const router = useRouter();
  const [section, setSection] = useState<AdminSection>("dashboard");
  const [pending, setPending] = useState(false);
  const [pickedCustomer, setPickedCustomer] = useState<string | null>(null);
  const [unlockedCodes, setUnlockedCodes] = useState<string[]>([]);
  const [lastSend, setLastSend] = useState<{ email: string; masked: string[] } | null>(null);
  const [activityQuery, setActivityQuery] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
    }, 30000);
    return () => window.clearInterval(id);
  }, [router]);

  const reviewing = useMemo(
    () => snapshot.orders.filter((order) => order.status === "REVIEWING"),
    [snapshot.orders],
  );

  const stats = useMemo(() => {
    const pendingPay = snapshot.orders.filter((o) => o.status === "PENDING").length;
    const delivered = snapshot.orders.filter((o) => o.status === "DELIVERED");
    const failed = snapshot.orders.filter(
      (o) => o.status === "FAILED" || o.status === "REFUNDED",
    ).length;
    const revenue = delivered.reduce((sum, o) => sum + o.total, 0);
    const openValue = snapshot.orders
      .filter((o) => o.status === "PENDING" || o.status === "REVIEWING")
      .reduce((sum, o) => sum + o.total, 0);
    const withProof = snapshot.orders.filter((o) => o.hasProof).length;
    const avgTicket = delivered.length ? Math.round(revenue / delivered.length) : 0;
    const closed = delivered.length + failed;
    const successRate = closed > 0 ? Math.round((delivered.length / closed) * 100) : 0;

    const now = new Date();
    const thisKey = monthKey(now);
    const thisMonth = snapshot.orders
      .filter((o) => monthKey(new Date(o.createdAt)) === thisKey)
      .reduce((sum, o) => sum + o.total, 0);

    const methodMap = new Map<string, number>();
    for (const order of snapshot.orders) {
      if (!order.paymentMethod) continue;
      methodMap.set(order.paymentMethod, (methodMap.get(order.paymentMethod) ?? 0) + 1);
    }
    const methods = [...methodMap.entries()]
      .map(([name, n]) => ({ name, n }))
      .sort((a, b) => b.n - a.n);

    const mix = [
      { label: t("admin.pending"), n: pendingPay, color: "#38bdf8" },
      { label: t("admin.review"), n: reviewing.length, color: "#fbbf24" },
      { label: t("admin.kpiDelivered"), n: delivered.length, color: "#34d399" },
      { label: t("admin.failed"), n: failed, color: "#f87171" },
      { label: t("admin.ordersSell"), n: sells.filter((sale) => sale.status === "OPEN" || sale.status === "PAID").length, color: "#c084fc" },
    ].filter((row) => row.n > 0 || row.label !== t("admin.ordersSell"));

    const chartKeys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      chartKeys.push(monthKey(d));
    }
    const chartTotals = new Map(chartKeys.map((k) => [k, 0]));
    for (const order of snapshot.orders) {
      const key = monthKey(new Date(order.createdAt));
      if (chartTotals.has(key)) {
        chartTotals.set(key, (chartTotals.get(key) ?? 0) + order.total);
      }
    }
    const chart = chartKeys.map((key) => {
      const [y, m] = key.split("-").map(Number);
      return {
        key,
        label: new Date(y, m - 1, 1).toLocaleString("en", { month: "short" }),
        total: chartTotals.get(key) ?? 0,
      };
    });
    const chartMax = Math.max(1, ...chart.map((r) => r.total));

    return {
      pendingPay,
      delivered: delivered.length,
      failed,
      revenue,
      openValue,
      withProof,
      avgTicket,
      successRate,
      thisMonth,
      methods,
      mix,
      chart,
      chartMax,
      orderCount: snapshot.totals.orderCount,
      inbox: reviewing.length,
    };
  }, [snapshot, reviewing.length, sells, t]);

  const activity = useMemo(() => {
    const rows: ActivityRow[] = [];

    for (const entry of snapshot.audit) {
      const bad = entry.action.includes("fail") || entry.action.includes("refund");
      const ok = entry.action.includes("deliver") || entry.action.includes("approve");
      const warn = entry.action.includes("proof") || entry.action.includes("reveal");
      rows.push({
        id: `audit-${entry.id}`,
        at: entry.createdAt,
        title: humanAction(entry.action),
        body: `${entry.actor}${entry.targetId ? ` · ${entry.targetId.slice(0, 12)}` : ""}`,
        tone: bad ? "bad" : ok ? "ok" : warn ? "warn" : "info",
      });
    }

    for (const order of snapshot.orders) {
      rows.push({
        id: `ord-create-${order.id}`,
        at: order.createdAt,
        title: "Order created",
        body: `${order.number} · ${order.email} · ${formatBdt(order.total)}`,
        tone: "info",
      });
      if (order.proofSubmittedAt) {
        rows.push({
          id: `ord-proof-${order.id}`,
          at: order.proofSubmittedAt,
          title: "Deposit proof uploaded",
          body: `${order.number} · ${(order.paymentMethod ?? "pay").toUpperCase()} · ${order.transactionId ?? "no TrxID"}`,
          tone: "warn",
        });
      }
      if (order.deliveredAt) {
        rows.push({
          id: `ord-del-${order.id}`,
          at: order.deliveredAt,
          title: "Code delivered",
          body: `${order.number} · ${order.title} × ${order.quantity}`,
          tone: "ok",
        });
      }
    }

    const q = activityQuery.trim().toLowerCase();
    return rows
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))
      .filter((row) => {
        if (!q) return true;
        return row.title.toLowerCase().includes(q) || row.body.toLowerCase().includes(q);
      });
  }, [snapshot.audit, snapshot.orders, activityQuery]);

  const mixTotal = Math.max(1, stats.mix.reduce((s, m) => s + m.n, 0));

  const customers = useMemo(() => {
    const map = new Map<
      string,
      {
        email: string;
        phone: string;
        orders: number;
        spent: number;
        delivered: number;
        open: number;
        lastAt: string;
        methods: Set<string>;
      }
    >();
    for (const order of snapshot.orders) {
      const row = map.get(order.email) ?? {
        email: order.email,
        phone: order.phone ?? "",
        orders: 0,
        spent: 0,
        delivered: 0,
        open: 0,
        lastAt: order.createdAt,
        methods: new Set<string>(),
      };
      row.orders += 1;
      if (order.status === "DELIVERED" || order.status === "PAID") row.spent += order.total;
      if (order.status === "DELIVERED") row.delivered += 1;
      if (order.status === "PENDING" || order.status === "REVIEWING") row.open += 1;
      if (order.phone && !row.phone) row.phone = order.phone;
      if (order.paymentMethod) row.methods.add(order.paymentMethod);
      if (+new Date(order.createdAt) > +new Date(row.lastAt)) row.lastAt = order.createdAt;
      map.set(order.email, row);
    }
    const q = customerQuery.trim().toLowerCase();
    return [...map.values()]
      .sort((a, b) => b.spent - a.spent || b.orders - a.orders)
      .filter((row) => {
        if (!q) return true;
        return (
          row.email.toLowerCase().includes(q) ||
          row.phone.includes(q)
        );
      });
  }, [snapshot.orders, customerQuery]);

  const week = useMemo(() => {
    const days: { key: string; label: string; orders: number; revenue: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      days.push({
        key: dayKey(date),
        label: date.toLocaleDateString("en", { weekday: "short" }),
        orders: 0,
        revenue: 0,
      });
    }
    const map = new Map(days.map((day) => [day.key, day]));
    for (const order of snapshot.orders) {
      const row = map.get(dayKey(new Date(order.createdAt)));
      if (!row) continue;
      row.orders += 1;
      if (order.status === "DELIVERED" || order.status === "PAID") row.revenue += order.total;
    }
    const orderCount = days.reduce((sum, day) => sum + day.orders, 0);
    const revenue = days.reduce((sum, day) => sum + day.revenue, 0);
    const issued = snapshot.orders.filter((order) => {
      const at = order.issuance?.issuedAt ?? order.deliveredAt;
      if (!at) return false;
      const age = Date.now() - +new Date(at);
      return age >= 0 && age <= 7 * 24 * 60 * 60 * 1000 && order.issuance?.status === "ISSUED";
    }).length;
    return {
      days,
      orderCount,
      revenue,
      issued,
      waiting: stats.inbox,
      maxOrders: Math.max(1, ...days.map((day) => day.orders)),
    };
  }, [snapshot.orders, stats.inbox]);

  const latestOrders = snapshot.orders.slice(0, 6);
  const topBuyers = customers.slice(0, 6);

  const creditHistory = useMemo(
    () =>
      snapshot.orders
        .filter((order) => order.issuance)
        .map((order) => ({
          id: order.id,
          number: order.number,
          email: order.email,
          title: order.title,
          when: order.issuance!.issuedAt ?? order.issuance!.startedAt,
          amount: order.issuance!.cost ?? order.issuance!.amount ?? order.voucher,
          currency: order.issuance!.currency,
          method: order.paymentMethod,
          status: order.issuance!.status,
        }))
        .sort((a, b) => +new Date(b.when) - +new Date(a.when)),
    [snapshot.orders],
  );

  const customerOrders = useMemo(() => {
    if (pickedCustomer) {
      return snapshot.orders.filter((order) => order.email.toLowerCase() === pickedCustomer.toLowerCase());
    }
    const q = customerQuery.trim().toLowerCase();
    if (!q) return [];
    return snapshot.orders.filter(
      (order) => order.email.toLowerCase().includes(q) || (order.phone ?? "").includes(q),
    );
  }, [snapshot.orders, pickedCustomer, customerQuery]);

  const paymentRows = useMemo(
    () =>
      snapshot.orders.filter(
        (o) =>
          Boolean(o.transactionId) ||
          o.hasProof ||
          o.status === "REVIEWING" ||
          o.status === "DELIVERED" ||
          o.status === "PAID",
      ),
    [snapshot.orders],
  );

  const refundRows = useMemo(
    () =>
      snapshot.orders.filter(
        (o) =>
          o.status === "REFUNDED" ||
          o.status === "FAILED" ||
          o.status === "PAID" ||
          o.status === "DELIVERED",
      ),
    [snapshot.orders],
  );

  const badges = useMemo(
    () => ({
      inbox: stats.inbox,
      refunds: snapshot.orders.filter((o) => o.status === "REFUNDED" || o.status === "FAILED").length,
      pending: stats.pendingPay,
      icash: snapshot.ledger.queue.failed,
    }),
    [stats.inbox, stats.pendingPay, snapshot.orders, snapshot.ledger.queue.failed],
  );

  async function run(action: () => Promise<string>) {
    setPending(true);
    try {
      const result = await action();
      await notifySuccess(t("admin.done"), result);
      router.refresh();
    } catch (caught) {
      await notifyError(
        t("admin.deskRefused"),
        caught instanceof Error ? caught.message : t("admin.deskRefused"),
      );
    } finally {
      setPending(false);
    }
  }

  function handleSettled(data: { codes?: string[]; masked?: string[]; via?: string; email?: string }) {
    if (data.codes?.length) setUnlockedCodes(data.codes);
    if (data.via === "icash" && data.email) {
      setLastSend({ email: data.email, masked: data.masked ?? [] });
    }
  }

  return (
    <AdminShell section={section} onSection={setSection} badges={badges}>
      {section === "dashboard" ? (
        <div className="mt-1 space-y-4 md:mt-4 md:space-y-5">
          <div className="admin-card">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--ad-line)] px-4 py-4 sm:px-5">
              <div>
                <p className="ad-kicker text-[11px] font-semibold uppercase tracking-[0.14em]">{t("admin.weekTitle")}</p>
                <h2 className="mt-0.5 text-lg font-bold">{t("admin.deskPulse")}</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/[0.08] sm:grid-cols-4">
              <Kpi label={t("admin.weekOrders")} value={String(week.orderCount)} />
              <Kpi label={t("admin.weekRevenue")} value={formatBdt(week.revenue)} />
              <Kpi label={t("admin.weekIssued")} value={String(week.issued)} />
              <Kpi label={t("admin.weekWaiting")} value={String(week.waiting)} hot={week.waiting > 0} />
            </div>
            <div className="px-4 py-5 sm:px-5">
              <div className="flex h-40 items-end gap-2">
                {week.days.map((day) => {
                  const height = Math.max(day.orders > 0 ? 12 : 4, (day.orders / week.maxOrders) * 100);
                  return (
                    <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                      <p className="text-[10px] tabular-nums text-white/40">{day.orders || "—"}</p>
                      <div className="relative flex w-full flex-1 items-end">
                        <div
                          className="mx-auto w-full max-w-[48px] rounded-t-md"
                          style={{
                            height: `${height}%`,
                            background:
                              day.orders > 0
                                ? "linear-gradient(180deg, #e8d5b5, #c9b896 68%, #8a7350)"
                                : "rgba(255,255,255,0.08)",
                          }}
                        />
                      </div>
                      <p className="text-[11px] font-semibold text-white/45">{day.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title={t("admin.statusMix")} eyebrow={t("admin.statistics")}>
              <ul className="space-y-3">
                {stats.mix.map((row) => (
                  <li key={row.label}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <p className="font-semibold text-white/80">{row.label}</p>
                      <p className="tabular-nums text-white/55">{row.n}</p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(row.n ? 6 : 0, (row.n / mixTotal) * 100)}%`, background: row.color }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title={t("admin.paymentMethods")} eyebrow={t("admin.channels")}>
              {stats.methods.length === 0 ? (
                <p className="text-sm text-white/45">{t("admin.noLatest")}</p>
              ) : (
                <ul className="space-y-3">
                  {stats.methods.map((row) => {
                    const total = stats.methods.reduce((sum, item) => sum + item.n, 0) || 1;
                    return (
                      <li key={row.name} className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold uppercase text-white/85">{row.name}</p>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-[var(--ad-gold)]"
                              style={{ width: `${Math.max(8, (row.n / total) * 100)}%` }}
                            />
                          </div>
                        </div>
                        <p className="shrink-0 tabular-nums text-sm font-bold text-white">{row.n}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>

          <Panel title={t("admin.revenueTrend")} eyebrow={t("admin.last6Months")}>
            <div className="flex h-40 items-end gap-2">
              {stats.chart.map((row) => {
                const height = Math.max(row.total > 0 ? 12 : 4, (row.total / stats.chartMax) * 100);
                return (
                  <div key={row.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                    <p className="max-w-full truncate text-[10px] tabular-nums text-white/40">
                      {row.total ? formatBdt(row.total) : "—"}
                    </p>
                    <div className="relative flex w-full flex-1 items-end">
                      <div
                        className="mx-auto w-full max-w-[48px] rounded-t-md"
                        style={{
                          height: `${height}%`,
                          background:
                            row.total > 0
                              ? "linear-gradient(180deg, #34d399, #059669 75%)"
                              : "rgba(255,255,255,0.08)",
                        }}
                      />
                    </div>
                    <p className="text-[11px] font-semibold text-white/45">{row.label}</p>
                  </div>
                );
              })}
            </div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title={t("admin.recentOrdersCount", { n: snapshot.orders.length })}
              eyebrow={t("admin.recentOrders")}
              action={
                <button type="button" onClick={() => setSection("history")} className="ad-link text-xs font-semibold">
                  {t("admin.openOrders")}
                </button>
              }
            >
              {latestOrders.length === 0 ? (
                <p className="text-sm text-white/45">{t("admin.noLatest")}</p>
              ) : (
                <ul className="divide-y divide-white/8">
                  {latestOrders.map((order) => (
                    <li
                      key={order.id}
                      className="flex cursor-pointer items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      onClick={() => setSection("history")}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{order.email}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-white/40">
                          {order.number} · {(order.paymentMethod ?? "—").toUpperCase()} · {formatWhen(order.createdAt)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums">{formatBdt(order.total)}</p>
                        <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title={t("admin.topBuyers")} eyebrow={t("admin.topBuyersLead")}>
              {topBuyers.length === 0 ? (
                <p className="text-sm text-white/45">{t("admin.noTopBuyers")}</p>
              ) : (
                <ul className="divide-y divide-white/8">
                  {topBuyers.map((row) => (
                    <li key={row.email} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{row.email}</p>
                        <p className="mt-0.5 text-[11px] text-white/40">
                          {row.orders} · {row.phone || "—"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums">{formatBdt(row.spent)}</p>
                        <button
                          type="button"
                          className="ad-warn mt-1 text-[11px] font-semibold"
                          onClick={() => {
                            setPickedCustomer(row.email);
                            setCustomerQuery(row.email);
                            setSection("customerHistory");
                          }}
                        >
                          {t("admin.viewCustomer")}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      ) : null}


      {section === "orders" ? (
        <OrderReceipts
          snapshot={snapshot}
          sells={sells}
          busy={pending}
          onRun={run}
          onSettled={handleSettled}
        />
      ) : null}

      {section === "history" ? (
        <section className="mt-1 space-y-4 md:mt-4">
          {lastSend ? (
            <div className="admin-card border-emerald-400/20 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                {t("admin.noticeSent", { email: lastSend.email })}
              </p>
              {lastSend.masked.length ? (
                <p className="mt-2 font-mono text-sm text-white/80">{lastSend.masked.join(" · ")}</p>
              ) : null}
            </div>
          ) : null}
          {unlockedCodes.length > 0 ? (
            <div className="admin-card border-emerald-400/20">
              <div className="border-b border-emerald-400/20 px-5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                  {t("admin.justUnlocked")}
                </p>
              </div>
              <div className="grid gap-2.5 p-4">
                {unlockedCodes.map((code) => (
                  <CodeRow key={code} code={code} />
                ))}
              </div>
            </div>
          ) : null}

          <OrderReceipts
            snapshot={snapshot}
            sells={sells}
            busy={pending}
            onRun={run}
            onSettled={handleSettled}
            withFilters
          />
        </section>
      ) : null}

      {section === "statement" ? <StatementDesk snapshot={snapshot} sells={sells} /> : null}

      {section === "balance" ? (
        <section className="mt-1 space-y-4 md:mt-4 md:space-y-5">
          <IcashCreditCard connected={desk.icash.connected} />
          <Panel title={t("admin.creditHistory")} eyebrow={t("admin.creditUsed")}>
            {creditHistory.length === 0 ? (
              <p className="text-sm text-white/45">{t("admin.creditEmpty")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-[0.12em] text-white/35">
                    <tr>
                      <th className="pb-3 font-semibold">{t("admin.creditWhen")}</th>
                      <th className="pb-3 font-semibold">{t("admin.creditRef")}</th>
                      <th className="pb-3 font-semibold">{t("admin.creditMethod")}</th>
                      <th className="pb-3 text-right font-semibold">{t("admin.creditAmount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8">
                    {creditHistory.map((row) => (
                      <tr key={row.id}>
                        <td className="py-3 text-white/55">{formatWhen(row.when)}</td>
                        <td className="py-3">
                          <p className="font-mono text-[12px] text-white/80">{row.number}</p>
                          <p className="text-[11px] text-white/40">{row.title}</p>
                        </td>
                        <td className="py-3 uppercase text-white/70">{row.method ?? "iCash"}</td>
                        <td className="py-3 text-right">
                          <p className="font-bold tabular-nums text-white">
                            {row.currency && row.currency !== "BDT" ? `${row.amount} ${row.currency}` : formatBdt(Math.round(row.amount))}
                          </p>
                          <p className="text-[11px] text-white/40">
                            {row.status === "ISSUED"
                              ? t("admin.creditUsed")
                              : row.status === "FAILED"
                                ? t("admin.creditFailed")
                                : t("admin.creditIssuing")}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </section>
      ) : null}

      {section === "customers" ? (
        <section className="mt-1 space-y-4 md:mt-4">
          <div className="admin-card p-4 sm:px-5">
            <input
              value={customerQuery}
              onChange={(event) => setCustomerQuery(event.target.value)}
              placeholder="Search email or phone…"
              className="ad-input h-11 w-full rounded-xl px-3 text-sm sm:max-w-md"
            />
            <p className="mt-2 text-xs text-white/40">
              {customers.length} buyers · sorted by lifetime spend
            </p>
          </div>
          <div className="admin-card">
            {customers.length === 0 ? (
              <Empty title="No customers yet" body="Buyers appear here after the first order." />
            ) : (
              <ul className="divide-y divide-white/8">
                {customers.map((row) => (
                  <li
                    key={row.email}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold">{row.email}</p>
                        {row.orders > 1 ? (
                          <span className="rounded-full border border-sky-300/30 bg-sky-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-200">
                            Repeat ×{row.orders}
                          </span>
                        ) : (
                          <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-white/45">
                            New
                          </span>
                        )}
                        {row.open > 0 ? (
                          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-100">
                            {row.open} open
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-white/45">
                        {row.phone || "No phone"} · last {formatWhen(row.lastAt)}
                        {row.methods.size
                          ? ` · ${[...row.methods].map((m) => m.toUpperCase()).join(", ")}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                    <div className="grid grid-cols-3 gap-3 text-left text-xs sm:min-w-[220px] sm:text-right">
                      <div>
                        <p className="text-white/35">Orders</p>
                        <p className="mt-0.5 font-bold tabular-nums text-white">{row.orders}</p>
                      </div>
                      <div>
                        <p className="text-white/35">Delivered</p>
                        <p className="mt-0.5 font-bold tabular-nums text-white">{row.delivered}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white/35">Spent</p>
                        <p className="mt-0.5 break-words font-bold tabular-nums text-white">{formatBdt(row.spent)}</p>
                      </div>
                    </div>
                      <button
                        type="button"
                        className="ad-link text-xs font-semibold"
                        onClick={() => {
                          setPickedCustomer(row.email);
                          setCustomerQuery(row.email);
                          setSection("customerHistory");
                        }}
                      >
                        {t("admin.viewCustomer")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {section === "customerHistory" ? (
        <section className="mt-1 space-y-4 md:mt-4">
          <div className="admin-card p-4 sm:px-5">
            <input
              value={customerQuery}
              onChange={(event) => {
                setCustomerQuery(event.target.value);
                setPickedCustomer(event.target.value.trim() || null);
              }}
              placeholder="Search email or phone…"
              className="ad-input h-11 w-full rounded-xl px-3 text-sm sm:max-w-md"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {customers.slice(0, 8).map((row) => (
                <button
                  key={row.email}
                  type="button"
                  onClick={() => {
                    setPickedCustomer(row.email);
                    setCustomerQuery(row.email);
                  }}
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={
                    pickedCustomer === row.email
                      ? { background: "#fff", color: "#09090b", borderColor: "#fff" }
                      : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.1)" }
                  }
                >
                  {row.email}
                </button>
              ))}
            </div>
          </div>
          <div className="admin-card">
            {customerOrders.length === 0 ? (
              <Empty title={t("admin.noLatest")} body={t("admin.leadCustomerHistory")} />
            ) : (
              <ul className="divide-y divide-white/8">
                {customerOrders.map((order) => (
                  <li key={order.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-[11px] text-white/45">{order.number}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold">{order.title} · {formatBdt(order.total)}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {(order.paymentMethod ?? "—").toUpperCase()}
                        {order.transactionId ? ` · ${order.transactionId}` : ""} · {formatWhen(order.createdAt)}
                      </p>
                    </div>
                    {order.hasProof ? (
                      <a
                        href={`/api/admin/orders/${order.id}/proof`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center rounded-xl border border-white/15 px-3.5 text-sm font-semibold text-white/80 hover:bg-white/5"
                      >
                        Screenshot
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {false ? (
        <section className="mt-1 space-y-4 md:mt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Payment rows" value={String(paymentRows.length)} />
            <MiniStat
              label="With TrxID"
              value={String(paymentRows.filter((o) => o.transactionId).length)}
            />
            <MiniStat label="With proof" value={String(paymentRows.filter((o) => o.hasProof).length)} />
            <MiniStat label="Pending deposit" value={String(stats.pendingPay)} hot={stats.pendingPay > 0} />
          </div>
          <div className="admin-card">
            {paymentRows.length === 0 ? (
              <Empty title="No payments logged" body="TrxIDs and proofs appear after buyers deposit." />
            ) : (
              <ul className="divide-y divide-white/8">
                {paymentRows.map((order) => (
                  <li
                    key={order.id}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-[11px] text-white/45">{order.number}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold">
                        {(order.paymentMethod ?? "deposit").toUpperCase()} · {formatBdt(order.total)}
                      </p>
                      <p className="mt-1 font-mono text-xs text-white/55">
                        TrxID {order.transactionId || "—"}
                        {order.paymentRef ? ` · ref ${order.paymentRef}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {order.email}
                        {order.phone ? ` · ${order.phone}` : ""} ·{" "}
                        {formatWhen(order.proofSubmittedAt ?? order.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {order.hasProof ? (
                        <a
                          href={`/api/admin/orders/${order.id}/proof`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-10 items-center rounded-xl border border-white/15 px-3.5 text-sm font-semibold text-white/80 hover:bg-white/5"
                        >
                          Screenshot
                        </a>
                      ) : null}
                      {order.status === "REVIEWING" ? (
                        <ActionButton primary onClick={() => setSection("history")}>
                          Open inbox
                        </ActionButton>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {false ? (
        <section className="mt-1 space-y-4 md:mt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MiniStat
              label="Failed / refunded"
              value={String(
                snapshot.orders.filter((o) => o.status === "FAILED" || o.status === "REFUNDED").length,
              )}
              hot
            />
            <MiniStat
              label="Refundable now"
              value={String(
                snapshot.orders.filter((o) => o.status === "PAID" || o.status === "DELIVERED").length,
              )}
            />
            <MiniStat label={t("icashDesk.kpiIssued")} value={String(snapshot.ledger.all.issued)} />
          </div>
          <div className="admin-card">
            {refundRows.length === 0 ? (
              <Empty title="Nothing here" body="Failed, refunded, or refundable orders show up here." />
            ) : (
              <ul className="divide-y divide-white/8">
                {refundRows.map((order) => (
                  <li
                    key={order.id}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-[11px] text-white/45">{order.number}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyle(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold">
                        {order.title} · {formatBdt(order.total)}
                      </p>
                      <p className="mt-1 text-xs text-white/45">
                        {order.email} · {formatWhen(order.createdAt)}
                      </p>
                    </div>
                    {order.status === "PAID" || order.status === "DELIVERED" ? (
                      <ActionButton
                        disabled={pending}
                        onClick={() =>
                          run(async () => {
                            await post(`/api/admin/orders/${order.id}/refund`);
                            return "Order refunded";
                          })
                        }
                      >
                        Refund
                      </ActionButton>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {section === "payment" ? (
        <PaymentDesk desk={desk} snapshot={snapshot} me={me} staff={staff} busy={pending} onRun={run} />
      ) : null}
    </AdminShell>
  );
}

function IcashCreditCard({ connected }: { connected: boolean }) {
  const t = useT();
  const [balance, setBalance] = useState<
    | { state: "idle" }
    | { state: "loading" }
    | { state: "ok"; balance: number; currency: string; checkedAt: string }
    | { state: "error"; message: string }
  >({ state: "idle" });

  async function check() {
    setBalance({ state: "loading" });
    try {
      const response = await fetch("/api/admin/icash/balance", { cache: "no-store" });
      const data = (await response.json()) as {
        ok?: boolean;
        balance?: number;
        currency?: string;
        checkedAt?: string;
        message?: string;
        error?: { message?: string };
      };
      if (data.ok && typeof data.balance === "number") {
        setBalance({
          state: "ok",
          balance: data.balance,
          currency: data.currency ?? "BDT",
          checkedAt: data.checkedAt ?? new Date().toISOString(),
        });
      } else {
        setBalance({ state: "error", message: data.message ?? data.error?.message ?? t("icashDesk.balanceIdle") });
      }
    } catch {
      setBalance({ state: "error", message: t("admin.reachFailed") });
    }
  }

  useEffect(() => {
    if (connected) void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once when the page opens
  }, [connected]);

  return (
    <section className="relative admin-card p-5 sm:p-7">
      <p className="relative text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">{t("admin.creditNow")}</p>
      <div className="relative mt-3 min-h-[3.5rem]">
        {balance.state === "ok" ? (
          <p className="text-[clamp(2.2rem,6vw,3.4rem)] font-extrabold leading-none tracking-tight tabular-nums">
            {balance.currency === "BDT" || !balance.currency
              ? formatBdt(Math.round(balance.balance))
              : `${balance.balance.toLocaleString("en")} ${balance.currency}`}
          </p>
        ) : balance.state === "error" ? (
          <p className="ad-warn text-sm font-semibold">{balance.message}</p>
        ) : (
          <p className="text-sm text-white/45">
            {!connected
              ? t("icashDesk.notConnected")
              : balance.state === "loading"
                ? t("icashDesk.checking")
                : t("icashDesk.balanceIdle")}
          </p>
        )}
        {balance.state === "ok" ? (
          <p className="mt-2 text-[11px] text-white/35">{t("icashDesk.checkedAt", { when: formatWhen(balance.checkedAt) })}</p>
        ) : null}
      </div>
      <button
        type="button"
        disabled={!connected || balance.state === "loading"}
        onClick={() => void check()}
        className="relative mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
      >
        {balance.state === "loading" ? t("icashDesk.checking") : t("icashDesk.checkBalance")}
      </button>
    </section>
  );
}

function Kpi({
  label,
  value,
  hot = false,
  compact = false,
}: {
  label: string;
  value: string;
  hot?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`ad-cell min-w-0 px-3 sm:px-5 ${compact ? "py-3" : "py-3.5"}`}>
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p
        className={`mt-1 break-words font-extrabold tabular-nums tracking-tight ${
          compact ? "text-sm sm:text-lg" : "text-lg sm:text-2xl"
        } ${hot ? "ad-warn" : "text-[var(--ad-ink)]"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title: string;
  eyebrow: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`admin-card ${className}`}>
      <div className="flex items-end justify-between gap-3 border-b border-[var(--ad-line)] px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{eyebrow}</p>
          <h2 className="mt-0.5 truncate text-lg font-bold tracking-tight">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary = false,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${
        primary
          ? "ad-btn h-11 px-4 text-sm"
          : "inline-flex h-11 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/80 hover:bg-white/5 disabled:opacity-40"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-12 text-center">
      <p className="text-lg font-bold text-white/90">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-white/40">{body}</p>
    </div>
  );
}

function QuickChip({
  label,
  onClick,
  hot = false,
}: {
  label: string;
  onClick: () => void;
  hot?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3 py-1.5 text-xs font-semibold transition"
      style={
        hot
          ? { background: "var(--ad-gold)", color: "#14110c" }
          : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }
      }
    >
      {label}
    </button>
  );
}

function MiniStat({
  label,
  value,
  hot = false,
}: {
  label: string;
  value: string;
  hot?: boolean;
}) {
  return (
    <div className="min-w-0 admin-card px-3 py-3.5 sm:px-4">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className={`mt-1 break-words text-lg font-extrabold tabular-nums sm:text-xl ${hot ? "ad-warn" : "text-[var(--ad-ink)]"}`}>
        {value}
      </p>
    </div>
  );
}

function CodeRow({ code, compact = false }: { code: string; compact?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between ${
        compact ? "" : "px-4 py-3"
      }`}
    >
      <p className="break-all font-mono text-sm tracking-wide text-white">{code}</p>
      <button
        type="button"
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-white px-3 text-xs font-semibold text-black"
        onClick={async () => {
          try {
            await copyText(code);
            await notifySuccess("Copied", "Code copied to clipboard.");
          } catch {
            await notifyError("Copy failed", "Could not copy");
          }
        }}
      >
        Copy
      </button>
    </div>
  );
}

function ActivityList({ rows }: { rows: ActivityRow[] }) {
  return (
    <ul className="space-y-0">
      {rows.map((row, index) => (
        <li
          key={row.id}
          className="flex gap-3 py-3"
          style={{ borderTop: index === 0 ? undefined : "1px solid rgba(255,255,255,0.06)" }}
        >
          <span
            aria-hidden
            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
              row.tone === "ok"
                ? "bg-emerald-400"
                : row.tone === "warn"
                  ? "bg-amber-300"
                  : row.tone === "bad"
                    ? "bg-red-400"
                    : "bg-sky-400"
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-white/90">{row.title}</p>
              <p className="text-[11px] text-white/35">{formatWhen(row.at)}</p>
            </div>
            <p className="mt-0.5 break-all text-xs text-white/45">{row.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
