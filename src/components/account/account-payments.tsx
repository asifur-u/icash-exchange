"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatBdt, formatWhen } from "@/lib/format";
import type { AccountOrder } from "@/components/account/account-types";

export function AccountPayments({ orders }: { orders: AccountOrder[] }) {
  const payments = useMemo(
    () =>
      orders.filter(
        (order) =>
          Boolean(order.transactionId) ||
          order.status === "REVIEWING" ||
          order.status === "DELIVERED" ||
          order.status === "PAID",
      ),
    [orders],
  );

  const totalPaid = payments.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        <div className="p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff2d2d]">Payments</p>
          <h1 className="mt-2 display text-[clamp(2rem,6vw,3.2rem)] leading-[0.95]">
            Deposit history.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-500">
            TrxIDs and methods from your orders. Open an order for the full proof status.
          </p>
        </div>
        <div className="grid border-t border-zinc-100 sm:grid-cols-2">
          <div className="px-6 py-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">Records</p>
            <p className="mt-1 display-soft text-3xl">{payments.length}</p>
          </div>
          <div className="border-t border-zinc-100 px-6 py-4 sm:border-l sm:border-t-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">Total logged</p>
            <p className="mt-1 display-soft text-3xl text-[#ff2d2d]">{formatBdt(totalPaid)}</p>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        {payments.length === 0 ? (
          <div className="px-6 py-12">
            <p className="text-xl font-semibold">No payments yet.</p>
            <p className="mt-2 text-sm text-zinc-500">
              After you send a deposit, the TrxID appears here.
            </p>
            <Link
              href="/account/services"
              className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#ff2d2d] px-5 text-sm font-semibold text-white"
            >
              Buy a note
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {payments.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}?t=${order.token}`}
                  className="flex flex-col gap-2 px-5 py-5 transition hover:bg-zinc-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div>
                    <p className="font-mono text-[11px] text-zinc-400">{order.number}</p>
                    <p className="mt-1 font-semibold tracking-tight">
                      {(order.paymentMethod ?? "deposit").toUpperCase()} · {formatBdt(order.total)}
                    </p>
                    <p className="mt-1 font-mono text-sm text-zinc-500">
                      {order.transactionId ?? "TrxID pending"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {formatWhen(order.proofSubmittedAt ?? order.createdAt)}
                    </p>
                  </div>
                  <span className="inline-flex h-9 items-center self-start rounded-full border border-zinc-200 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
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
