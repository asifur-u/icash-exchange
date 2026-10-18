"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DeskConfirmModal } from "@/components/desk-confirm-modal";
import { deskBreakdown } from "@/lib/desk-fee";
import {
  convertFromBdt,
  convertToBdt,
  DESK_RATES,
  formatDeskMoney,
  getDeskRate,
  pairRateLabel,
  parseDeskMoney,
  type DeskCurrency,
} from "@/lib/desk-rates";
import { useT } from "@/i18n/provider";
import { formatBdt } from "@/lib/format";
import type { PublicProduct } from "@/lib/types";

type PickerTarget = "choose" | "pay" | null;
type AmountField = "choose" | "pay" | null;

function CoinMark({ symbol }: { symbol: string }) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(160deg,#2a2a2a_0%,#0a0a0a_55%,#1c1c1c_100%)] text-[1.05rem] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_6px_14px_rgba(0,0,0,0.2)] sm:h-11 sm:w-11"
    >
      <span className="pointer-events-none absolute inset-[2px] rounded-full ring-1 ring-white/10" />
      <span className="relative">{symbol}</span>
    </span>
  );
}

function Chevron({ open = false }: { open?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={`h-3 w-3 text-black/40 transition ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M2.5 4.5L6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CurrencyMenu({
  active,
  onPick,
}: {
  active: DeskCurrency;
  onPick: (code: DeskCurrency) => void;
}) {
  return (
    <div
      role="listbox"
      aria-label="Currencies"
      className="absolute inset-x-0 top-[calc(100%+0.45rem)] z-40 overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.16)]"
    >
      {DESK_RATES.map((rate) => {
        const selected = rate.code === active;
        return (
          <button
            key={rate.code}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onPick(rate.code)}
            className={`flex w-full items-center gap-3 px-3.5 py-3.5 text-left transition ${
              selected ? "bg-black/[0.04]" : "hover:bg-black/[0.025]"
            }`}
          >
            <CoinMark symbol={rate.symbol} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-black">
                {rate.code}
                <span className="ml-1.5 font-normal text-black/35">{rate.symbol}</span>
              </span>
              <span className="block text-xs text-black/40">{rate.rateLabel}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function resolveCheckout(bdtAmount: number, products: PublicProduct[]) {
  const available = products.filter((product) => product.stock > 0);
  if (!available.length) return null;

  let best: { product: PublicProduct; qty: number; diff: number } | null = null;
  for (const product of available) {
    const maxQty = Math.min(5, product.stock);
    for (let qty = 1; qty <= maxQty; qty += 1) {
      const total = product.price * qty;
      const diff = Math.abs(total - bdtAmount);
      const better =
        !best ||
        diff < best.diff ||
        (diff === best.diff && qty < best.qty) ||
        (diff === best.diff && qty === best.qty && product.faceValue > best.product.faceValue);
      if (better) best = { product, qty, diff };
    }
  }
  return best;
}

export function AccountDeskConverter({ products }: { products: PublicProduct[] }) {
  const t = useT();
  const router = useRouter();
  const house = products.find((product) => product.slug === "note-1000") ?? products[0];
  const [bdtAmount, setBdtAmount] = useState(house?.price ?? 1000);
  const [chooseCurrency, setChooseCurrency] = useState<DeskCurrency>("BDT");
  const [payCurrency, setPayCurrency] = useState<DeskCurrency>("BDT");
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [editing, setEditing] = useState<AmountField>(null);
  const [chooseDraft, setChooseDraft] = useState("");
  const [payDraft, setPayDraft] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const chooseRate = getDeskRate(chooseCurrency);
  const payRate = getDeskRate(payCurrency);
  const chooseValue = convertFromBdt(bdtAmount, chooseCurrency);
  const payValue = convertFromBdt(bdtAmount, payCurrency);
  const rateLabel = pairRateLabel(chooseCurrency, payCurrency);
  const order = useMemo(() => resolveCheckout(bdtAmount, products), [bdtAmount, products]);
  const selected = order?.product ?? null;
  const quantity = order?.qty ?? 1;
  const fees = deskBreakdown((selected?.price ?? 0) * quantity);
  const href = selected
    ? `/account/checkout?product=${selected.slug}&qty=${quantity}`
    : "/account/services";

  useEffect(() => {
    if (editing === "choose") return;
    setChooseDraft(formatDeskMoney(chooseValue, chooseCurrency));
  }, [chooseValue, chooseCurrency, editing]);

  useEffect(() => {
    if (editing === "pay") return;
    setPayDraft(formatDeskMoney(payValue, payCurrency));
  }, [payValue, payCurrency, editing]);

  function commitAmount(raw: string, currency: DeskCurrency) {
    const parsed = parseDeskMoney(raw);
    if (parsed == null) return;
    setBdtAmount(Math.max(0, Number(convertToBdt(parsed, currency).toFixed(4))));
  }

  function pickCurrency(code: DeskCurrency) {
    if (picker === "choose") setChooseCurrency(code);
    if (picker === "pay") setPayCurrency(code);
    setPicker(null);
  }

  function swapCurrencies() {
    setChooseCurrency(payCurrency);
    setPayCurrency(chooseCurrency);
    setPicker(null);
  }

  return (
    <section className="al-card overflow-hidden" style={{ color: "#09090b" }}>
      {/* Dark stage — same energy as homepage desk */}
      <div className="relative overflow-hidden bg-[#0a0a0a] px-5 pb-14 pt-6 sm:px-7 sm:pb-16 sm:pt-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(225,29,46,0.35), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 30%, rgba(255,255,255,0.08), transparent 50%)",
          }}
        />
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ff5a67]">
          {t("account.converterEyebrow")}
        </p>
        <h2 className="relative mt-2 text-[clamp(1.5rem,4vw,2rem)] font-extrabold tracking-tight text-white">
          {t("account.converterTitle")}
        </h2>
        <p className="relative mt-2 max-w-lg text-sm leading-relaxed text-white/55">
          {t("account.converterLead")}
        </p>
      </div>

      {/* Floating converter panel */}
      <div className="relative z-10 -mt-10 px-3 pb-4 sm:-mt-12 sm:px-5 sm:pb-6">
        <div className="mx-auto max-w-xl overflow-hidden rounded-[22px] border border-black/[0.06] bg-white px-3.5 py-5 shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:rounded-[26px] sm:px-6 sm:py-7">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/35">
              {t("desk.youSend")}
            </p>
            <span className="rounded-full border border-black/[0.08] bg-[#f6f6f6] px-2.5 py-1 text-[11px] font-semibold text-black/55">
              {selected && selected.stock > 0 ? t("desk.protected") : t("desk.unavailable")}
            </span>
          </div>

          <div className="relative mt-4">
            <div className="flex items-center justify-between gap-2 rounded-[18px] border border-black/[0.07] bg-[linear-gradient(180deg,#fafafa_0%,#f1f1f1_100%)] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:px-4 sm:py-3.5">
              <button
                type="button"
                aria-expanded={picker === "choose"}
                onClick={() => setPicker((v) => (v === "choose" ? null : "choose"))}
                className="inline-flex items-center gap-2.5"
              >
                <CoinMark symbol={chooseRate.symbol} />
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-black">
                  {chooseRate.code}
                  <Chevron open={picker === "choose"} />
                </span>
              </button>
              <input
                inputMode="decimal"
                value={chooseDraft}
                onFocus={() => {
                  setEditing("choose");
                  setPicker(null);
                  setChooseDraft(formatDeskMoney(chooseValue, chooseCurrency));
                }}
                onChange={(event) => {
                  setChooseDraft(event.target.value);
                  const parsed = parseDeskMoney(event.target.value);
                  if (parsed != null) {
                    setBdtAmount(Math.max(0, Number(convertToBdt(parsed, chooseCurrency).toFixed(4))));
                  }
                }}
                onBlur={() => {
                  commitAmount(chooseDraft, chooseCurrency);
                  setEditing(null);
                }}
                className="w-full min-w-0 bg-transparent text-right text-[1.55rem] font-bold tracking-tight text-black outline-none sm:text-[2rem]"
                placeholder="0"
              />
            </div>
            {picker === "choose" ? <CurrencyMenu active={chooseCurrency} onPick={pickCurrency} /> : null}
          </div>

          <div className="relative z-20 my-1.5 flex items-center justify-center py-1">
            <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-black/10 to-transparent" />
            <button
              type="button"
              aria-label="Swap currencies"
              onClick={swapCurrencies}
              className="relative inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition hover:border-black/20"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                ↺
              </span>
              <span className="text-[12px] font-semibold text-black/70 sm:text-[13px]">{rateLabel}</span>
            </button>
          </div>

          <div className="relative">
            <div className="rounded-[18px] border border-black/[0.07] bg-[linear-gradient(180deg,#fafafa_0%,#f1f1f1_100%)] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:px-4 sm:py-3.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/35">
                {t("desk.youPay")}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  aria-expanded={picker === "pay"}
                  onClick={() => setPicker((v) => (v === "pay" ? null : "pay"))}
                  className="inline-flex items-center gap-2.5"
                >
                  <CoinMark symbol={payRate.symbol} />
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-black">
                    {payRate.code}
                    <Chevron open={picker === "pay"} />
                  </span>
                </button>
                <input
                  inputMode="decimal"
                  value={payDraft}
                  onFocus={() => {
                    setEditing("pay");
                    setPicker(null);
                    setPayDraft(formatDeskMoney(payValue, payCurrency));
                  }}
                  onChange={(event) => {
                    setPayDraft(event.target.value);
                    const parsed = parseDeskMoney(event.target.value);
                    if (parsed != null) {
                      setBdtAmount(Math.max(0, Number(convertToBdt(parsed, payCurrency).toFixed(4))));
                    }
                  }}
                  onBlur={() => {
                    commitAmount(payDraft, payCurrency);
                    setEditing(null);
                  }}
                  className="w-full min-w-0 bg-transparent text-right text-[1.55rem] font-bold tracking-tight text-black outline-none sm:text-[2rem]"
                  placeholder="0"
                />
              </div>
              {payCurrency !== "BDT" ? (
                <p className="mt-2 text-[11px] font-medium text-black/40">
                  {t("desk.settlesIn", { amount: formatBdt(Math.round(bdtAmount)) })}
                </p>
              ) : null}
            </div>
            {picker === "pay" ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-40 sm:right-auto sm:w-[21rem]">
                <CurrencyMenu active={payCurrency} onPick={pickCurrency} />
              </div>
            ) : null}
          </div>

          <div className="mt-5 space-y-3.5 border-t border-black/[0.07] pt-5 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-black">{t("desk.arrives")}</p>
                <p className="mt-0.5 text-xs text-black/40">{t("desk.arrivesAfter")}</p>
              </div>
              <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-semibold text-black/70">
                {t("desk.usuallyMinutes")}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-black">{t("desk.deskFeeLabel")}</p>
                <p className="mt-0.5 text-xs text-black/40">
                  {t("desk.feeAddedOnTop", { amount: formatBdt(fees.total) })}
                </p>
              </div>
              <span className="text-xs font-semibold tabular-nums text-black/70">
                ৳{fees.fee.toLocaleString("en-IN")}
              </span>
            </div>
            {selected ? (
              <p className="text-xs text-black/45">
                {selected.title} × {quantity} · {formatBdt(fees.total)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            disabled={!selected || selected.stock < 1}
            onClick={() => setConfirmOpen(true)}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#e11d2e] text-sm font-semibold text-white shadow-[0_14px_34px_rgba(225,29,46,0.28)] transition hover:bg-[#c41828] disabled:cursor-not-allowed disabled:opacity-40 sm:h-[3.4rem]"
          >
            {t("desk.continue")}
          </button>

          <DeskConfirmModal
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            loggedIn
            productTitle={selected?.title ?? "Note"}
            quantity={quantity}
            voucher={fees.voucher}
            fee={fees.fee}
            total={fees.total}
            onConfirm={() => {
              setConfirmOpen(false);
              router.push(href);
            }}
          />
        </div>
      </div>
    </section>
  );
}
