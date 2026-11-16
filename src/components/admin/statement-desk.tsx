"use client";

import { useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { useT } from "@/i18n/provider";
import { downloadText } from "@/lib/admin-ops";
import { formatBdt } from "@/lib/format";
import { downloadStatementPdf, printStatement } from "@/lib/statement-export";
import type { AdminSnapshot } from "@/lib/types";

type SaleRow = {
  id: string;
  number: string;
  email: string;
  payout: number;
  method: string;
  status: string;
  createdAt: string;
};

type Range = "today" | "yesterday" | "week" | "month" | "year" | "custom";

type Line = {
  id: string;
  at: string;
  kind: "inflow" | "outflow" | "processing";
  title: string;
  party: string;
  method: string;
  ref: string;
  amount: number;
  status: string;
};

type BuiltRow = Line & { balance: number };

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function boundsFor(range: Range, from: string, to: string) {
  const now = new Date();
  const start = startOfDay(now);
  const end = endOfDay(now);
  if (range === "today") return { start, end };
  if (range === "yesterday") {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
    return { start, end };
  }
  if (range === "week") {
    const weekday = start.getDay();
    start.setDate(start.getDate() - (weekday === 0 ? 6 : weekday - 1));
    return { start, end };
  }
  if (range === "month") {
    start.setDate(1);
    return { start, end };
  }
  if (range === "year") {
    start.setMonth(0, 1);
    return { start, end };
  }
  return {
    start: from ? new Date(`${from}T00:00:00`) : start,
    end: to ? new Date(`${to}T23:59:59`) : end,
  };
}

function stamp(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function money(amount: number) {
  return formatBdt(Math.round(amount));
}

function csvEscape(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function dateOnly(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function generatedStamp() {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export function StatementDesk({ snapshot, sells }: { snapshot: AdminSnapshot; sells: SaleRow[] }) {
  const t = useT();
  const [range, setRange] = useState<Range>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const built = useMemo(() => {
    const { start, end } = boundsFor(range, from, to);
    const lines: Line[] = [];

    for (const order of snapshot.orders) {
      const method = (order.paymentMethod ?? "desk").toUpperCase();
      if (order.status === "DELIVERED" || order.status === "PAID") {
        lines.push({
          id: `in-${order.id}`,
          at: order.paidAt ?? order.deliveredAt ?? order.createdAt,
          kind: "inflow",
          title: order.title,
          party: order.email,
          method,
          ref: order.transactionId || order.number,
          amount: order.total,
          status: "Approved",
        });
      }
      if (order.issuance?.status === "ISSUED") {
        lines.push({
          id: `out-${order.id}`,
          at: order.issuance.issuedAt ?? order.issuance.startedAt,
          kind: "outflow",
          title: t("admin.stmtIcashOut"),
          party: order.email,
          method: "iCash",
          ref: order.number,
          amount: order.issuance.cost ?? order.issuance.amount ?? order.voucher,
          status: "Posted",
        });
      }
      if (order.status === "REVIEWING") {
        lines.push({
          id: `proc-${order.id}`,
          at: order.proofSubmittedAt ?? order.createdAt,
          kind: "processing",
          title: order.title,
          party: order.email,
          method,
          ref: order.transactionId || order.number,
          amount: order.total,
          status: "Processing",
        });
      }
    }

    for (const sale of sells) {
      if (sale.status !== "PAID") continue;
      lines.push({
        id: `sell-${sale.id}`,
        at: sale.createdAt,
        kind: "outflow",
        title: t("admin.stmtSellOut"),
        party: sale.email,
        method: sale.method.toUpperCase(),
        ref: sale.number,
        amount: sale.payout,
        status: "Paid",
      });
    }

    const opening = lines
      .filter((line) => line.kind !== "processing" && +new Date(line.at) < +start)
      .reduce((sum, line) => sum + (line.kind === "inflow" ? line.amount : -line.amount), 0);

    const period = lines
      .filter((line) => {
        const at = +new Date(line.at);
        return at >= +start && at <= +end;
      })
      .sort((a, b) => +new Date(a.at) - +new Date(b.at));

    let running = opening;
    const rows: BuiltRow[] = period.map((line) => {
      if (line.kind !== "processing") {
        running += line.kind === "inflow" ? line.amount : -line.amount;
      }
      return { ...line, balance: running };
    });

    const inflow = period.filter((line) => line.kind === "inflow").reduce((sum, line) => sum + line.amount, 0);
    const outflow = period.filter((line) => line.kind === "outflow").reduce((sum, line) => sum + line.amount, 0);
    const processing = period.filter((line) => line.kind === "processing").length;
    const periodLabel = `${dateOnly(start)}  –  ${dateOnly(end)}`;

    return { start, end, opening, closing: running, inflow, outflow, processing, rows, periodLabel };
  }, [from, range, sells, snapshot.orders, t, to]);

  const ranges: Array<{ id: Range; label: string }> = [
    { id: "today", label: t("admin.stmtToday") },
    { id: "yesterday", label: t("admin.stmtYesterday") },
    { id: "week", label: t("admin.stmtWeek") },
    { id: "month", label: t("admin.stmtMonth") },
    { id: "year", label: t("admin.stmtYear") },
    { id: "custom", label: t("admin.stmtCustom") },
  ];

  const fileStamp = new Date().toISOString().slice(0, 10);

  function exportCsv() {
    const header = ["when", "type", "title", "email", "method", "reference", "amount", "status", "balance"];
    const rows = built.rows.map((row) =>
      [
        stamp(row.at),
        row.kind,
        row.title,
        row.party,
        row.method,
        row.ref,
        String(Math.round(row.amount)),
        row.status,
        row.kind === "processing" ? "" : String(Math.round(row.balance)),
      ].map(csvEscape).join(","),
    );
    downloadText(
      `icash-statement-${fileStamp}.csv`,
      [header.join(","), `opening,,,,,${Math.round(built.opening)}`, ...rows, `closing,,,,,${Math.round(built.closing)}`].join("\n"),
    );
  }

  function exportModel() {
    return {
      periodLabel: built.periodLabel,
      generatedAt: generatedStamp(),
      statementNo: `STMT-${fileStamp.replace(/-/g, "")}`,
      opening: built.opening,
      closing: built.closing,
      inflow: built.inflow,
      outflow: built.outflow,
      processing: built.processing,
      rows: built.rows,
    };
  }

  function exportPdf() {
    downloadStatementPdf(`icash-statement-${fileStamp}.pdf`, exportModel());
  }

  return (
    <section className="mt-1 space-y-4 md:mt-4">
      <style>{`
        @media print {
          body { background: #070707 !important; }
          body * { visibility: hidden !important; }
          #icash-statement, #icash-statement * { visibility: visible !important; }
          #icash-statement { position: absolute; inset: 0; width: 100%; background: #0a0a0a !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print admin-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">{t("admin.stmtRange")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ranges.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRange(item.id)}
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
                  style={
                    range === item.id
                      ? { background: "var(--ad-gold)", color: "#14110c" }
                      : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => printStatement(exportModel())}
              className="inline-flex h-10 items-center rounded-xl border border-white/12 px-3.5 text-sm font-semibold text-white/80 hover:bg-white/5"
            >
              {t("admin.stmtPrint")}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-10 items-center rounded-xl border border-white/12 px-3.5 text-sm font-semibold text-white/80 hover:bg-white/5"
            >
              {t("admin.stmtCsv")}
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="inline-flex h-10 items-center rounded-xl bg-white px-3.5 text-sm font-semibold text-black hover:bg-white/90"
            >
              {t("admin.stmtPdf")}
            </button>
          </div>
        </div>
        {range === "custom" ? (
          <div className="mt-4 grid gap-3 sm:max-w-lg sm:grid-cols-2">
            <label className="text-xs text-white/45">
              {t("admin.stmtFrom")}
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="ad-input mt-1.5 h-11 w-full rounded-xl px-3 text-sm"
              />
            </label>
            <label className="text-xs text-white/45">
              {t("admin.stmtTo")}
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="ad-input mt-1.5 h-11 w-full rounded-xl px-3 text-sm"
              />
            </label>
          </div>
        ) : null}
      </div>

      <article id="icash-statement" className="overflow-hidden admin-card text-white">
        <header className="relative overflow-hidden border-b border-white/10 px-5 py-6 sm:px-7 sm:py-7">
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <BrandLogo size="sm" />
              <p className="ad-kicker mt-5 text-[11px] font-semibold uppercase tracking-[0.18em]">
                {t("admin.stmtEyebrow")}
              </p>
              <h2 className="mt-1 text-[clamp(1.5rem,4vw,2.2rem)] font-extrabold tracking-tight">{t("admin.stmtTitle")}</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/45">{t("admin.stmtLead")}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs sm:min-w-[240px]">
              <p className="font-semibold uppercase tracking-[0.14em] text-white/35">{t("admin.stmtPeriod")}</p>
              <p className="mt-1 font-mono text-sm font-semibold text-white">{built.periodLabel}</p>
              <p className="mt-2 text-white/40">iCash Exchange · Asia/Dhaka</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-px bg-white/[0.08] sm:grid-cols-4">
          <Stat label={t("admin.stmtOpening")} value={money(built.opening)} />
          <Stat label={t("admin.stmtInflow")} value={money(built.inflow)} tone="in" />
          <Stat label={t("admin.stmtOutflow")} value={money(built.outflow)} tone="out" />
          <Stat label={t("admin.stmtClosing")} value={money(built.closing)} />
        </div>

        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
              {t("admin.stmtLedger")} · {built.rows.length}
            </p>
            <p className="text-[11px] text-white/35">
              {t("admin.stmtProcessing")}: {built.processing}
            </p>
          </div>

          {built.rows.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/12 px-4 py-10 text-center text-sm text-white/40">
              {t("admin.stmtEmpty")}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {built.rows.map((row) => (
                <li key={row.id} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold tracking-tight text-white">{row.title}</p>
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                          style={
                            row.kind === "inflow"
                              ? { background: "rgba(52,211,153,0.12)", color: "#6ee7b7" }
                              : row.kind === "outflow"
                                ? { background: "rgba(232,160,166,0.14)", color: "var(--ad-rose)" }
                                : { background: "rgba(251,191,36,0.12)", color: "#fcd34d" }
                          }
                        >
                          {row.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-white/45">
                        {row.party} · {row.method} · {row.ref}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-white/35">{stamp(row.at)}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-extrabold tabular-nums ${
                          row.kind === "inflow"
                            ? "text-emerald-300"
                            : row.kind === "outflow"
                              ? "ad-warn"
                              : "text-amber-200"
                        }`}
                      >
                        {row.kind === "inflow" ? "+" : row.kind === "outflow" ? "−" : ""}
                        {money(row.amount)}
                      </p>
                      {row.kind !== "processing" ? (
                        <p className="mt-1 text-[11px] font-semibold text-white/40">
                          {t("admin.stmtBalance")}: {money(row.balance)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </article>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "in" | "out" }) {
  return (
    <div className="ad-cell px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">{label}</p>
      <p
        className={`mt-1 break-words text-lg font-extrabold tabular-nums sm:text-xl ${
          tone === "in" ? "ad-mint" : tone === "out" ? "ad-warn" : "text-[var(--ad-ink)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
