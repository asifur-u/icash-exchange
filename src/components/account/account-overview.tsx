"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ContinueBuy } from "@/components/continue-buy";
import { formatBdt, formatWhen } from "@/lib/format";
import type { PublicUser } from "@/lib/users";
import { statusTone, type AccountOrder } from "@/components/account/account-types";

export function AccountOverview({ user, orders }: { user: PublicUser; orders: AccountOrder[] }) {
  const firstName = user.name.split(" ")[0] || user.name;
  const stats = useMemo(() => {
    const open = orders.filter((o) => o.status === "PENDING" || o.status === "REVIEWING").length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const spent = orders.reduce((sum, o) => sum + o.total, 0);
    return { open, delivered, spent, total: orders.length };
  }, [orders]);

  const recent = orders.slice(0, 6);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Wise-style greeting + balance card */}
      <header className="overflow-hidden rounded-[24px] border border-white/[0.09] bg-[#0d0d0d]">
        <div className="p-5 sm:p-7">
          <p className="text-[11px] font-medium text-white/40">Dashboard</p>
          <h1 className="mt-1 text-[clamp(1.75rem,5vw,2.35rem)] font-semibold tracking-tight text-white">
            Hi, {firstName}
          </h1>
          <p className="mt-1.5 max-w-lg text-sm text-white/50">
            Your notes, deposits, and codes — in one calm place.
          </p>
        </div>

        <div className="border-t border-white/[0.08] bg-[#111] px-5 py-5 sm:px-7 sm:py-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">
            Total spent
          </p>
          <p className="mt-1 text-[clamp(2rem,6vw,2.75rem)] font-semibold tracking-tight tabular-nums text-white">
            {formatBdt(stats.spent)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip label={`${stats.total} orders`} />
            <Chip label={`${stats.open} open`} />
            <Chip label={`${stats.delivered} delivered`} accent />
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/account/services"
              className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Buy a note
            </Link>
            <Link
              href="/account/orders"
              className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition hover:border-white/35"
            >
              View orders
            </Link>
          </div>
        </div>
      </header>

      <ContinueBuy />

      {/* Quick actions — Wise tile row */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: "/account/services", title: "Buy", body: "Pick a note" },
          { href: "/account/orders", title: "Orders", body: "Track status" },
          { href: "/account/payments", title: "Payments", body: "Deposit trail" },
          { href: "/account/profile", title: "Profile", body: "Name & phone" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[20px] border border-white/[0.09] bg-[#0d0d0d] px-4 py-4 transition hover:border-white/20 hover:bg-[#111]"
          >
            <p className="text-sm font-semibold text-white">{item.title}</p>
            <p className="mt-1 text-xs text-white/40">{item.body}</p>
          </Link>
        ))}
      </section>

      {/* Activity list */}
      <section className="overflow-hidden rounded-[24px] border border-white/[0.09] bg-[#0d0d0d]">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white">Recent activity</h2>
            <p className="mt-0.5 text-xs text-white/40">Latest desk orders</p>
          </div>
          <Link
            href="/account/orders"
            className="text-sm font-medium text-white/50 transition hover:text-white"
          >
            See all
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <p className="text-lg font-semibold text-white">Nothing here yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/45">
              Buy your first note from Services — it will show up here after you start.
            </p>
            <Link
              href="/account/services"
              className="mt-6 inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-black"
            >
              Start buying
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {recent.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}?t=${order.token}`}
                  className="flex items-center gap-3 px-5 py-4 transition hover:bg-white/[0.025] sm:px-6"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] text-xs font-semibold text-white/70">
                    {order.title.replace(/[^0-9]/g, "").slice(0, 3) || "N"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="truncate text-sm font-semibold text-white">{order.title}</p>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-white">
                        {formatBdt(order.total)}
                      </p>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="text-xs text-white/40">
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

function Chip({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <span
      className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium ${
        accent
          ? "border-white/20 bg-white text-black"
          : "border-white/10 bg-white/[0.04] text-white/70"
      }`}
    >
      {label}
    </span>
  );
}
