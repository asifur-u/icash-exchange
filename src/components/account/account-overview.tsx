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

  const recent = orders.slice(0, 5);

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-[28px] border border-white/12 bg-[#0a0a0a]">
        <div
          aria-hidden="true"
          className="h-px bg-gradient-to-r from-transparent via-[#ff2d2d] to-transparent"
        />
        <div className="bg-[radial-gradient(80%_120%_at_0%_0%,rgba(255,45,45,0.22),transparent_50%)] p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff2d2d]">Overview</p>
          <h1 className="mt-2 display text-[clamp(2.2rem,7vw,3.6rem)] leading-[0.95]">
            Hello, <span className="accent-red">{firstName}.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
            Your desk summary — open notes, delivered codes, and a fast path to buy.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link
              href="/account/services"
              className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-black"
            >
              Browse services
            </Link>
            <Link
              href="/account/profile"
              className="inline-flex h-11 items-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white"
            >
              Edit profile
            </Link>
          </div>
        </div>

        <div className="grid border-t border-white/10 sm:grid-cols-4">
          <Stat label="Orders" value={String(stats.total)} />
          <Stat label="Open" value={String(stats.open)} />
          <Stat label="Delivered" value={String(stats.delivered)} hot />
          <Stat label="Spent" value={formatBdt(stats.spent)} />
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/account/services", label: "Services", body: "Buy a note" },
          { href: "/account/orders", label: "Orders", body: "Track status" },
          { href: "/account/payments", label: "Payments", body: "Trx history" },
          { href: "/account/support", label: "Support", body: "FAQ & tips" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[22px] border border-white/12 bg-[#0a0a0a] px-4 py-4 transition hover:border-white/30"
          >
            <p className="text-sm font-semibold text-white">{item.label}</p>
            <p className="mt-1 text-xs text-white/45">{item.body}</p>
          </Link>
        ))}
      </div>

      <ContinueBuy />

      <section className="overflow-hidden rounded-[28px] border border-white/12 bg-[#0a0a0a]">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Recent</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Latest orders</h2>
          </div>
          <Link href="/account/orders" className="text-sm font-semibold text-white/55 hover:text-white">
            All orders →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="px-5 py-10 sm:px-6">
            <p className="text-lg font-semibold">No orders yet.</p>
            <p className="mt-2 max-w-md text-sm text-white/50">
              Open Services, pick a note, and your first order will show here.
            </p>
            <Link
              href="/account/services"
              className="mt-5 inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-black"
            >
              Go to services
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {recent.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}?t=${order.token}`}
                  className="flex flex-col gap-3 px-5 py-4 transition hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div>
                    <p className="font-mono text-[11px] text-white/40">{order.number}</p>
                    <p className="mt-1 font-semibold tracking-tight">
                      {order.title} · {formatBdt(order.total)}
                    </p>
                    <p className="mt-1 text-sm text-white/45">{formatWhen(order.createdAt)}</p>
                  </div>
                  <span
                    className={`inline-flex h-9 items-center self-start rounded-full border px-3 text-[10px] font-semibold uppercase tracking-[0.14em] ${statusTone(order.status)}`}
                  >
                    {order.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hot = false }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="border-t border-white/10 px-5 py-4 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0">
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">{label}</p>
      <p className={`mt-1.5 display-soft text-2xl sm:text-3xl ${hot ? "text-[#ff2d2d]" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
