"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useT } from "@/i18n/provider";
import { formatBdt } from "@/lib/format";
import { confirmReceived, notifyError } from "@/lib/swal";
import { tokenPackByPrice } from "@/lib/token-packs";
import type { AdminSnapshot } from "@/lib/types";

type SellRow = {
  id: string;
  number: string;
  name: string;
  email: string;
  phone: string;
  faceValue: number;
  payout: number;
  method: string;
  payoutNumber: string;
  status: string;
  createdAt: string;
};

const PAY_LABEL: Record<string, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  bank: "Bank",
};

const PAY_LOGO: Record<string, string> = {
  bkash: "/payments/bkash.png",
  nagad: "/payments/nagad.png",
  rocket: "/payments/rocket.png",
  bank: "/payments/bank.png",
};

type Receipt = {
  kind: "buy" | "sell";
  id: string;
  number: string;
  at: string;
  status: string;
  amount: number;
  method?: string;
  trx?: string;
  fromNumber?: string;
  toNumber?: string;
  email: string;
  hasProof: boolean;
  tokens?: number;
  title: string;
  canDecide: boolean;
};

async function post(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : "{}",
  });
  const data = (await response.json()) as {
    error?: { message?: string };
    message?: string;
    codes?: string[];
    via?: string;
    email?: string;
    masked?: string[];
  };
  if (!response.ok) throw new Error(data.error?.message ?? "The desk refused that action");
  return data;
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function stamp(iso: string) {
  const at = new Date(iso);
  const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(at);
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(at);
  return { day, time };
}

function methodLabel(id?: string) {
  if (!id) return "Desk";
  return PAY_LABEL[id] ?? id;
}

