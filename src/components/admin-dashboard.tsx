"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell, type AdminSection } from "@/components/admin/admin-shell";
import { useT } from "@/i18n/provider";
import {
  buildTodayStats,
  downloadText,
  exportOrdersCsv,
  humanAction,
  repeatCount,
  waitLabel,
  waitMinutes,
} from "@/lib/admin-ops";
import { formatBdt, formatWhen } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/swal";
import type { AdminSnapshot } from "@/lib/types";

type OrderFilter = "all" | "PENDING" | "REVIEWING" | "DELIVERED" | "FAILED";

type ActivityRow = {
  id: string;
  at: string;
  title: string;
  body: string;
  tone: "ok" | "warn" | "info" | "bad";
};

async function post(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : "{}",
  });
  const data = (await response.json()) as {
    error?: { message?: string };
    message?: string;
    added?: number;
    codes?: string[];
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
}: {
  sells?: DeskSale[];
  snapshot: AdminSnapshot;
  desk: AdminDeskConfig;
}) {
  const t = useT();
  const router = useRouter();
  const [section, setSection] = useState<AdminSection>("overview");
  const [slug, setSlug] = useState(snapshot.products[0]?.slug ?? "");
  const [csv, setCsv] = useState("");
  const [pending, setPending] = useState(false);
  const [unlockedCodes, setUnlockedCodes] = useState<string[]>([]);
  const [revealedByOrder, setRevealedByOrder] = useState<Record<string, string[]>>({});
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [query, setQuery] = useState("");
  const [activityQuery, setActivityQuery] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(() => Date.now());

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      router.refresh();
      setLastRefresh(Date.now());
    }, 30000);
    return () => window.clearInterval(id);
  }, [autoRefresh, router]);

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
    ];

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
      ready: snapshot.totals.codeReady,
      held: snapshot.totals.codeHeld,
      sold: snapshot.totals.codeSold,
      voided: snapshot.totals.codeVoid,
      orderCount: snapshot.totals.orderCount,
      inbox: reviewing.length,
    };
  }, [snapshot, reviewing.length, t]);

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

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return snapshot.orders.filter((order) => {
      if (orderFilter === "FAILED") {
        if (order.status !== "FAILED" && order.status !== "REFUNDED") return false;
      } else if (orderFilter !== "all" && order.status !== orderFilter) {
        return false;
      }
      if (!q) return true;
      return (
        order.number.toLowerCase().includes(q) ||
        order.email.toLowerCase().includes(q) ||
        (order.phone ?? "").includes(q) ||
        (order.transactionId ?? "").toLowerCase().includes(q) ||
        (order.paymentRef ?? "").toLowerCase().includes(q) ||
        order.title.toLowerCase().includes(q)
      );
    });
  }, [snapshot.orders, orderFilter, query]);

  const recentOrders = snapshot.orders.slice(0, 8);
  const mixTotal = Math.max(1, stats.mix.reduce((s, m) => s + m.n, 0));
  const today = useMemo(() => buildTodayStats(snapshot), [snapshot]);

  const alerts = useMemo(() => {
    const rows: Array<{ id: string; tone: "hot" | "warn" | "ok"; title: string; body: string }> = [];
    const now = Date.now();
    const reviewingOrders = snapshot.orders.filter((o) => o.status === "REVIEWING");
    const aging = reviewingOrders.filter(
      (o) => (waitMinutes(o.proofSubmittedAt ?? o.createdAt, now) ?? 0) >= 30,
    );
    if (aging.length > 0) {
      rows.push({
        id: "aging",
        tone: "hot",
        title: t("admin.alertAgingTitle", { n: aging.length }),
        body: t("admin.alertAgingBody"),
      });
    } else if (reviewingOrders.length > 0) {
      rows.push({
        id: "inbox",
        tone: "warn",
        title: t("admin.alertInboxTitle", { n: reviewingOrders.length }),
        body: t("admin.alertInboxBody"),
      });
    }
    const pendingPay = snapshot.orders.filter((o) => o.status === "PENDING").length;
    if (pendingPay > 0) {
      rows.push({
        id: "pending",
        tone: "warn",
        title: t("admin.alertPendingTitle", { n: pendingPay }),
        body: t("admin.alertPendingBody"),
      });
    }
    for (const product of snapshot.products) {
      if (product.stock <= 2) {
        rows.push({
          id: `stock-${product.id}`,
          tone: product.stock === 0 ? "hot" : "warn",
          title:
            product.stock === 0
              ? t("admin.alertSoldOut", { amount: formatBdt(product.faceValue) })
              : t("admin.alertLowStock", {
                  amount: formatBdt(product.faceValue),
                  n: product.stock,
                }),
          body: t("admin.alertStockBody"),
        });
      }
    }
    if (rows.length === 0) {
      rows.push({
        id: "clear",
        tone: "ok",
        title: t("admin.alertClearTitle"),
        body: t("admin.alertClearBody"),
      });
    }
    return rows;
  }, [snapshot, t]);

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
    }),
    [stats.inbox, stats.pendingPay, snapshot.orders],
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

  const titles: Record<AdminSection, { title: string; lead: string }> = {
    overview: { title: t("admin.titleOverview"), lead: t("admin.leadOverview") },
    inbox: { title: t("admin.titleInbox"), lead: t("admin.leadInbox") },
    stock: { title: t("admin.titleStock"), lead: t("admin.leadStock") },
    orders: { title: t("admin.titleOrders"), lead: t("admin.leadOrders") },
    customers: { title: t("admin.titleCustomers"), lead: t("admin.leadCustomers") },
    payments: { title: t("admin.titlePayments"), lead: t("admin.leadPayments") },
    refunds: { title: t("admin.titleRefunds"), lead: t("admin.leadRefunds") },
    reports: { title: t("admin.titleReports"), lead: t("admin.leadReports") },
    activity: { title: t("admin.titleActivity"), lead: t("admin.leadActivity") },
    settings: { title: t("admin.titleSettings"), lead: t("admin.leadSettings") },
  };

  return (
    <AdminShell section={section} onSection={setSection} badges={badges}>
      <header className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c]">
        <div className="relative overflow-hidden border-b border-white/10 px-5 py-5 sm:px-6 sm:py-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse 55% 90% at 0% 0%, rgba(225,29,46,0.22), transparent 55%)",
            }}
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e11d2e]">
                {t("admin.commandCenter")}
              </p>
              <h1 className="mt-1 text-[clamp(1.55rem,4vw,2.1rem)] font-extrabold tracking-tight">
                {titles[section].title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-white/45">{titles[section].lead}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  router.refresh();
                  setLastRefresh(Date.now());
                }}
                className="inline-flex h-10 items-center rounded-xl border border-white/15 px-3.5 text-sm font-semibold text-white/75 hover:bg-white/5"
              >
                {t("admin.refresh")}
              </button>
              <button
                type="button"
                onClick={() => setAutoRefresh((v) => !v)}
                className="inline-flex h-10 items-center rounded-xl border px-3.5 text-sm font-semibold"
                style={
                  autoRefresh
                    ? { borderColor: "rgba(52,211,153,0.35)", background: "rgba(52,211,153,0.1)", color: "#6ee7b7" }
                    : { borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.65)" }
                }
              >
                {autoRefresh ? t("admin.autoOn") : t("admin.autoOff")}
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadText(`icash-orders-${new Date().toISOString().slice(0, 10)}.csv`, exportOrdersCsv(snapshot));
                  void notifySuccess(t("admin.exported"), t("admin.csvDownloaded"));
                }}
                className="inline-flex h-10 items-center rounded-xl border border-white/15 px-3.5 text-sm font-semibold text-white/75 hover:bg-white/5"
              >
                {t("admin.exportCsv")}
              </button>
              {stats.inbox > 0 && section !== "inbox" ? (
                <button
                  type="button"
                  onClick={() => setSection("inbox")}
                  className="inline-flex h-10 items-center rounded-xl bg-[#e11d2e] px-4 text-sm font-semibold"
                >
                  {t("admin.inInbox", { n: stats.inbox })}
                </button>
              ) : null}
            </div>
          </div>
          <p className="relative mt-3 text-[11px] text-white/30">
            {t("admin.lastRefresh", { when: formatWhen(new Date(lastRefresh).toISOString()) })}
            {autoRefresh ? t("admin.autoEvery") : ""}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <Kpi label={t("admin.kpiInbox")} value={String(stats.inbox)} hot={stats.inbox > 0} />
          <Kpi label={t("admin.kpiOpenValue")} value={formatBdt(stats.openValue)} />
          <Kpi label={t("admin.kpiThisMonth")} value={formatBdt(stats.thisMonth)} />
          <Kpi label={t("admin.kpiDeliveredMoney")} value={formatBdt(stats.revenue)} />
          <Kpi label={t("admin.kpiSuccess")} value={stats.orderCount ? `${stats.successRate}%` : "—"} />
          <Kpi label={t("admin.kpiAvgTicket")} value={formatBdt(stats.avgTicket)} />
        </div>
        <div className="grid grid-cols-2 border-t border-white/8 sm:grid-cols-3 lg:grid-cols-6">
          <Kpi label={t("admin.kpiAllOrders")} value={String(stats.orderCount)} compact />
          <Kpi label={t("admin.kpiPendingPay")} value={String(stats.pendingPay)} compact />
          <Kpi label={t("admin.kpiDelivered")} value={String(stats.delivered)} compact />
          <Kpi label={t("admin.kpiReadyCodes")} value={String(stats.ready)} compact />
          <Kpi label={t("admin.kpiHeldSold")} value={`${stats.held} / ${stats.sold}`} compact />
          <Kpi label={t("admin.kpiProofs")} value={String(stats.withProof)} compact />
        </div>
      </header>

      {/* OVERVIEW — everything visible */}
      {section === "overview" ? (
        <div className="mt-6 space-y-5">
          {/* Ops alerts */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-2xl border px-4 py-3.5"
                style={
                  alert.tone === "hot"
                    ? { borderColor: "rgba(248,113,113,0.35)", background: "rgba(127,29,29,0.25)" }
                    : alert.tone === "warn"
                      ? { borderColor: "rgba(251,191,36,0.3)", background: "rgba(120,53,15,0.22)" }
                      : { borderColor: "rgba(52,211,153,0.28)", background: "rgba(6,78,59,0.22)" }
                }
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{
                    color:
                      alert.tone === "hot" ? "#fca5a5" : alert.tone === "warn" ? "#fcd34d" : "#6ee7b7",
                  }}
                >
                  {alert.tone === "hot"
                    ? t("admin.urgent")
                    : alert.tone === "warn"
                      ? t("admin.attention")
                      : t("admin.healthy")}
                </p>
                <p className="mt-1 text-sm font-bold text-white">{alert.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{alert.body}</p>
              </div>
            ))}
          </div>

          {sells.some((sale) => sale.status === "OPEN") ? (
            <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e11d2e]">Sell</p>
              <h2 className="mt-1 text-lg font-bold text-white">Voucher sales waiting</h2>
              <ul className="mt-4 space-y-3">
                {sells
                  .filter((sale) => sale.status === "OPEN")
                  .map((sale) => (
                    <li key={sale.id} className="rounded-2xl border border-white/10 px-4 py-3">
                      <p className="text-sm font-semibold text-white">
                        {sale.number} · {sale.name} · {formatBdt(sale.payout)}
                      </p>
                      <p className="mt-1 text-xs text-white/45">
                        {sale.email} · {sale.phone} · {sale.method.toUpperCase()} {sale.payoutNumber}
                      </p>
                      <p className="mt-2 font-mono text-sm text-white">{sale.code}</p>
                      <button
                        type="button"
                        className="mt-3 h-9 rounded-full bg-white px-4 text-xs font-semibold text-black"
                        onClick={() =>
                          void post(`/api/admin/sells/${sale.id}/settle`, { status: "PAID" })
                            .then(() => {
                              notifySuccess("Sale marked paid");
                              router.refresh();
                            })
                            .catch((error: unknown) =>
                              notifyError(error instanceof Error ? error.message : "Could not update the sale"),
                            )
                        }
                      >
                        Mark paid
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}

          {/* Today board */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c]">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e11d2e]">
                  {t("admin.today")}
                </p>
                <h2 className="mt-0.5 text-lg font-bold">{t("admin.deskPulse")}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <QuickChip onClick={() => setSection("inbox")} label={t("admin.chipInbox")} hot={stats.inbox > 0} />
                <QuickChip onClick={() => setSection("payments")} label={t("admin.chipPayments")} />
                <QuickChip onClick={() => setSection("customers")} label={t("admin.chipCustomers")} />
                <QuickChip onClick={() => setSection("stock")} label={t("admin.chipUpload")} />
                <QuickChip onClick={() => setSection("reports")} label={t("admin.chipReports")} />
                <QuickChip onClick={() => setSection("settings")} label={t("admin.chipSettings")} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              <Kpi label={t("admin.ordersToday")} value={String(today.todayCount)} />
              <Kpi label={t("admin.yesterday")} value={String(today.yesterdayCount)} />
              <Kpi label={t("admin.revenueToday")} value={formatBdt(today.todayRevenue)} />
              <Kpi label={t("admin.revYesterday")} value={formatBdt(today.yesterdayRevenue)} />
              <Kpi
                label={t("admin.avgWait")}
                value={today.avgWaitMinutes != null ? `${today.avgWaitMinutes}m` : "—"}
                hot={(today.avgWaitMinutes ?? 0) >= 30}
              />
              <Kpi
                label={t("admin.repeatBuyers")}
                value={`${today.repeatBuyers}/${today.uniqueBuyers}`}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title={t("admin.statusMix")} eyebrow={t("admin.statistics")}>
              <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
                {stats.mix.map((m) =>
                  m.n > 0 ? (
                    <div
                      key={m.label}
                      style={{ width: `${(m.n / mixTotal) * 100}%`, background: m.color }}
                      title={`${m.label}: ${m.n}`}
                    />
                  ) : null,
                )}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-3">
                {stats.mix.map((m) => (
                  <li key={m.label} className="flex items-center justify-between gap-2 text-sm">
                    <span className="inline-flex items-center gap-2 text-white/60">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                      {m.label}
                    </span>
                    <span className="font-bold tabular-nums">{m.n}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title={t("admin.last6Months")} eyebrow={t("admin.revenueTrend")}>
              <div className="flex h-36 items-end gap-1.5 sm:gap-2">
                {stats.chart.map((row) => {
                  const h = Math.max(row.total > 0 ? 12 : 4, (row.total / stats.chartMax) * 100);
                  return (
                    <div key={row.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                      <p className="max-w-full truncate text-[9px] tabular-nums text-white/35">
                        {row.total > 0 ? formatBdt(row.total).replace("BDT ", "") : "—"}
                      </p>
                      <div className="relative flex w-full flex-1 items-end">
                        <div
                          className="mx-auto w-full max-w-[40px] rounded-t-md"
                          style={{
                            height: `${h}%`,
                            background:
                              row.total > 0
                                ? "linear-gradient(180deg, #ff5a67, #e11d2e 70%, #9f1239)"
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
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Payment methods" eyebrow="Channels" className="lg:col-span-1">
              {stats.methods.length === 0 ? (
                <p className="text-sm text-white/40">No payment methods logged yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {stats.methods.map((m) => (
                    <li key={m.name} className="flex items-center justify-between text-sm">
                      <span className="font-semibold uppercase tracking-wide text-white/75">
                        {m.name}
                      </span>
                      <span className="tabular-nums text-white/50">{m.n}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/8 pt-4 text-xs text-white/40">
                <p>
                  Void codes <span className="ml-1 font-bold text-white/70">{stats.voided}</span>
                </p>
                <p>
                  Failed/refund <span className="ml-1 font-bold text-white/70">{stats.failed}</span>
                </p>
              </div>
            </Panel>

            <Panel
              title="Inbox queue"
              eyebrow="Deposits"
              action={
                <button type="button" onClick={() => setSection("inbox")} className="text-xs font-semibold text-[#ff7a84]">
                  Open →
                </button>
              }
              className="lg:col-span-2"
            >
              {reviewing.length === 0 ? (
                <p className="text-sm text-white/40">Clear — no proofs waiting. New uploads land here first.</p>
              ) : (
                <ul className="space-y-2">
                  {reviewing.slice(0, 5).map((order) => {
                    const wait = waitMinutes(order.proofSubmittedAt ?? order.createdAt);
                    const repeats = repeatCount(snapshot, order.email);
                    return (
                      <li
                        key={order.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[0.04] px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {order.number} · {formatBdt(order.total)}
                            {repeats > 1 ? (
                              <span className="ml-2 text-[10px] font-semibold text-sky-300">
                                ×{repeats} buyer
                              </span>
                            ) : null}
                          </p>
                          <p className="truncate text-xs text-white/45">
                            {order.name ? `${order.name} · ` : ""}
                            {order.email} · {(order.paymentMethod ?? "pay").toUpperCase()} ·{" "}
                            {order.transactionId ?? "no TrxID"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusStyle("REVIEWING")}`}>
                            Review
                          </span>
                          <span
                            className="text-[10px] font-semibold"
                            style={{ color: (wait ?? 0) >= 30 ? "#fca5a5" : "#fcd34d" }}
                          >
                            {waitLabel(wait)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1.05fr]">
            <Panel
              title="Notes on hand"
              eyebrow="Stock"
              action={
                <button type="button" onClick={() => setSection("stock")} className="text-xs font-semibold text-[#ff7a84]">
                  Manage →
                </button>
              }
            >
              <ul className="space-y-3">
                {snapshot.products.map((product) => {
                  const total = Math.max(product.stock + product.reserved + product.sold, 1);
                  const pct = Math.round((product.stock / total) * 100);
                  return (
                    <li key={product.id}>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold tabular-nums">{formatBdt(product.faceValue)}</p>
                          <p className="text-[11px] text-white/40">{product.title}</p>
                        </div>
                        <p className="text-xs font-semibold text-emerald-300">{product.stock} ready</p>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-white/35">
                        {product.reserved} held · {product.sold} sold
                        {product.voided ? ` · ${product.voided} void` : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel
              title="Recent orders"
              eyebrow="Live"
              action={
                <button type="button" onClick={() => setSection("orders")} className="text-xs font-semibold text-[#ff7a84]">
                  All orders →
                </button>
              }
            >
              {recentOrders.length === 0 ? (
                <p className="text-sm text-white/40">No orders yet.</p>
              ) : (
                <ul className="divide-y divide-white/8">
                  {recentOrders.map((order) => (
                    <li key={order.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-[11px] text-white/40">{order.number}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${statusStyle(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold">
                          {order.title}
                          {order.faceValue != null ? ` · ${formatBdt(order.faceValue)}` : ""} ×{" "}
                          {order.quantity}
                          {repeatCount(snapshot, order.email) > 1 ? (
                            <span className="ml-2 text-[10px] font-semibold text-sky-300">
                              repeat
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-white/40">
                          {order.email}
                          {order.phone ? ` · ${order.phone}` : ""}
                          {order.transactionId ? ` · ${order.transactionId}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold tabular-nums">{formatBdt(order.total)}</p>
                        <p className="mt-0.5 text-[10px] text-white/35">{formatWhen(order.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel
            title="Latest activity"
            eyebrow="Logs"
            action={
              <button type="button" onClick={() => setSection("activity")} className="text-xs font-semibold text-[#ff7a84]">
                Full log →
              </button>
            }
          >
            <ActivityList rows={activity.slice(0, 10)} />
          </Panel>
        </div>
      ) : null}

      {section === "inbox" ? (
        <section className="mt-6 space-y-4">
          {unlockedCodes.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-emerald-400/25 bg-[#0d1510]">
              <div className="border-b border-emerald-400/20 px-5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                  Just unlocked — copy & deliver
                </p>
              </div>
              <div className="grid gap-2.5 p-4">
                {unlockedCodes.map((code) => (
                  <CodeRow key={code} code={code} />
                ))}
              </div>
            </div>
          ) : null}

          {reviewing.length === 0 ? (
            <Empty title="Inbox clear" body="No deposit proofs waiting. New proofs show up here first." />
          ) : (
            reviewing.map((order) => (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-amber-300/20 bg-[#0c0c0c]"
              >
                <div className="grid gap-0 lg:grid-cols-[minmax(240px,0.9fr)_1.1fr]">
                  {order.hasProof ? (
                    <a
                      href={`/api/admin/orders/${order.id}/proof`}
                      target="_blank"
                      rel="noreferrer"
                      className="relative block min-h-[200px] overflow-hidden bg-black lg:border-r lg:border-white/10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/admin/orders/${order.id}/proof`}
                        alt={`Payment proof for ${order.number}`}
                        className="mx-auto max-h-[360px] w-full object-contain"
                      />
                    </a>
                  ) : (
                    <div className="flex min-h-[180px] items-center justify-center border-b border-white/10 text-sm text-white/35 lg:border-b-0 lg:border-r">
                      No screenshot
                    </div>
                  )}
                  <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-[11px] text-white/45">{order.number}</p>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${statusStyle("REVIEWING")}`}>
                          Review
                        </span>
                        {repeatCount(snapshot, order.email) > 1 ? (
                          <span className="rounded-full border border-sky-300/30 bg-sky-300/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-sky-200">
                            Repeat ×{repeatCount(snapshot, order.email)}
                          </span>
                        ) : (
                          <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-white/45">
                            New buyer
                          </span>
                        )}
                        <span
                          className="rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase"
                          style={
                            (waitMinutes(order.proofSubmittedAt ?? order.createdAt) ?? 0) >= 30
                              ? { borderColor: "rgba(248,113,113,0.4)", background: "rgba(127,29,29,0.35)", color: "#fecaca" }
                              : { borderColor: "rgba(251,191,36,0.35)", background: "rgba(120,53,15,0.3)", color: "#fde68a" }
                          }
                        >
                          {waitLabel(waitMinutes(order.proofSubmittedAt ?? order.createdAt))}
                        </span>
                      </div>
                      <p className="mt-2 text-3xl font-extrabold tabular-nums">{formatBdt(order.total)}</p>
                      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                        <Field label="Customer" value={order.email} />
                        <Field label="Phone" value={order.phone || "—"} />
                        <Field label="Note" value={`${order.title} × ${order.quantity}`} />
                        <Field label="Face" value={order.faceValue != null ? formatBdt(order.faceValue) : "—"} />
                        <Field label="Method" value={(order.paymentMethod ?? "—").toUpperCase()} />
                        <Field label="TrxID" value={order.transactionId || "—"} mono />
                        <Field label="Pay ref" value={order.paymentRef || "—"} mono />
                        <Field label="Created" value={formatWhen(order.createdAt)} />
                        <Field
                          label="Proof at"
                          value={order.proofSubmittedAt ? formatWhen(order.proofSubmittedAt) : "—"}
                        />
                        <Field
                          label="SLA wait"
                          value={waitLabel(waitMinutes(order.proofSubmittedAt ?? order.createdAt))}
                        />
                      </dl>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <ActionButton
                        primary
                        disabled={pending}
                        onClick={() =>
                          run(async () => {
                            const data = await post(`/api/admin/orders/${order.id}/approve`);
                            if (data.codes?.length) setUnlockedCodes(data.codes);
                            return data.message ?? "Approved. Code unlocked.";
                          })
                        }
                      >
                        {t("admin.approveShow")}
                      </ActionButton>
                      {order.hasProof ? (
                        <a
                          href={`/api/admin/orders/${order.id}/proof`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-11 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/80 hover:bg-white/5"
                        >
                          {t("admin.openImage")}
                        </a>
                      ) : null}
                      <ActionButton
                        disabled={pending}
                        onClick={() =>
                          run(async () => {
                            await post(`/api/admin/orders/${order.id}/release`);
                            return "Hold released";
                          })
                        }
                      >
                        {t("admin.reject")}
                      </ActionButton>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      ) : null}

      {section === "stock" ? (
        <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_0.95fr]">
          <Panel title="Notes on hand" eyebrow="Inventory">
            <ul className="divide-y divide-white/8">
              {snapshot.products.map((product) => {
                const total = Math.max(product.stock + product.reserved + product.sold, 1);
                const readyPct = Math.round((product.stock / total) * 100);
                return (
                  <li key={product.id} className="py-4 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-2xl font-extrabold tabular-nums">{formatBdt(product.faceValue)}</p>
                        <p className="mt-0.5 text-xs text-white/40">{product.title}</p>
                        <p className="mt-1 text-[11px] text-white/35">{product.blurb}</p>
                      </div>
                      <p className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 font-mono text-[11px] text-emerald-200">
                        {product.stock} ready
                      </p>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${readyPct}%` }} />
                    </div>
                    <p className="mt-2 font-mono text-[11px] text-white/40">
                      {product.reserved} held · {product.sold} sold
                      {product.voided ? ` · ${product.voided} void` : ""} · slug {product.slug}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Add codes" eyebrow="Upload">
            <p className="text-sm text-white/45">One code per line. Encrypted at rest before save.</p>
            <label className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40" htmlFor="product">
              Note
            </label>
            <select
              id="product"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-white/12 bg-black px-3 text-sm outline-none focus:border-[#e11d2e]/50"
            >
              {snapshot.products.map((product) => (
                <option key={product.id} value={product.slug}>
                  {product.title} · {product.stock} ready
                </option>
              ))}
            </select>
            <label className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40" htmlFor="codes">
              Codes
            </label>
            <textarea
              id="codes"
              value={csv}
              onChange={(event) => setCsv(event.target.value)}
              rows={8}
              className="mt-2 w-full rounded-xl border border-white/12 bg-black/60 p-3 font-mono text-xs outline-none focus:border-[#e11d2e]/50"
              placeholder={"ICASH-1000-ABCD\nICASH-1000-EFGH"}
            />
            <button
              type="button"
              disabled={pending || !slug || !csv.trim()}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#e11d2e] text-sm font-semibold disabled:opacity-40"
              onClick={() =>
                run(async () => {
                  const data = await post("/api/admin/codes", { productSlug: slug, csv });
                  setCsv("");
                  return `${data.added ?? 0} codes added`;
                })
              }
            >
              Add to stock
            </button>
          </Panel>
        </section>
      ) : null}

      {section === "orders" ? (
        <section className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0c0c0c] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search number, email, phone, TrxID, pay ref…"
              className="h-11 w-full rounded-xl border border-white/12 bg-black/50 px-3 text-sm outline-none focus:border-[#e11d2e]/50 sm:max-w-md"
            />
            <div className="flex gap-1.5 overflow-x-auto">
              {(
                [
                  ["all", "All"],
                  ["PENDING", "Pending"],
                  ["REVIEWING", "Review"],
                  ["DELIVERED", "Delivered"],
                  ["FAILED", "Failed"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setOrderFilter(id)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={
                    orderFilter === id
                      ? { background: "#fff", color: "#09090b" }
                      : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c]">
            {filteredOrders.length === 0 ? (
              <Empty title="No orders match" body="Try another filter or clear the search." />
            ) : (
              <ul className="divide-y divide-white/8">
                {filteredOrders.map((order) => {
                  const revealed = revealedByOrder[order.id] ?? [];
                  return (
                    <li
                      key={order.id}
                      className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-[11px] text-white/45">{order.number}</p>
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${statusStyle(order.status)}`}>
                            {order.status}
                          </span>
                          {order.hasProof ? (
                            <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/50">
                              Proof
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1.5 text-2xl font-extrabold tabular-nums">{formatBdt(order.total)}</p>
                        <dl className="mt-3 grid gap-1.5 text-xs text-white/55 sm:grid-cols-2">
                          <Field label="Email" value={order.email} />
                          <Field label="Phone" value={order.phone || "—"} />
                          <Field label="Note" value={`${order.title} × ${order.quantity}`} />
                          <Field label="Face" value={order.faceValue != null ? formatBdt(order.faceValue) : "—"} />
                          <Field label="Method" value={(order.paymentMethod ?? "—").toUpperCase()} />
                          <Field label="TrxID" value={order.transactionId || "—"} mono />
                          <Field label="Pay ref" value={order.paymentRef || "—"} mono />
                          <Field label="Created" value={formatWhen(order.createdAt)} />
                          <Field label="Paid" value={order.paidAt ? formatWhen(order.paidAt) : "—"} />
                          <Field
                            label="Delivered"
                            value={order.deliveredAt ? formatWhen(order.deliveredAt) : "—"}
                          />
                        </dl>
                        {revealed.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            {revealed.map((code) => (
                              <CodeRow key={code} code={code} compact />
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
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
                        {order.hasCodes ? (
                          <ActionButton
                            disabled={pending}
                            onClick={() =>
                              run(async () => {
                                const data = await post(`/api/admin/orders/${order.id}/reveal`);
                                if (data.codes?.length) {
                                  setRevealedByOrder((prev) => ({ ...prev, [order.id]: data.codes! }));
                                }
                                return "Codes revealed for this session.";
                              })
                            }
                          >
                            Reveal
                          </ActionButton>
                        ) : null}
                        {order.status === "PENDING" ? (
                          <ActionButton
                            disabled={pending}
                            onClick={() =>
                              run(async () => {
                                await post(`/api/admin/orders/${order.id}/release`);
                                return "Hold released";
                              })
                            }
                          >
                            Release
                          </ActionButton>
                        ) : null}
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
                        {order.status === "DELIVERED" ? (
                          <ActionButton
                            disabled={pending}
                            onClick={() =>
                              run(async () => {
                                const data = await post(`/api/admin/orders/${order.id}/resend`);
                                return data.message ?? "Sent";
                              })
                            }
                          >
                            Email
                          </ActionButton>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {section === "activity" ? (
        <section className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-4 sm:px-5">
            <input
              value={activityQuery}
              onChange={(event) => setActivityQuery(event.target.value)}
              placeholder="Search activity, actor, order id…"
              className="h-11 w-full rounded-xl border border-white/12 bg-black/50 px-3 text-sm outline-none focus:border-[#e11d2e]/50 sm:max-w-md"
            />
            <p className="mt-2 text-xs text-white/40">
              {activity.length} events · owner audit + order timeline
            </p>
          </div>
          <Panel title="Full desk log" eyebrow="Activity">
            {activity.length === 0 ? (
              <Empty title="No activity yet" body="Orders and owner actions will fill this feed." />
            ) : (
              <ActivityList rows={activity} />
            )}
          </Panel>
        </section>
      ) : null}

      {section === "customers" ? (
        <section className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-4 sm:px-5">
            <input
              value={customerQuery}
              onChange={(event) => setCustomerQuery(event.target.value)}
              placeholder="Search email or phone…"
              className="h-11 w-full rounded-xl border border-white/12 bg-black/50 px-3 text-sm outline-none focus:border-[#e11d2e]/50 sm:max-w-md"
            />
            <p className="mt-2 text-xs text-white/40">
              {customers.length} buyers · sorted by lifetime spend
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c]">
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
                    <div className="grid grid-cols-3 gap-4 text-right text-xs sm:min-w-[220px]">
                      <div>
                        <p className="text-white/35">Orders</p>
                        <p className="mt-0.5 font-bold tabular-nums text-white">{row.orders}</p>
                      </div>
                      <div>
                        <p className="text-white/35">Delivered</p>
                        <p className="mt-0.5 font-bold tabular-nums text-white">{row.delivered}</p>
                      </div>
                      <div>
                        <p className="text-white/35">Spent</p>
                        <p className="mt-0.5 font-bold tabular-nums text-white">{formatBdt(row.spent)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {section === "payments" ? (
        <section className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Payment rows" value={String(paymentRows.length)} />
            <MiniStat
              label="With TrxID"
              value={String(paymentRows.filter((o) => o.transactionId).length)}
            />
            <MiniStat label="With proof" value={String(paymentRows.filter((o) => o.hasProof).length)} />
            <MiniStat label="Pending deposit" value={String(stats.pendingPay)} hot={stats.pendingPay > 0} />
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c]">
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
                        <ActionButton primary onClick={() => setSection("inbox")}>
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

      {section === "refunds" ? (
        <section className="mt-6 space-y-4">
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
            <MiniStat label="Void codes" value={String(stats.voided)} />
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c]">
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

      {section === "reports" ? (
        <section className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Lifetime $" value={formatBdt(stats.revenue)} />
            <MiniStat label="This month" value={formatBdt(stats.thisMonth)} />
            <MiniStat label="Success rate" value={stats.orderCount ? `${stats.successRate}%` : "—"} />
            <MiniStat label="Avg ticket" value={formatBdt(stats.avgTicket)} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Status mix" eyebrow="Pipeline">
              <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
                {stats.mix.map((m) =>
                  m.n > 0 ? (
                    <div
                      key={m.label}
                      style={{ width: `${(m.n / mixTotal) * 100}%`, background: m.color }}
                    />
                  ) : null,
                )}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-3">
                {stats.mix.map((m) => (
                  <li key={m.label} className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 text-white/60">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                      {m.label}
                    </span>
                    <span className="font-bold tabular-nums">{m.n}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Last 6 months" eyebrow="Revenue">
              <div className="flex h-40 items-end gap-2">
                {stats.chart.map((row) => {
                  const h = Math.max(row.total > 0 ? 12 : 4, (row.total / stats.chartMax) * 100);
                  return (
                    <div key={row.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                      <p className="max-w-full truncate text-[9px] tabular-nums text-white/35">
                        {row.total > 0 ? formatBdt(row.total).replace("BDT ", "") : "—"}
                      </p>
                      <div className="relative flex w-full flex-1 items-end">
                        <div
                          className="mx-auto w-full max-w-[44px] rounded-t-md"
                          style={{
                            height: `${h}%`,
                            background:
                              row.total > 0
                                ? "linear-gradient(180deg, #ff5a67, #e11d2e 70%, #9f1239)"
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
            <Panel title="Payment channels" eyebrow="Methods">
              {stats.methods.length === 0 ? (
                <p className="text-sm text-white/40">No methods logged yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {stats.methods.map((m) => (
                    <li key={m.name} className="flex items-center justify-between text-sm">
                      <span className="font-semibold uppercase tracking-wide text-white/75">{m.name}</span>
                      <span className="tabular-nums text-white/50">{m.n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Stock health" eyebrow="Inventory">
              <ul className="space-y-3">
                {snapshot.products.map((product) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>
                      <span className="font-bold tabular-nums">{formatBdt(product.faceValue)}</span>
                      <span className="ml-2 text-white/40">{product.title}</span>
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: product.stock <= 2 ? "#fca5a5" : "#6ee7b7" }}
                    >
                      {product.stock} ready
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/8 pt-4 text-xs text-white/45">
                <p>
                  Held <span className="font-bold text-white/80">{stats.held}</span>
                </p>
                <p>
                  Sold <span className="font-bold text-white/80">{stats.sold}</span>
                </p>
                <p>
                  Void <span className="font-bold text-white/80">{stats.voided}</span>
                </p>
              </div>
            </Panel>
          </div>
        </section>
      ) : null}

      {section === "settings" ? (
        <section className="mt-6 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Runtime mode" eyebrow="Environment">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/45">Payment mode</dt>
                  <dd>
                    <span
                      className="rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase"
                      style={
                        desk.paymentMode === "live"
                          ? { borderColor: "rgba(52,211,153,0.35)", background: "rgba(6,78,59,0.35)", color: "#6ee7b7" }
                          : { borderColor: "rgba(251,191,36,0.35)", background: "rgba(120,53,15,0.3)", color: "#fde68a" }
                      }
                    >
                      {desk.paymentMode}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/45">Desk fee</dt>
                  <dd className="font-bold tabular-nums">{desk.feePercent}%</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-white/45">Site URL</dt>
                  <dd className="max-w-[60%] break-all text-right font-mono text-xs text-white/70">
                    {desk.siteUrl || "Not set"}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-white/40">
                Change these from Vercel / server env (`PAYMENT_MODE`, `NEXT_PUBLIC_SITE_URL`, fee is code-locked).
              </p>
            </Panel>

            <Panel title="Quick links" eyebrow="Desk">
              <div className="grid gap-2">
                <a
                  href="/"
                  className="rounded-xl border border-white/12 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5"
                >
                  Open storefront →
                </a>
                <button
                  type="button"
                  onClick={() => setSection("stock")}
                  className="rounded-xl border border-white/12 px-4 py-3 text-left text-sm font-semibold text-white/80 transition hover:bg-white/5"
                >
                  Upload voucher codes →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadText(
                      `icash-orders-${new Date().toISOString().slice(0, 10)}.csv`,
                      exportOrdersCsv(snapshot),
                    );
                    void notifySuccess("Exported", "Orders CSV downloaded.");
                  }}
                  className="rounded-xl border border-white/12 px-4 py-3 text-left text-sm font-semibold text-white/80 transition hover:bg-white/5"
                >
                  Export orders CSV →
                </button>
              </div>
            </Panel>
          </div>

          <Panel title="Deposit accounts" eyebrow="Receiving numbers">
            <div className="grid gap-3 sm:grid-cols-2">
              {desk.deposits.map((account) => (
                <article
                  key={account.id}
                  className="rounded-xl border border-white/10 bg-black/35 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{account.label}</p>
                    <p className="text-[11px] text-white/40">{account.hint}</p>
                  </div>
                  <p className="mt-3 font-mono text-lg font-bold tracking-wide text-white">
                    {account.number}
                  </p>
                  <p className="mt-1 text-xs text-white/50">{account.name}</p>
                  {account.note ? (
                    <p className="mt-2 text-[11px] leading-relaxed text-white/35">{account.note}</p>
                  ) : null}
                </article>
              ))}
            </div>
            <p className="mt-4 text-xs text-white/40">
              Edit via `DEPOSIT_BKASH`, `DEPOSIT_NAGAD`, `DEPOSIT_ROCKET`, `DEPOSIT_BANK_*` env vars.
            </p>
          </Panel>
        </section>
      ) : null}
    </AdminShell>
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
    <div
      className={`border-t border-white/8 px-4 sm:border-t-0 sm:border-l sm:border-white/8 sm:first:border-l-0 sm:px-5 ${
        compact ? "py-3" : "py-3.5"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p
        className={`mt-1 font-extrabold tabular-nums tracking-tight ${
          compact ? "text-base sm:text-lg" : "text-xl sm:text-2xl"
        } ${hot ? "text-[#ff5a67]" : "text-white"}`}
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
    <section className={`overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c] ${className}`}>
      <div className="flex items-end justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{eyebrow}</p>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">{label}</dt>
      <dd className={`mt-0.5 break-all text-white/80 ${mono ? "font-mono text-[11px]" : "text-sm"}`}>
        {value}
      </dd>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        primary
          ? "inline-flex h-11 items-center justify-center rounded-xl bg-[#e11d2e] px-4 text-sm font-semibold text-white hover:bg-[#c41828] disabled:opacity-40"
          : "inline-flex h-11 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-semibold text-white/80 hover:bg-white/5 disabled:opacity-40"
      }
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
          ? { background: "#e11d2e", color: "#fff" }
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
    <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className={`mt-1 text-xl font-extrabold tabular-nums ${hot ? "text-[#ff5a67]" : "text-white"}`}>
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
