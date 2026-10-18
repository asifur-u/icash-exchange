"use client";

import Link from "next/link";
import { useMemo } from "react";
import { statusTone, type AccountOrder } from "@/components/account/account-types";
import { useT } from "@/i18n/provider";
import { formatBdt, formatWhen } from "@/lib/format";

export function AccountPayments({ orders }: { orders: AccountOrder[] }) {
  const t = useT();

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
    <div className="space-y-5 sm:space-y-6" style={{ color: "#09090b" }}>
      <header className="al-card overflow-hidden">
        <div className="p-5 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e11d2e]">
            {t("account.payments")}
          </p>
          <h1 className="mt-2 text-[clamp(1.9rem,5vw,2.8rem)] font-extrabold tracking-tight text-zinc-900">
            {t("account.paymentsTitle")}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 sm:text-base">
            {t("account.paymentsLead")}
          </p>
        </div>
        <div
          className="grid border-t sm:grid-cols-2"
          style={{ borderColor: "#e4e4e7", background: "#fafafa" }}
        >
          <div className="px-5 py-4 sm:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              {t("account.records")}
            </p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-zinc-900">
              {payments.length}
            </p>
          </div>
          <div
            className="border-t px-5 py-4 sm:border-l sm:border-t-0 sm:px-6"
            style={{ borderColor: "#e4e4e7" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              {t("account.totalLogged")}
            </p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-[#e11d2e]">
              {formatBdt(totalPaid)}
            </p>
          </div>
        </div>
      </header>

      <section className="al-card overflow-hidden">
        {payments.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <p className="text-lg font-bold text-zinc-900">{t("account.noPaymentsYet")}</p>
            <p className="mt-2 text-sm text-zinc-500">{t("account.noPaymentsLead")}</p>
            <Link href="/account/services" className="al-btn al-btn-primary mt-6 inline-flex">
              {t("account.buyANote")}
            </Link>
          </div>
        ) : (
          <ul>
            {payments.map((order, index) => (
              <li key={order.id} style={{ borderTop: index === 0 ? undefined : "1px solid #f4f4f5" }}>
                <Link
                  href={`/account/orders/${order.id}?t=${order.token}`}
                  className="flex flex-col gap-2 px-5 py-5 transition hover:bg-[#fafafa] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-zinc-400">{order.number}</p>
                    <p className="mt-1 font-semibold tracking-tight text-zinc-900">
                      {(order.paymentMethod ?? "deposit").toUpperCase()} · {formatBdt(order.total)}
                    </p>
                    <p className="mt-1 font-mono text-sm text-zinc-500">
                      {order.transactionId ?? t("account.trxPending")}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {formatWhen(order.proofSubmittedAt ?? order.createdAt)}
                    </p>
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
