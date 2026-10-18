"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { statusTone, type AccountOrder } from "@/components/account/account-types";
import { useT } from "@/i18n/provider";
import { formatBdt, formatWhen } from "@/lib/format";

export function AccountOrders({ orders }: { orders: AccountOrder[] }) {
  const t = useT();
  const filters = useMemo(
    () =>
      [
        { id: "all" as const, label: t("account.filterAll") },
        { id: "PENDING" as const, label: t("account.filterPending") },
        { id: "REVIEWING" as const, label: t("account.filterReviewing") },
        { id: "DELIVERED" as const, label: t("account.filterDelivered") },
        { id: "FAILED" as const, label: t("account.filterFailed") },
      ] as const,
    [t],
  );
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");

  const visible = useMemo(() => {
    if (filter === "all") return orders;
    if (filter === "FAILED") {
      return orders.filter((o) => o.status === "FAILED" || o.status === "REFUNDED");
    }
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      PENDING: orders.filter((o) => o.status === "PENDING").length,
      REVIEWING: orders.filter((o) => o.status === "REVIEWING").length,
      DELIVERED: orders.filter((o) => o.status === "DELIVERED").length,
      FAILED: orders.filter((o) => o.status === "FAILED" || o.status === "REFUNDED").length,
    };
  }, [orders]);

  return (
    <div className="space-y-5 sm:space-y-6" style={{ color: "#09090b" }}>
      <header className="al-card overflow-hidden">
        <div className="p-5 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e11d2e]">
            {t("account.orders")}
          </p>
          <h1 className="mt-2 text-[clamp(1.9rem,5vw,2.8rem)] font-extrabold tracking-tight text-zinc-900">
            {t("account.ordersTitle")}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 sm:text-base">
            {t("account.ordersLead")}
          </p>
        </div>
        <div
          className="grid grid-cols-2 gap-2 border-t p-3 sm:grid-cols-5 sm:gap-3 sm:p-4"
          style={{ borderColor: "#e4e4e7", background: "#fafafa" }}
        >
          {filters.map((item) => (
            <div key={item.id} className="al-stat !py-2.5">
              <p className="al-faint text-[10px] font-semibold uppercase tracking-[0.1em]">
                {item.label}
              </p>
              <p className="al-ink mt-0.5 text-lg font-bold tabular-nums">{counts[item.id]}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {filters.map((item) => {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className="shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition"
              style={
                active
                  ? { borderColor: "#18181b", background: "#18181b", color: "#fff" }
                  : { borderColor: "#e4e4e7", background: "#fff", color: "#52525b" }
              }
            >
              {item.label}
              <span className="ml-1.5 tabular-nums opacity-70">{counts[item.id]}</span>
            </button>
          );
        })}
      </div>

      <section className="al-card overflow-hidden">
        {visible.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <p className="text-lg font-bold text-zinc-900">
              {orders.length === 0 ? t("account.noOrdersYet") : t("account.nothingInFilter")}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {orders.length === 0 ? t("account.noOrdersLead") : t("account.nothingInFilterLead")}
            </p>
            {orders.length === 0 ? (
              <Link href="/account/services" className="al-btn al-btn-primary mt-6 inline-flex">
                {t("account.openServices")}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="al-btn al-btn-primary mt-6 inline-flex"
              >
                {t("account.showAll")}
              </button>
            )}
          </div>
        ) : (
          <ul>
            {visible.map((order, index) => (
              <li key={order.id} style={{ borderTop: index === 0 ? undefined : "1px solid #f4f4f5" }}>
                <Link
                  href={`/account/orders/${order.id}?t=${order.token}`}
                  className="flex flex-col gap-3 px-5 py-5 transition hover:bg-[#fafafa] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                      {order.number}
                    </p>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
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
