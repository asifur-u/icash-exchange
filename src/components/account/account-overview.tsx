"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AccountLoyaltyStage } from "@/components/account/account-loyalty-stage";
import { AccountSpendChart } from "@/components/account/account-spend-chart";
import { ContinueBuy } from "@/components/continue-buy";
import { statusTone, type AccountOrder } from "@/components/account/account-types";
import { useT } from "@/i18n/provider";
import { deskPayTotal } from "@/lib/desk-fee";
import { formatBdt, formatWhen } from "@/lib/format";
import { MONTHLY_GIFT, estimatedBonusBdt, tierProgress } from "@/lib/rewards";
import type { PublicUser } from "@/lib/users";

type DeskNote = {
  id: string;
  slug: string;
  title: string;
  faceValue: number;
  price: number;
  stock: number;
};

const NOTE_TINTS = ["#e11d2e", "#ea580c", "#ca8a04", "#0284c7", "#059669", "#db2777"];

function orderActionHref(order: AccountOrder) {
  if (order.status === "PENDING") {
    return `/account/pay/${order.id}?t=${order.token}`;
  }
  return `/account/orders/${order.id}?t=${order.token}`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function AccountOverview({
  user,
  orders,
  products,
}: {
  user: PublicUser;
  orders: AccountOrder[];
  products: DeskNote[];
}) {
  const t = useT();
  const firstName = user.name.split(" ")[0] || user.name;

  const unfinished = useMemo(
    () => orders.filter((o) => o.status === "PENDING" || o.status === "REVIEWING"),
    [orders],
  );

  const stats = useMemo(() => {
    const delivered = orders.filter((o) => o.status === "DELIVERED");
    const reviewing = orders.filter((o) => o.status === "REVIEWING");
    const pending = orders.filter((o) => o.status === "PENDING");
    const spent = orders.reduce((sum, o) => sum + o.total, 0);
    const openBalance = unfinished.reduce((sum, o) => sum + o.total, 0);
    const deliveredValue = delivered.reduce((sum, o) => sum + o.total, 0);
    const progress = tierProgress(spent);
    const bonus = estimatedBonusBdt(spent);
    const now = new Date();
    const thisKey = monthKey(now);
    const thisMonth = orders
      .filter((o) => monthKey(new Date(o.createdAt)) === thisKey)
      .reduce((sum, o) => sum + o.total, 0);
    const closed = orders.filter(
      (o) => o.status === "DELIVERED" || o.status === "FAILED" || o.status === "REFUNDED",
    ).length;
    const successRate = closed > 0 ? Math.round((delivered.length / closed) * 100) : 0;
    const avgTicket =
      delivered.length > 0 ? Math.round(deliveredValue / delivered.length) : 0;

    return {
      open: unfinished.length,
      delivered: delivered.length,
      reviewing: reviewing.length,
      pending: pending.length,
      spent,
      openBalance,
      deliveredValue,
      total: orders.length,
      thisMonth,
      successRate,
      avgTicket,
      progress,
      bonus,
      mix: [
        { label: t("account.pendingPay"), n: pending.length, color: "#71717a" },
        { label: t("account.inReview"), n: reviewing.length, color: "#ea580c" },
        { label: t("account.delivered"), n: delivered.length, color: "#059669" },
      ],
    };
  }, [orders, unfinished, t]);

  const offers = useMemo(() => {
    const { current, next, remaining } = stats.progress;
    return [
      {
        title: current ? `${current.name} desk` : t("account.startClimbing"),
        body: current
          ? t("account.loyaltyRate", { pct: current.bonusPercent })
          : t("account.startClimbingBody"),
        href: "/account#loyalty",
        cta: t("account.seeLadder"),
        tint: "#52525b",
      },
      {
        title: next ? t("account.nextSilver", { name: next.name }) : MONTHLY_GIFT.title,
        body: next
          ? t("account.nextBody", { amount: formatBdt(remaining), pct: next.bonusPercent })
          : t("account.diamondGiftBody"),
        href: "/account/services",
        cta: t("account.buyNotes"),
        tint: "#ca8a04",
      },
      {
        title: t("account.feeTitle"),
        body: t("account.feeBody"),
        href: "/account/services",
        cta: t("account.buyNotes"),
        tint: "#e11d2e",
      },
    ];
  }, [stats.progress, t]);

  const buyNotes = products.filter((p) => p.stock > 0).slice(0, 6);
  const recent = orders.slice(0, 6);
  const mixTotal = Math.max(1, stats.mix.reduce((s, m) => s + m.n, 0));

  return (
    <div className="space-y-5 sm:space-y-6" style={{ color: "#09090b" }}>
      {/* Hero + primary stats */}
      <header className="al-card overflow-hidden">
        <div className="relative overflow-hidden bg-[#0a0a0a] px-5 py-6 sm:px-7 sm:py-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse 70% 80% at 10% 0%, rgba(225,29,46,0.4), transparent 55%), radial-gradient(ellipse 50% 60% at 95% 40%, rgba(255,255,255,0.08), transparent 50%)",
            }}
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e11d2e]" aria-hidden />
                {t("account.dashboard")}
              </p>
              <h1 className="mt-3 text-[clamp(1.9rem,5vw,2.75rem)] font-extrabold tracking-tight text-white">
                {(() => {
                  const [before = "", after = ""] = t("account.hi", { name: "\u0001" }).split(
                    "\u0001",
                  );
                  return (
                    <>
                      {before}
                      <span className="text-[#ff5a67]">{firstName}</span>
                      {after}
                    </>
                  );
                })()}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
                {t("account.portalLead")}
              </p>
            </div>
            <div className="relative flex shrink-0 flex-wrap gap-2">
              <Link
                href="/account/services"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#e11d2e] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(225,29,46,0.35)] transition hover:bg-[#c41828]"
              >
                {t("account.buyANote")}
              </Link>
              <Link
                href="/account/orders"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {t("account.viewOrders")}
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-b p-4 sm:grid-cols-2 sm:gap-4 sm:p-6 lg:grid-cols-4" style={{ borderColor: "#e4e4e7", background: "#fafafa" }}>
          {[
            {
              label: t("account.openBalance"),
              value: formatBdt(stats.openBalance),
              hint:
                stats.open === 0
                  ? t("account.noDeposits")
                  : stats.open === 1
                    ? t("account.ordersInFlight", { n: stats.open })
                    : t("account.ordersInFlightPlural", { n: stats.open }),
              color: "#0284c7",
            },
            {
              label: t("account.lifetimeSpent"),
              value: formatBdt(stats.spent),
              hint: `${t("account.estLoyalty", { amount: formatBdt(stats.bonus) })} · ${
                stats.progress.current ? stats.progress.current.name : t("account.belowSilver")
              }`,
              color: "#ca8a04",
            },
            {
              label: t("account.thisMonth"),
              value: formatBdt(stats.thisMonth),
              hint: t("account.last6"),
              color: "#e11d2e",
            },
            {
              label: t("account.successRate"),
              value: stats.total === 0 ? "—" : `${stats.successRate}%`,
              hint: t("account.avgTicket") + ` · ${formatBdt(stats.avgTicket)}`,
              color: "#059669",
            },
          ].map((card) => (
            <div key={card.label} className="al-stat">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: card.color }}
              >
                {card.label}
              </p>
              <p className="al-ink mt-2 text-[clamp(1.35rem,3.5vw,1.85rem)] font-bold tabular-nums">
                {card.value}
              </p>
              <p className="al-muted mt-1.5 line-clamp-2 text-xs">{card.hint}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-4 sm:gap-3 sm:px-6 sm:pb-6 sm:pt-0">
          {[
            [t("account.transactions"), String(stats.total), false],
            [t("account.delivered"), String(stats.delivered), false],
            [t("account.pendingPay"), String(stats.pending), stats.pending > 0],
            [t("account.inReview"), String(stats.reviewing), stats.reviewing > 0],
          ].map(([label, value, warn]) => (
            <div
              key={String(label)}
              className="al-stat"
              style={
                warn
                  ? { borderColor: "#fed7aa", background: "#fff7ed" }
                  : undefined
              }
            >
              <p className="al-faint text-[10px] font-semibold uppercase tracking-[0.12em]">
                {label}
              </p>
              <p className="al-ink mt-1 text-lg font-bold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </header>

      <ContinueBuy />

      {/* Statistics deep dive */}
      <section className="al-card overflow-hidden">
        <div className="border-b px-5 py-4 sm:px-6" style={{ borderColor: "#e4e4e7" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e11d2e]">
            {t("account.statsEyebrow")}
          </p>
          <h2 className="al-ink mt-1 text-lg font-bold sm:text-xl">{t("account.statsTitle")}</h2>
          <p className="al-muted mt-0.5 text-xs sm:text-sm">{t("account.statsLead")}</p>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{ border: "1px solid #e4e4e7", background: "#fafafa" }}
          >
            <p className="al-faint text-[11px] font-semibold uppercase tracking-[0.12em]">
              {t("account.statusMix")}
            </p>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-zinc-200">
              {stats.mix.map((m) =>
                m.n > 0 ? (
                  <div
                    key={m.label}
                    style={{
                      width: `${(m.n / mixTotal) * 100}%`,
                      background: m.color,
                    }}
                    title={`${m.label}: ${m.n}`}
                  />
                ) : null,
              )}
            </div>
            <ul className="mt-4 space-y-2.5">
              {stats.mix.map((m) => (
                <li key={m.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-zinc-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: m.color }}
                      aria-hidden
                    />
                    {m.label}
                  </span>
                  <span className="font-bold tabular-nums text-zinc-900">{m.n}</span>
                </li>
              ))}
            </ul>
          </div>
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{ border: "1px solid #e4e4e7", background: "#fff" }}
          >
            <p className="al-faint text-[11px] font-semibold uppercase tracking-[0.12em]">
              {t("account.codesPaid")}
            </p>
            <p className="mt-3 text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold tabular-nums text-zinc-900">
              {formatBdt(stats.deliveredValue)}
            </p>
            <p className="al-muted mt-2 text-sm leading-relaxed">
              {t("account.delivered")} {stats.delivered} · {t("account.avgTicket")}{" "}
              {formatBdt(stats.avgTicket)}
            </p>
            <Link
              href="/account/activity"
              className="mt-4 inline-flex text-sm font-semibold text-[#e11d2e] hover:underline"
            >
              {t("account.activity")} →
            </Link>
          </div>
        </div>
      </section>

      {/* Unfinished */}
      <section
        className="al-card overflow-hidden"
        style={
          unfinished.length > 0
            ? { borderColor: "#fdba74", boxShadow: "0 12px 36px rgba(234, 88, 12, 0.08)" }
            : undefined
        }
      >
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6"
          style={{
            borderColor: unfinished.length > 0 ? "#ffedd5" : "#e4e4e7",
            background: unfinished.length > 0 ? "#fff7ed" : "#fff",
          }}
        >
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: unfinished.length > 0 ? "#c2410c" : "#71717a" }}
            >
              {t("account.unfinishedTitle")}
              {unfinished.length > 0 ? ` · ${unfinished.length}` : ""}
            </p>
            <p className="al-muted mt-0.5 text-xs sm:text-sm">{t("account.unfinishedLead")}</p>
          </div>
          {unfinished.length > 0 ? (
            <Link href="/account/orders" className="text-sm font-semibold text-[#c2410c] hover:underline">
              {t("account.viewOrders")} →
            </Link>
          ) : null}
        </div>

        {unfinished.length === 0 ? (
          <div className="px-5 py-6 sm:px-6">
            <p className="text-sm text-zinc-500">{t("account.unfinishedEmpty")}</p>
            <Link href="/account/services" className="al-btn al-btn-primary mt-4 inline-flex">
              {t("account.buyANote")}
            </Link>
          </div>
        ) : (
          <ul>
            {unfinished.map((order) => {
              const pending = order.status === "PENDING";
              return (
                <li key={order.id} style={{ borderTop: "1px solid #ffedd5" }}>
                  <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-zinc-900">{order.title}</p>
                        <span
                          className={`inline-flex h-6 items-center rounded-full border px-2 text-[9px] font-semibold uppercase tracking-[0.12em] ${statusTone(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {order.number} · {formatBdt(order.total)} · {formatWhen(order.createdAt)}
                      </p>
                    </div>
                    <Link
                      href={orderActionHref(order)}
                      className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white"
                      style={{ background: pending ? "#e11d2e" : "#ea580c" }}
                    >
                      {pending ? t("account.finishNow") : t("account.viewOrder")}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Quick buy */}
      <section id="buy" className="al-card scroll-mt-24 overflow-hidden">
        <div
          className="flex flex-wrap items-end justify-between gap-3 border-b px-5 py-4 sm:px-6"
          style={{ borderColor: "#e4e4e7" }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e11d2e]">
              {t("account.quickBuy")}
            </p>
            <h2 className="al-ink mt-1 text-lg font-bold sm:text-xl">{t("account.buyHere")}</h2>
            <p className="al-muted mt-0.5 text-xs sm:text-sm">{t("account.buyHereLead")}</p>
          </div>
          <Link href="/account/services" className="al-accent text-sm font-semibold hover:underline">
            {t("account.allNotes")}
          </Link>
        </div>
        {buyNotes.length === 0 ? (
          <div className="px-5 py-10 text-center sm:px-6">
            <p className="al-muted text-sm">{t("account.noStock")}</p>
          </div>
        ) : (
          <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
            {buyNotes.map((note, index) => {
              const pay = deskPayTotal(note.price);
              const tint = NOTE_TINTS[index % NOTE_TINTS.length];
              return (
                <Link
                  key={note.id}
                  href={`/account/checkout?product=${note.slug}&qty=1`}
                  className="rounded-2xl border p-5 transition hover:shadow-md"
                  style={{ borderColor: "#e4e4e7", background: "#fafafa", color: "#09090b" }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: tint }}
                  >
                    {t("account.ready", { n: note.stock })}
                  </p>
                  <p className="mt-2 text-2xl font-bold tabular-nums" style={{ color: "#09090b" }}>
                    {formatBdt(note.faceValue)}
                  </p>
                  <p className="al-muted mt-1 text-xs">
                    {t("account.payIncl", { amount: formatBdt(pay) })}
                  </p>
                  <span
                    className="mt-4 inline-flex h-9 items-center rounded-xl px-4 text-xs font-bold"
                    style={{ background: tint, color: "#fff" }}
                  >
                    {t("nav.buy")}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <AccountLoyaltyStage spent={stats.spent} progress={stats.progress} />
      <AccountSpendChart orders={orders} />

      <section>
        <div className="mb-3 px-0.5">
          <h2 className="al-ink text-lg font-bold sm:text-xl">{t("account.offers")}</h2>
          <p className="al-muted mt-0.5 text-xs">{t("account.offersLead")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <Link
              key={offer.title}
              href={offer.href}
              className="al-card block p-4 transition hover:shadow-md sm:p-5"
              style={{ borderTopWidth: 3, borderTopColor: offer.tint }}
            >
              <p className="al-ink text-sm font-bold">{offer.title}</p>
              <p className="al-muted mt-2 text-sm leading-relaxed">{offer.body}</p>
              <p className="mt-3 text-sm font-semibold" style={{ color: "#e11d2e" }}>
                {offer.cta} →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="al-card overflow-hidden">
        <div
          className="flex items-center justify-between gap-3 border-b px-5 py-4 sm:px-6"
          style={{ borderColor: "#e4e4e7" }}
        >
          <div>
            <h2 className="al-ink text-lg font-bold">{t("account.transactions")}</h2>
            <p className="al-muted mt-0.5 text-xs">{t("account.latestOrders")}</p>
          </div>
          <Link href="/account/orders" className="al-muted text-sm font-semibold hover:underline">
            {t("common.seeAll")}
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <p className="al-ink text-lg font-bold">{t("account.nothingYet")}</p>
            <p className="al-muted mx-auto mt-2 max-w-sm text-sm">{t("account.nothingLead")}</p>
            <Link href="/account/services" className="al-btn al-btn-primary mt-6">
              {t("account.startBuying")}
            </Link>
          </div>
        ) : (
          <ul>
            {recent.map((order) => (
              <li key={order.id} style={{ borderTop: "1px solid #f4f4f5" }}>
                <Link
                  href={`/account/orders/${order.id}?t=${order.token}`}
                  className="flex items-center gap-3 px-5 py-4 transition hover:bg-[#fafafa] sm:px-6"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-bold"
                    style={{ background: "#f4f4f5", color: "#3f3f46" }}
                  >
                    {order.title.replace(/[^0-9]/g, "").slice(0, 3) || "N"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="al-ink truncate text-sm font-bold">{order.title}</p>
                      <p className="al-ink shrink-0 text-sm font-bold tabular-nums">
                        {formatBdt(order.total)}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="al-faint text-xs">
                        {order.number} · {formatWhen(order.createdAt)}
                      </p>
                      <span
                        className={`inline-flex h-6 items-center rounded-full border px-2 text-[9px] font-semibold uppercase tracking-[0.12em] ${statusTone(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
