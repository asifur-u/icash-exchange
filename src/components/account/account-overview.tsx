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
import {
  MONTHLY_GIFT,
  estimatedBonusBdt,
  tierProgress,
} from "@/lib/rewards";
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

  const stats = useMemo(() => {
    const openOrders = orders.filter((o) => o.status === "PENDING" || o.status === "REVIEWING");
    const delivered = orders.filter((o) => o.status === "DELIVERED");
    const spent = orders.reduce((sum, o) => sum + o.total, 0);
    const openBalance = openOrders.reduce((sum, o) => sum + o.total, 0);
    const deliveredValue = delivered.reduce((sum, o) => sum + o.total, 0);
    const progress = tierProgress(spent);
    const bonus = estimatedBonusBdt(spent);
    return {
      open: openOrders.length,
      delivered: delivered.length,
      spent,
      openBalance,
      deliveredValue,
      total: orders.length,
      progress,
      bonus,
    };
  }, [orders]);

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
        title: next
          ? t("account.nextSilver", { name: next.name })
          : MONTHLY_GIFT.title,
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

  return (
    <div className="space-y-5 sm:space-y-6" style={{ color: "#09090b" }}>
      <header className="al-card overflow-hidden">
        <div className="p-5 sm:p-7">
          <p className="al-chip">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "#e11d2e" }}
              aria-hidden
            />
            {t("account.dashboard")}
          </p>
          <h1
            className="mt-3 text-[clamp(1.9rem,5vw,2.75rem)] font-extrabold tracking-tight"
            style={{ color: "#09090b" }}
          >
            {(() => {
              const [before = "", after = ""] = t("account.hi", { name: "\u0001" }).split("\u0001");
              return (
                <>
                  {before}
                  <span style={{ color: "#e11d2e" }}>{firstName}</span>
                  {after}
                </>
              );
            })()}
          </h1>
          <p className="al-muted mt-2 max-w-xl text-sm sm:text-base">{t("account.portalLead")}</p>
        </div>

        <div
          className="grid gap-3 border-t p-4 sm:grid-cols-2 sm:gap-4 sm:p-6"
          style={{ borderColor: "#e4e4e7", background: "#fafafa" }}
        >
          <div className="al-stat">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#0284c7" }}>
              {t("account.openBalance")}
            </p>
            <p className="al-ink mt-2 text-[clamp(1.6rem,4vw,2.2rem)] font-bold tabular-nums">
              {formatBdt(stats.openBalance)}
            </p>
            <p className="al-muted mt-1.5 text-xs">
              {stats.open === 0
                ? t("account.noDeposits")
                : stats.open === 1
                  ? t("account.ordersInFlight", { n: stats.open })
                  : t("account.ordersInFlightPlural", { n: stats.open })}
            </p>
          </div>
          <div className="al-stat">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#ca8a04" }}>
              {t("account.lifetimeSpent")}
            </p>
            <p className="al-ink mt-2 text-[clamp(1.6rem,4vw,2.2rem)] font-bold tabular-nums">
              {formatBdt(stats.spent)}
            </p>
            <p className="al-muted mt-1.5 text-xs">
              {t("account.estLoyalty", { amount: formatBdt(stats.bonus) })}
              {" · "}
              {stats.progress.current ? stats.progress.current.name : t("account.belowSilver")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 px-4 pb-4 sm:grid-cols-4 sm:gap-3 sm:px-6 sm:pb-5">
          {[
            [t("account.transactions"), String(stats.total)],
            [t("account.delivered"), String(stats.delivered)],
            [t("account.open"), String(stats.open)],
            [t("account.codesPaid"), formatBdt(stats.deliveredValue)],
          ].map(([label, value]) => (
            <div key={label} className="al-stat">
              <p className="al-faint text-[10px] font-semibold uppercase tracking-[0.12em]">{label}</p>
              <p className="al-ink mt-1 text-lg font-bold tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        <div
          className="flex flex-wrap gap-2 border-t px-3 py-3.5 sm:gap-2.5 sm:px-6 sm:py-5"
          style={{ borderColor: "#e4e4e7" }}
        >
          <Link href="/account/services" className="al-btn al-btn-primary min-w-0 sm:min-w-0">
            {t("account.buyANote")}
          </Link>
          <Link href="/account/orders" className="al-btn al-btn-ghost min-w-0">
            {t("account.viewOrders")}
          </Link>
          <Link href="/account#loyalty" className="al-btn al-btn-ghost w-full sm:w-auto">
            {t("account.rewards")}
          </Link>
        </div>
      </header>

      <ContinueBuy />
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
            <h2 className="al-ink text-lg font-bold">{t("account.buyOnDesk")}</h2>
            <p className="al-muted mt-0.5 text-xs">{t("account.buyOnDeskLead")}</p>
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
                  className="rounded-2xl border p-5 transition hover:shadow-sm"
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

      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {[
          { href: "/account/services", title: t("account.buy"), body: t("account.pickNote") },
          { href: "/account/orders", title: t("account.orders"), body: t("account.trackStatus") },
          {
            href: "/account/payments",
            title: t("account.payments"),
            body: t("account.depositTrail"),
          },
          { href: "/account/profile", title: t("account.profile"), body: t("account.namePhone") },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="al-card block px-3.5 py-3.5 hover:shadow-md sm:px-4 sm:py-4"
          >
            <p className="al-ink text-sm font-bold">{item.title}</p>
            <p className="al-muted mt-1 text-xs leading-snug">{item.body}</p>
          </Link>
        ))}
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
