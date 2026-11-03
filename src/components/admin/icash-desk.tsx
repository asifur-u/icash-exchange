"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useT } from "@/i18n/provider";
import { formatBdt, formatWhen } from "@/lib/format";
import type { AdminSnapshot, LedgerFigures } from "@/lib/types";

export type IcashDeskConfig = {
  connected: boolean;
  environment: "test" | "production";
  host: string;
  auth: "static" | "keys" | null;
  country: string;
  currency: string;
  delivery: "icash" | "desk";
  maxPerOrder: number;
  dailyCap: number;
  email: { provider: boolean; admin: string[] };
};

type Range = "today" | "month" | "all";

type Balance =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ok"; balance: number; currency: string; checkedAt: string }
  | { state: "error"; message: string };

const SETUP_VARS = [
  "ICASH_ENV=test",
  "ICASH_API_KEY=…",
  "ICASH_API_SECRET=…",
  "ICASH_CURRENCY=BDT",
  "ADMIN_NOTIFY_EMAIL=you@example.com",
];

/** `currency === ""` means unknown: show the number alone rather than guess a unit. */
function money(value: number, currency?: string) {
  if (currency === undefined || currency === "BDT") return formatBdt(Math.round(value));
  const amount = value.toLocaleString("en", { maximumFractionDigits: 2 });
  return currency ? `${amount} ${currency}` : amount;
}

function shortDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString("en", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function IcashDesk({
  snapshot,
  config,
  busy,
  onRetry,
}: {
  snapshot: AdminSnapshot;
  config: IcashDeskConfig;
  busy: boolean;
  onRetry: (orderId: string) => void;
}) {
  const t = useT();
  const reduce = useReducedMotion();
  const [range, setRange] = useState<Range>("today");
  const [balance, setBalance] = useState<Balance>({ state: "idle" });
  const ledger = snapshot.ledger;
  const figures: LedgerFigures = ledger[range];

  const issuances = useMemo(
    () =>
      snapshot.orders
        .filter((order) => order.issuance)
        .sort((a, b) => (b.issuance!.startedAt ?? "").localeCompare(a.issuance!.startedAt ?? "")),
    [snapshot.orders],
  );

  const chart = useMemo(() => {
    const max = Math.max(1, ...ledger.days.map((day) => day.revenue));
    return { max, active: ledger.days.some((day) => day.revenue > 0 || day.buyCount > 0 || day.sellCount > 0) };
  }, [ledger.days]);

  const costCurrency = balance.state === "ok" ? balance.currency : "";

  async function checkBalance() {
    setBalance({ state: "loading" });
    try {
      const response = await fetch("/api/admin/icash/balance", { cache: "no-store" });
      const data = (await response.json()) as {
        ok?: boolean;
        balance?: number;
        currency?: string;
        checkedAt?: string;
        message?: string;
        error?: { message?: string };
      };
      if (data.ok && typeof data.balance === "number") {
        setBalance({
          state: "ok",
          balance: data.balance,
          currency: data.currency ?? "",
          checkedAt: data.checkedAt ?? new Date().toISOString(),
        });
      } else {
        setBalance({ state: "error", message: data.message ?? data.error?.message ?? "iCash did not answer." });
      }
    } catch {
      setBalance({ state: "error", message: "Could not reach the desk." });
    }
  }

  const sellMargin = figures.sellFace - figures.sellPayout;
  const queueRows = [
    ledger.queue.awaitingApproval > 0 ? t("icashDesk.queueApprove", { n: ledger.queue.awaitingApproval }) : null,
    ledger.queue.failed > 0 ? t("icashDesk.queueFailed", { n: ledger.queue.failed }) : null,
    ledger.queue.openSells > 0
      ? t("icashDesk.queueSells", { n: ledger.queue.openSells, amount: formatBdt(ledger.queue.openSellFace) })
      : null,
  ].filter(Boolean) as string[];

  return (
    <div className="mt-6 space-y-5">
      {/* Connection + balance */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c] p-5">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl"
            style={{ background: config.connected ? "rgba(52,211,153,0.12)" : "rgba(225,29,46,0.16)" }}
          />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                {t("icashDesk.connection")}
              </p>
              <p className="mt-1 flex items-center gap-2 text-xl font-extrabold tracking-tight">
                <span className="relative flex h-2.5 w-2.5">
                  {config.connected && !reduce ? (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  ) : null}
                  <span
                    className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.connected ? "bg-emerald-400" : "bg-[#e11d2e]"}`}
                  />
                </span>
                {config.connected ? t("icashDesk.connected") : t("icashDesk.notConnected")}
              </p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em]"
              style={
                config.environment === "production"
                  ? { background: "rgba(52,211,153,0.12)", color: "#6ee7b7" }
                  : { background: "rgba(251,191,36,0.12)", color: "#fcd34d" }
              }
            >
              {config.environment === "production" ? t("icashDesk.envProd") : t("icashDesk.envTest")}
            </span>
          </div>

          {config.connected ? (
            <dl className="relative mt-5 grid gap-4 sm:grid-cols-2">
              <Fact label={t("icashDesk.host")} value={config.host} mono />
              <Fact
                label={t("icashDesk.auth")}
                value={config.auth === "static" ? t("icashDesk.authStatic") : t("icashDesk.authKeys")}
              />
              <Fact
                label={t("icashDesk.delivery")}
                value={config.delivery === "icash" ? t("icashDesk.deliveryIcash") : t("icashDesk.deliveryDesk")}
              />
              <Fact label={t("icashDesk.card")} value={`${config.country} · ${config.currency}`} />
              <Fact
                label={t("icashDesk.limits")}
                value={t("icashDesk.limitsValue", {
                  order: money(config.maxPerOrder, config.currency),
                  day: money(config.dailyCap, config.currency),
                })}
              />
            </dl>
          ) : (
            <div className="relative mt-5">
              <p className="text-sm font-bold text-white">{t("icashDesk.setupTitle")}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/50">{t("icashDesk.setupBody")}</p>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] leading-relaxed text-white/70">
                {SETUP_VARS.join("\n")}
              </pre>
            </div>
          )}
        </section>

        <section className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0c0c0c] p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{t("icashDesk.balance")}</p>
            <div className="mt-2 min-h-[3.25rem]">
              {balance.state === "ok" ? (
                <motion.p
                  key={balance.checkedAt}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[2rem] font-extrabold leading-none tabular-nums tracking-tight"
                >
                  {money(balance.balance, balance.currency)}
                </motion.p>
              ) : balance.state === "error" ? (
                <p className="text-sm font-semibold text-[#ff7a84]">{balance.message}</p>
              ) : (
                <p className="text-sm text-white/45">
                  {balance.state === "loading" ? t("icashDesk.checking") : t("icashDesk.balanceIdle")}
                </p>
              )}
              {balance.state === "ok" ? (
                <p className="mt-2 text-[11px] text-white/35">
                  {t("icashDesk.checkedAt", { when: formatWhen(balance.checkedAt) })}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            disabled={!config.connected || balance.state === "loading"}
            onClick={() => void checkBalance()}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-40"
          >
            {balance.state === "loading" ? t("icashDesk.checking") : t("icashDesk.checkBalance")}
          </button>
        </section>
      </div>

      {/* Money board */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex rounded-full bg-white/[0.05] p-1" role="tablist">
            {(["today", "month", "all"] as Range[]).map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={range === id}
                onClick={() => setRange(id)}
                className="relative rounded-full px-3.5 py-1.5 text-xs font-semibold"
              >
                {range === id ? (
                  <motion.span
                    layoutId="icash-range"
                    className="absolute inset-0 rounded-full bg-[#e11d2e]"
                    transition={{ type: "spring", stiffness: 480, damping: 36 }}
                  />
                ) : null}
                <span className={`relative ${range === id ? "text-white" : "text-white/60"}`}>
                  {id === "today" ? t("icashDesk.rangeToday") : id === "month" ? t("icashDesk.rangeMonth") : t("icashDesk.rangeAll")}
                </span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-white/35">Asia/Dhaka</p>
        </div>

        <div className="grid gap-px bg-white/[0.06] sm:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
          <div className="relative overflow-hidden bg-[#0c0c0c] p-5">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#e11d2e]/20 blur-3xl"
            />
            <p className="relative text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ff7a84]">
              {t("icashDesk.kpiRevenue")}
            </p>
            <motion.p
              key={`${range}-${figures.revenue}`}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative mt-2 text-[2.4rem] font-extrabold leading-none tabular-nums tracking-tight"
            >
              {formatBdt(figures.revenue)}
            </motion.p>
            <p className="relative mt-3 text-xs text-white/45">
              {t("icashDesk.kpiFees")} {formatBdt(figures.buyFee)} · {t("icashDesk.kpiSellMargin")} {formatBdt(sellMargin)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-white/[0.06] md:grid-cols-4">
            <Cell label={t("icashDesk.kpiIssued")} value={String(figures.issued)} />
            <Cell label={t("icashDesk.kpiIssuedFace")} value={formatBdt(figures.issuedFace)} />
            <Cell label={t("icashDesk.kpiCost")} value={figures.icashCost ? money(figures.icashCost, costCurrency) : "—"} />
            <Cell label={t("icashDesk.kpiBuyGross")} value={formatBdt(figures.buyGross)} sub={`${figures.buyCount}×`} />
            <Cell label={t("icashDesk.kpiFees")} value={formatBdt(figures.buyFee)} />
            <Cell label={t("icashDesk.kpiSells")} value={formatBdt(figures.sellFace)} sub={`${figures.sellCount}×`} />
            <Cell label={t("icashDesk.kpiSellPayout")} value={formatBdt(figures.sellPayout)} />
            <Cell label={t("icashDesk.kpiSellMargin")} value={formatBdt(sellMargin)} />
          </div>
        </div>
      </section>

      {/* Daily chart + queue */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c]">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{t("icashDesk.dailyEyebrow")}</p>
              <h2 className="mt-0.5 text-lg font-bold tracking-tight">{t("icashDesk.dailyTitle")}</h2>
            </div>
            <div className="flex gap-3 text-[11px] text-white/50">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-[#e11d2e]" /> {t("icashDesk.legendFees")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-white/50" /> {t("icashDesk.legendMargin")}
              </span>
            </div>
          </div>
          <div className="p-5">
            {chart.active ? (
              <div className="flex h-44 items-end gap-[3px]" role="img" aria-label={t("icashDesk.dailyTitle")}>
                {ledger.days.map((day, index) => {
                  const margin = day.sellFace - day.sellPayout;
                  const total = (day.revenue / chart.max) * 100;
                  const feeShare = day.revenue ? (day.buyFee / day.revenue) * 100 : 0;
                  return (
                    <div key={day.date} className="group relative flex h-full flex-1 flex-col justify-end">
                      <motion.div
                        initial={reduce ? false : { height: 0 }}
                        animate={{ height: `${Math.max(day.revenue ? 4 : 1.5, total)}%` }}
                        transition={{ delay: reduce ? 0 : index * 0.015, type: "spring", stiffness: 220, damping: 26 }}
                        className="flex w-full flex-col-reverse overflow-hidden rounded-t-[3px] bg-white/[0.06]"
                      >
                        {day.revenue ? (
                          <>
                            <span className="block w-full bg-[#e11d2e]" style={{ height: `${feeShare}%` }} />
                            <span className="block w-full bg-white/50" style={{ height: `${100 - feeShare}%` }} />
                          </>
                        ) : null}
                      </motion.div>
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max -translate-x-1/2 rounded-lg border border-white/10 bg-black px-2.5 py-1.5 text-[11px] text-white/80 shadow-xl group-hover:block">
                        <p className="font-semibold text-white">{shortDay(day.date)}</p>
                        <p>{formatBdt(day.revenue)}</p>
                        <p className="text-white/45">
                          {day.buyCount} buy · {day.issued} iCash · {formatBdt(margin)} sell
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-white/40">{t("icashDesk.noDays")}</p>
            )}
            {chart.active ? (
              <div className="mt-2 flex justify-between text-[10px] text-white/30">
                <span>{shortDay(ledger.days[0]!.date)}</span>
                <span>{shortDay(ledger.days[ledger.days.length - 1]!.date)}</span>
              </div>
            ) : null}
          </div>
          {chart.active ? (
            <div className="max-h-72 overflow-auto border-t border-white/10">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="sticky top-0 bg-[#0c0c0c] text-[10px] uppercase tracking-[0.12em] text-white/35">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">{t("icashDesk.tableDay")}</th>
                    <th className="px-3 py-2.5 font-semibold">{t("icashDesk.tableBuys")}</th>
                    <th className="px-3 py-2.5 font-semibold">{t("icashDesk.tableIssued")}</th>
                    <th className="px-3 py-2.5 font-semibold">{t("icashDesk.tableIn")}</th>
                    <th className="px-3 py-2.5 font-semibold">{t("icashDesk.tableOut")}</th>
                    <th className="px-5 py-2.5 text-right font-semibold">{t("icashDesk.tableRevenue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...ledger.days]
                    .reverse()
                    .filter((day) => day.buyCount || day.sellCount || day.issued)
                    .map((day) => (
                      <tr key={day.date} className="border-t border-white/[0.06] tabular-nums text-white/75">
                        <td className="px-5 py-2.5 font-semibold text-white">{shortDay(day.date)}</td>
                        <td className="px-3 py-2.5">{day.buyCount}</td>
                        <td className="px-3 py-2.5">{day.issued}</td>
                        <td className="px-3 py-2.5">{formatBdt(day.buyGross)}</td>
                        <td className="px-3 py-2.5">{formatBdt(day.sellPayout)}</td>
                        <td className="px-5 py-2.5 text-right font-bold text-white">{formatBdt(day.revenue)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e11d2e]">{t("icashDesk.queueTitle")}</p>
            {queueRows.length ? (
              <ul className="mt-3 space-y-2">
                {queueRows.map((row) => (
                  <li key={row} className="flex items-center gap-2 text-sm font-semibold text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300" aria-hidden />
                    {row}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-white/45">{t("icashDesk.queueClear")}</p>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0c0c0c] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{t("icashDesk.emailsTitle")}</p>
            <ul className="mt-3 space-y-2 text-[13px] text-white/75">
              {(
                [
                  "emailAdminBuy",
                  "emailAdminSell",
                  "emailBuyerReceived",
                  "emailIssued",
                  "emailSeller",
                  "emailFailed",
                ] as const
              ).map((key) => (
                <li key={key} className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${config.email.provider ? "bg-emerald-400" : "bg-white/25"}`}
                    aria-hidden
                  />
                  {t(`icashDesk.${key}`)}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-white/[0.06] pt-3 text-[11px] leading-relaxed text-white/45">
              {!config.email.provider
                ? t("icashDesk.emailNoProvider")
                : config.email.admin.length
                  ? t("icashDesk.emailTo", { to: config.email.admin.join(", ") })
                  : t("icashDesk.emailNoAdmin")}
            </p>
          </section>
        </div>
      </div>

      {/* Issuance log */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c]">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{t("icashDesk.issuesEyebrow")}</p>
          <h2 className="mt-0.5 text-lg font-bold tracking-tight">{t("icashDesk.issuesTitle")}</h2>
        </div>
        {issuances.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-lg font-bold text-white/90">{t("icashDesk.issuesEmpty")}</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/40">{t("icashDesk.issuesEmptyBody")}</p>
          </div>
        ) : (
          <ul>
            {issuances.map((order, index) => {
              const issuance = order.issuance!;
              const tone =
                issuance.status === "ISSUED"
                  ? { dot: "bg-emerald-400", text: "text-emerald-200", label: t("icashDesk.statusIssued") }
                  : issuance.status === "ISSUING"
                    ? { dot: "bg-amber-300", text: "text-amber-100", label: t("icashDesk.statusIssuing") }
                    : { dot: "bg-red-400", text: "text-red-200", label: t("icashDesk.statusFailed") };
              return (
                <motion.li
                  key={order.id}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduce ? 0 : Math.min(index, 10) * 0.03 }}
                  className="flex flex-col gap-3 border-t border-white/[0.06] px-5 py-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
                      <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden />
                      {order.number}
                      <span className={`text-xs font-semibold ${tone.text}`}>{tone.label}</span>
                      {issuance.environment === "test" ? (
                        <span className="rounded-full bg-amber-300/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                          test
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 break-all text-xs text-white/45">
                      {order.email} · {money(issuance.amount ?? order.voucher, issuance.currency)}
                      {issuance.cost != null ? ` · cost ${money(issuance.cost, costCurrency)}` : ""}
                      {issuance.masked?.length ? ` · ${issuance.masked.join(", ")}` : ""}
                    </p>
                    {issuance.status === "FAILED" && issuance.errorMessage ? (
                      <p className="mt-1 text-xs text-[#ff7a84]">
                        {issuance.errorMessage} <span className="font-mono text-white/35">({issuance.error})</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <p className="text-[11px] text-white/35">
                      {formatWhen(issuance.issuedAt ?? issuance.startedAt)}
                      {issuance.attempts > 1 ? ` · ${t("icashDesk.tries", { n: issuance.attempts })}` : ""}
                    </p>
                    {issuance.status !== "ISSUED" && order.status === "PAID" ? (
                      <button
                        type="button"
                        disabled={busy || !config.connected}
                        onClick={() => onRetry(order.id)}
                        className="inline-flex h-9 items-center rounded-lg bg-[#e11d2e] px-3.5 text-xs font-semibold text-white hover:bg-[#c41828] disabled:opacity-40"
                      >
                        {t("icashDesk.retry")}
                      </button>
                    ) : null}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">{label}</dt>
      <dd className={`mt-0.5 break-all text-white/85 ${mono ? "font-mono text-xs" : "text-sm"}`}>{value}</dd>
    </div>
  );
}

function Cell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 bg-[#0c0c0c] px-3 py-4 sm:px-4">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className="mt-1 break-words text-base font-extrabold tabular-nums tracking-tight text-white sm:text-lg">
        {value}
        {sub ? <span className="ml-1.5 text-[11px] font-semibold text-white/35">{sub}</span> : null}
      </p>
    </div>
  );
}