function badge(status: string) {
  if (status === "DELIVERED" || status === "PAID") return { label: "Approved", tone: "ok" as const };
  if (status === "REVIEWING" || status === "OPEN") return { label: "Pending", tone: "wait" as const };
  if (status === "PENDING") return { label: "Hold", tone: "info" as const };
  if (status === "FAILED" || status === "REFUNDED" || status === "REJECTED") return { label: "Rejected", tone: "bad" as const };
  return { label: status, tone: "info" as const };
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function matchesFilter(row: Receipt, filter: StatusFilter) {
  if (filter === "all") return true;
  const mark = badge(row.status).tone;
  if (filter === "pending") return mark === "wait" || mark === "info";
  if (filter === "approved") return mark === "ok";
  return mark === "bad";
}

export function OrderReceipts({
  snapshot,
  sells,
  busy,
  onRun,
  withFilters = false,
  onSettled,
}: {
  snapshot: AdminSnapshot;
  sells: SellRow[];
  busy: boolean;
  onRun: (action: () => Promise<string>) => Promise<void>;
  withFilters?: boolean;
  onSettled?: (data: { codes?: string[]; masked?: string[]; via?: string; email?: string }) => void;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [proofId, setProofId] = useState<string | null>(null);

  const receipts = useMemo(() => {
    const rows: Receipt[] = snapshot.orders.map((order) => {
      const named = /^(\d+)\s+tokens$/i.exec(order.name ?? order.title ?? "");
      const pack = named ? { tokens: Number(named[1]) } : tokenPackByPrice(order.voucher);
      return {
        kind: "buy",
        id: order.id,
        number: order.number,
        at: order.createdAt,
        status: order.status,
        amount: order.total,
        method: order.paymentMethod,
        trx: order.transactionId,
        fromNumber: order.phone,
        toNumber: order.depositNumber || undefined,
        email: order.email,
        hasProof: order.hasProof,
        tokens: pack?.tokens,
        title: order.title,
        canDecide: order.status === "REVIEWING",
      };
    });
    for (const sale of sells) {
      rows.push({
        kind: "sell",
        id: sale.id,
        number: sale.number,
        at: sale.createdAt,
        status: sale.status,
        amount: sale.payout,
        method: sale.method,
        fromNumber: sale.phone,
        toNumber: sale.payoutNumber,
        email: sale.email,
        hasProof: false,
        title: sale.name,
        canDecide: sale.status === "OPEN",
      });
    }
    rows.sort((a, b) => +new Date(b.at) - +new Date(a.at));
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (withFilters && !matchesFilter(row, filter)) return false;
      if (!q) return true;
      return (
        row.email.toLowerCase().includes(q) ||
        row.number.toLowerCase().includes(q) ||
        (row.trx ?? "").toLowerCase().includes(q) ||
        (row.fromNumber ?? "").includes(q) ||
        (row.toNumber ?? "").includes(q)
      );
    });
  }, [filter, query, sells, snapshot.orders, withFilters]);

  const chips: Array<{ id: StatusFilter; label: string }> = [
    { id: "all", label: t("admin.histAll") },
    { id: "pending", label: t("admin.histPending") },
    { id: "approved", label: t("admin.histApproved") },
    { id: "rejected", label: t("admin.histRejected") },
  ];

  return (
    <section className={withFilters ? "space-y-4" : "mt-1 space-y-4 md:mt-4"}>
      <div className="admin-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-sm font-semibold text-white/70">
            {t("admin.orderCount", { n: String(receipts.length) })}
          </p>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("admin.histSearch")}
            className="ad-input h-11 w-full rounded-xl px-3 text-sm placeholder:text-white/30 sm:ml-auto sm:max-w-sm"
          />
        </div>
        {withFilters ? (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setFilter(chip.id)}
                className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold"
                style={
                  filter === chip.id
                    ? { background: "#fff", color: "#09090b" }
                    : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }
                }
              >
                {chip.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {receipts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/12 px-4 py-12 text-center text-sm text-white/40">
          {t("admin.ordersEmpty")}
        </p>
      ) : (
        <ul className="grid grid-cols-1 items-start gap-[0.6rem] lg:grid-cols-2 lg:gap-4">
          {receipts.map((row) => (
            <li key={`${row.kind}-${row.id}`}>
              <ReceiptCard
                row={row}
                busy={busy}
                onProof={() => {
                  if (!row.hasProof) {
                    void notifyError(t("admin.noScreenshot"), t("admin.ordersNoProof"));
                    return;
                  }
                  setProofId(row.id);
                }}
                onApprove={() =>
                  void confirmAndRun(row, t, () =>
                    onRun(async () => {
                      if (row.kind === "sell") {
                        await post(`/api/admin/sells/${row.id}/settle`, { status: "PAID" });
                        return t("admin.ordersSellPaid");
                      }
                      const data = await post(`/api/admin/orders/${row.id}/approve`);
                      onSettled?.(data);
                      return data.message ?? t("admin.noticeSent", { email: row.email });
                    }),
                  )
                }
                onReject={() =>
                  void onRun(async () => {
                    if (row.kind === "sell") {
                      await post(`/api/admin/sells/${row.id}/settle`, { status: "REJECTED" });
                      return t("admin.ordersSellRejected");
                    }
                    await post(`/api/admin/orders/${row.id}/release`);
                    return t("admin.reject");
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}

      {proofId ? <ProofModal orderId={proofId} onClose={() => setProofId(null)} /> : null}
    </section>
  );
}

async function confirmAndRun(
  row: Receipt,
  t: ReturnType<typeof useT>,
  action: () => Promise<void>,
) {
  const method = `${methodLabel(row.method)} ${row.kind === "sell" ? t("admin.ordersPayout") : t("admin.ordersPay")}`;
  const ok = await confirmReceived({
    title: t("admin.ordersConfirmTitle"),
    lead: t(row.kind === "sell" ? "admin.ordersConfirmSell" : "admin.ordersConfirmLead", {
      method: methodLabel(row.method),
    }),
    method,
    trxId: row.trx || row.toNumber || row.number,
    next: t("admin.ordersNext"),
    yes: t("admin.ordersYes"),
    close: t("admin.ordersClose"),
    title2: t("admin.ordersConfirmTitle2"),
    lead2: t("admin.ordersConfirmLead2"),
  });
  if (ok) await action();
}

function ReceiptCard({
  row,
  busy,
  onProof,
  onApprove,
  onReject,
}: {
  row: Receipt;
  busy: boolean;
  onProof: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const mark = badge(row.status);
  const logo = row.method ? PAY_LOGO[row.method] : undefined;
  const payName = `${methodLabel(row.method)} ${row.kind === "sell" ? t("admin.ordersPayout") : t("admin.ordersPay")}`;
  const kindLabel = row.kind === "sell" ? t("admin.ordersSell") : t("admin.ordersBuy");
  const product =
    row.tokens != null
      ? t("admin.ordersTokens", { n: String(row.tokens) })
      : t("admin.ordersDirect");

  const when = stamp(row.at);

  return (
    <article className="overflow-hidden admin-card">
      <div className="px-4 pt-4">
        <div className="flex items-start gap-2.5">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
            {logo ? (
              <Image src={logo} alt="" width={32} height={32} className="h-7 w-7 object-contain" />
            ) : (
              <span className="text-[11px] font-extrabold text-black">{methodLabel(row.method).slice(0, 2)}</span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[14px] font-bold leading-tight tracking-tight text-white sm:text-[15px]">{payName}</p>
                <p className="ad-kicker mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em]">{kindLabel}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-[16px] font-extrabold tabular-nums leading-none sm:text-[17px] ${row.kind === "sell" ? "ad-warn" : "ad-mint"}`}>
                  {row.kind === "sell" ? "−" : "+"}
                  {formatBdt(row.amount)}
                </p>
                <span
                  className="mt-1.5 inline-flex rounded-full px-2 py-[2px] text-[9px] font-bold uppercase tracking-[0.08em]"
                  style={
                    mark.tone === "ok"
                      ? { background: "rgba(16,185,129,0.16)", color: "#6ee7b7" }
                      : mark.tone === "wait"
                        ? { background: "rgba(251,191,36,0.16)", color: "#fcd34d" }
                        : mark.tone === "bad"
                          ? { background: "rgba(225,29,46,0.18)", color: "#fb7185" }
                          : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)" }
                  }
                >
                  {mark.label}
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 inline-flex rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-white/55">
          {product}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 px-4 sm:gap-x-6">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">{t("admin.ordersDate")}</p>
          <p className="mt-1 text-[12px] font-semibold leading-snug text-white/90 sm:text-[13px]">
            {when.day}
            <span className="text-white/45"> · {when.time}</span>
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">{t("admin.ordersTo")}</p>
          <p className="mt-1 whitespace-nowrap font-mono text-[16px] font-extrabold leading-none text-white sm:text-[18px]">
            {row.toNumber || "—"}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">{t("admin.ordersTrx")}</p>
          <p className="mt-1 truncate text-[13px] font-semibold text-white/90">{row.trx || "—"}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">{t("admin.ordersFrom")}</p>
          <p className="mt-1 whitespace-nowrap font-mono text-[13px] font-semibold text-white/80">{row.fromNumber || "—"}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 px-4">
        <p className="min-w-0 flex-1 truncate text-[13px] text-white/70">{row.email}</p>
        <button
          type="button"
          onClick={() =>
            void copyText(row.email).then((ok) => {
              if (!ok) return;
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1200);
            })
          }
          className="inline-flex h-7 shrink-0 items-center rounded-md bg-white/[0.07] px-2.5 text-[11px] font-semibold text-white/70 hover:bg-white/[0.12]"
        >
          {copied ? t("admin.copy") : t("admin.ordersCopy")}
        </button>
        <button
          type="button"
          onClick={onProof}
          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
            row.hasProof ? "text-white/60 hover:bg-white/[0.08]" : "text-white/20"
          }`}
          aria-label={t("admin.noticeShot")}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <path strokeLinecap="round" d="M4 7h3l1.2-2h7.6L17 7h3v12H4V7z" />
            <circle cx="12" cy="13" r="3.2" />
          </svg>
        </button>
      </div>

      <p className="mt-1 px-4 font-mono text-[11px] text-white/30">{row.number}</p>

      {row.canDecide ? (
        <div className="mt-3 grid grid-cols-2 gap-2 px-4 pb-4">
          <button
            type="button"
            disabled={busy}
            onClick={onReject}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-white/[0.05] text-sm font-semibold text-white/70 hover:bg-white/[0.08] disabled:opacity-40"
          >
            {t("admin.reject")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onApprove}
            className="ad-btn h-9 text-sm"
          >
            {t("admin.ordersApprove")}
          </button>
        </div>
      ) : (
        <div className="px-4 pb-4 pt-3">
          <p className="rounded-xl bg-white/[0.045] py-[9px] text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
            {mark.label}
          </p>
        </div>
      )}
    </article>
  );
}

function ProofModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
      <div
        className="admin-card relative w-full max-w-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-sm font-semibold">{t("admin.noticeShot")}</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/5"
            aria-label={t("admin.ordersClose")}
          >
            ×
          </button>
        </div>
        <div className="bg-black p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/admin/orders/${orderId}/proof`} alt="" className="mx-auto max-h-[70vh] w-auto max-w-full rounded-xl object-contain" />
        </div>
      </div>
    </div>
  );
}
