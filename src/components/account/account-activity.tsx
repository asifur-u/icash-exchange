"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatWhen } from "@/lib/format";
import type { AccountOrder } from "@/components/account/account-types";

type ActivityItem = {
  id: string;
  at: string;
  title: string;
  body: string;
  href: string;
  tone: "neutral" | "warn" | "ok";
};

export function AccountActivity({ orders }: { orders: AccountOrder[] }) {
  const items = useMemo(() => {
    const rows: ActivityItem[] = [];
    for (const order of orders) {
      rows.push({
        id: `${order.id}-created`,
        at: order.createdAt,
        title: "Order created",
        body: `${order.number} · ${order.title}`,
        href: `/account/orders/${order.id}?t=${order.token}`,
        tone: "neutral",
      });
      if (order.proofSubmittedAt) {
        rows.push({
          id: `${order.id}-proof`,
          at: order.proofSubmittedAt,
          title: "Deposit proof submitted",
          body: `${order.number} · waiting on the desk`,
          href: `/account/orders/${order.id}?t=${order.token}`,
          tone: "warn",
        });
      }
      if (order.status === "REVIEWING") {
        rows.push({
          id: `${order.id}-review`,
          at: order.proofSubmittedAt ?? order.createdAt,
          title: "In review",
          body: `${order.number} · owner is matching your payment`,
          href: `/account/orders/${order.id}?t=${order.token}`,
          tone: "warn",
        });
      }
      if (order.deliveredAt || order.status === "DELIVERED") {
        rows.push({
          id: `${order.id}-delivered`,
          at: order.deliveredAt ?? order.createdAt,
          title: "Code delivered",
          body: `${order.number} · open the order to copy`,
          href: `/account/orders/${order.id}?t=${order.token}`,
          tone: "ok",
        });
      }
      if (order.status === "FAILED" || order.status === "REFUNDED") {
        rows.push({
          id: `${order.id}-closed`,
          at: order.createdAt,
          title: order.status === "REFUNDED" ? "Order refunded" : "Order failed",
          body: `${order.number} · ${order.title}`,
          href: `/account/orders/${order.id}?t=${order.token}`,
          tone: "neutral",
        });
      }
    }
    return rows.sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [orders]);

  return (
    <div className="space-y-5">
      <header className="rounded-[28px] border border-zinc-200 bg-white shadow-sm p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff2d2d]">Activity</p>
        <h1 className="mt-2 display text-[clamp(2rem,6vw,3.2rem)] leading-[0.95]">
          Desk timeline.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-500">
          Created, proof submitted, reviewing, and delivered — in one feed.
        </p>
      </header>

      <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        {items.length === 0 ? (
          <div className="px-6 py-12">
            <p className="text-xl font-semibold">No activity yet.</p>
            <p className="mt-2 text-sm text-zinc-500">Buy a note and your timeline starts here.</p>
            <Link
              href="/account/services"
              className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#ff2d2d] px-5 text-sm font-semibold text-white"
            >
              Open services
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex gap-4 px-5 py-4 transition hover:bg-zinc-50 sm:px-6"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                      item.tone === "ok"
                        ? "bg-[#9fe870]"
                        : item.tone === "warn"
                          ? "bg-amber-300"
                          : "bg-zinc-300"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold tracking-tight text-zinc-900">{item.title}</p>
                    <p className="mt-1 text-sm text-zinc-500">{item.body}</p>
                    <p className="mt-1 text-xs text-zinc-400">{formatWhen(item.at)}</p>
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
