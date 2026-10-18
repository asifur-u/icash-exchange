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
    const peak = rows.reduce(
      (best, row) => (row.total > best.total ? row : best),
      rows[0] ?? { key: "", label: "—", total: 0 },
    );
    return { rows, max, periodTotal: rows.reduce((s, r) => s + r.total, 0), peak };
  }, [orders, locale]);

  const hasAny = months.periodTotal > 0;

  return (
    <section className="al-card overflow-hidden" style={{ color: "#09090b" }}>
      <div
        className="flex flex-wrap items-end justify-between gap-3 border-b px-5 py-4 sm:px-6"
        style={{ borderColor: "#e4e4e7" }}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0284c7]">
            {t("account.spendChart")}
          </p>
          <h2 className="al-ink mt-1 text-xl font-extrabold sm:text-2xl">{t("account.last6")}</h2>
        </div>
        <div className="flex flex-wrap gap-4 text-right">
          {hasAny ? (
            <div>
              <p className="al-faint text-[10px] uppercase tracking-[0.12em]">{t("account.peakMonth")}</p>
              <p className="al-ink text-sm font-bold">
                {months.peak.label} · {formatBdt(months.peak.total)}
              </p>
            </div>
          ) : null}
          <div>
            <p className="al-faint text-[10px] uppercase tracking-[0.12em]">{t("account.periodTotal")}</p>
            <p className="al-ink text-lg font-bold tabular-nums">{formatBdt(months.periodTotal)}</p>
          </div>
        </div>
      </div>

      {!hasAny ? (
        <div className="px-5 py-12 text-center sm:px-6">
          <p className="al-muted text-sm">{t("account.noChartYet")}</p>
        </div>
      ) : (
        <div className="flex h-48 items-end gap-1.5 px-3 pb-3 pt-5 sm:h-60 sm:gap-3 sm:px-6 sm:pt-6">
          {months.rows.map((row) => {
            const height = Math.max(row.total > 0 ? 14 : 5, (row.total / months.max) * 100);
            const isPeak = row.key === months.peak.key && row.total > 0;
            return (
              <div
                key={row.key}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5 sm:gap-2"
              >
                <p className="al-faint max-w-full truncate text-[9px] tabular-nums sm:text-xs">
                  {row.total > 0 ? formatBdt(row.total).replace("BDT ", "") : "—"}
                </p>
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className="mx-auto w-full max-w-[52px] rounded-t-xl transition"
                    style={{
                      height: `${height}%`,
                      background: isPeak
                        ? "linear-gradient(180deg, #ff5a67 0%, #e11d2e 55%, #9f1239 100%)"
                        : "linear-gradient(180deg, #38bdf8 0%, #0284c7 70%, #0c4a6e 120%)",
                      opacity: row.total > 0 ? 1 : 0.22,
                      boxShadow: isPeak ? "0 8px 20px rgba(225,29,46,0.28)" : "none",
                    }}
                  />
                </div>
                <p
                  className="text-[11px] font-semibold"
                  style={{ color: isPeak ? "#e11d2e" : "#71717a" }}
                >
                  {row.label}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
