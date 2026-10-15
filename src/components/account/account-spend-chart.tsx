"use client";

import { useMemo } from "react";
import type { AccountOrder } from "@/components/account/account-types";
import { useLocale, useT } from "@/i18n/provider";
import { formatBdt } from "@/lib/format";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function AccountSpendChart({ orders }: { orders: AccountOrder[] }) {
  const t = useT();
  const { locale } = useLocale();

  const months = useMemo(() => {
    const now = new Date();
    const keys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(monthKey(d));
    }
    const totals = new Map(keys.map((k) => [k, 0]));
    for (const order of orders) {
      const d = new Date(order.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const key = monthKey(d);
      if (totals.has(key)) totals.set(key, (totals.get(key) ?? 0) + order.total);
    }
    const tag = locale === "bn" ? "bn-BD" : "en";
    const rows = keys.map((key) => {
      const [y, m] = key.split("-").map(Number);
      return {
        key,
        label: new Date(y, m - 1, 1).toLocaleString(tag, { month: "short" }),
        total: totals.get(key) ?? 0,
      };
    });
    const max = Math.max(1, ...rows.map((r) => r.total));
    return { rows, max, periodTotal: rows.reduce((s, r) => s + r.total, 0) };
  }, [orders, locale]);

  return (
    <section className="al-card overflow-hidden" style={{ color: "#09090b" }}>
      <div
        className="flex flex-wrap items-end justify-between gap-3 border-b px-5 py-4 sm:px-6"
        style={{ borderColor: "#e4e4e7" }}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "#0284c7" }}>
            {t("account.spendChart")}
          </p>
          <h2 className="al-ink mt-1 text-xl font-extrabold sm:text-2xl">{t("account.last6")}</h2>
        </div>
        <div className="text-right">
          <p className="al-faint text-[10px] uppercase tracking-[0.12em]">{t("account.periodTotal")}</p>
          <p className="al-ink text-lg font-bold tabular-nums">{formatBdt(months.periodTotal)}</p>
        </div>
      </div>

      <div className="flex h-48 items-end gap-2 px-4 pb-3 pt-6 sm:h-56 sm:gap-3 sm:px-6">
        {months.rows.map((row) => {
          const height = Math.max(row.total > 0 ? 12 : 4, (row.total / months.max) * 100);
          return (
            <div key={row.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <p className="al-faint text-[10px] tabular-nums sm:text-xs">
                {row.total > 0 ? formatBdt(row.total).replace("BDT ", "") : "—"}
              </p>
              <div className="relative flex w-full flex-1 items-end">
                <div
                  className="mx-auto w-full max-w-[48px] rounded-t-xl"
                  style={{
                    height: `${height}%`,
                    background: "linear-gradient(180deg, #0ea5e9 0%, #e11d2e 120%)",
                    opacity: row.total > 0 ? 1 : 0.25,
                  }}
                />
              </div>
              <p className="al-muted text-[11px] font-semibold">{row.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
