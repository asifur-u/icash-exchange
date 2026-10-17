"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatBdt, formatWhen } from "@/lib/format";
import { statusTone, type AccountOrder } from "@/components/account/account-types";

const filters = [
  { id: "all", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "REVIEWING", label: "Reviewing" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "FAILED", label: "Failed" },
] as const;

export function AccountOrders({ orders }: { orders: AccountOrder[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");

  const visible = useMemo(() => {
    if (filter === "all") return orders;
    if (filter === "FAILED") {
      return orders.filter((o) => o.status === "FAILED" || o.status === "REFUNDED");
    }
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  return (
    <div className="space-y-5">
      <header className="rounded-[28px] border border-zinc-200 bg-white shadow-sm p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff2d2d]">Orders</p>
        <h1 className="mt-2 display text-[clamp(2rem,6vw,3.2rem)] leading-[0.95]">Your notes.</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-500">
          Filter by status, then open an order to copy the code when delivered.
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        {visible.length === 0 ? (
          <div className="px-6 py-12">
            <p className="text-xl font-semibold">
              {orders.length === 0 ? "No orders yet." : "Nothing in this filter."}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {orders.length === 0
                ? "Start from Services when you are ready to buy."
                : "Try another status, or clear the filter."}
            </p>
            {orders.length === 0 ? (
              <Link
                href="/account/services"
                className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#ff2d2d] px-5 text-sm font-semibold text-white"
              >
                Open services
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#ff2d2d] px-5 text-sm font-semibold text-white"
              >
                Show all
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {visible.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}?t=${order.token}`}
                  className="flex flex-col gap-3 px-5 py-5 transition hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                      {order.number}
                    </p>
                    <p className="mt-1 text-lg font-semibold tracking-tight">
                      {order.title} · {formatBdt(order.total)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {formatWhen(order.createdAt)}
                      {order.paymentMethod ? ` · ${order.paymentMethod}` : ""}
                      {order.transactionId ? ` · ${order.transactionId}` : ""}
                    </p>
                  </div>
                  <span
                    className={`inline-flex h-9 items-center self-start rounded-full border px-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${statusTone(order.status)}`}
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
