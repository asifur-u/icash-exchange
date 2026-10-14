"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BuyGate } from "@/components/buy-gate";
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
import { formatBdt } from "@/lib/format";
import type { PublicProduct } from "@/lib/types";

type PickerTarget = "choose" | "pay" | null;
type AmountField = "choose" | "pay" | null;

function CoinMark({
  symbol,
  className = "",
}: {
  symbol: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(160deg,#2a2a2a_0%,#0a0a0a_55%,#1c1c1c_100%)] text-[1.05rem] font-semibold leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_6px_14px_rgba(0,0,0,0.28)] ring-1 ring-black/40 sm:h-11 sm:w-11 sm:text-[1.1rem] ${className}`}
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
      className={`h-3 w-3 text-black/40 transition duration-200 ${open ? "rotate-180" : ""}`}
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
      className="absolute inset-x-0 top-[calc(100%+0.45rem)] z-40 overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
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
            <CoinMark symbol={rate.symbol} className="!h-9 !w-9 !text-[0.95rem]" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-black">
                {rate.code}
                <span className="ml-1.5 font-normal text-black/35">{rate.symbol}</span>
              </span>
              <span className="block text-xs text-black/40">{rate.rateLabel}</span>
            </span>
            {selected ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45">
                Active
              </span>
            ) : null}
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

export function VoucherDesk({
  products,
  loggedIn = false,
}: {
  products: PublicProduct[];
  loggedIn?: boolean;
}) {
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
  const selected = order?.product ?? house;
  const quantity = order?.qty ?? 1;
  const voucherTotal = selected ? selected.price * quantity : 0;
  const fees = useMemo(() => deskBreakdown(voucherTotal), [voucherTotal]);

  useEffect(() => {
    if (editing !== "choose") {
      setChooseDraft(formatDeskMoney(chooseValue, chooseCurrency));
    }
  }, [chooseValue, chooseCurrency, editing]);

  useEffect(() => {
    if (editing !== "pay") {
      setPayDraft(formatDeskMoney(payValue, payCurrency));
    }
  }, [payValue, payCurrency, editing]);

  const href = useMemo(() => {
    if (!selected || selected.stock < 1) return "/catalog";
    return `/checkout?product=${selected.slug}&qty=${quantity}`;
  }, [selected, quantity]);

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

  function commitAmount(raw: string, code: DeskCurrency) {
    const parsed = parseDeskMoney(raw);
    if (parsed == null || parsed < 0) return;
    const nextBdt = Math.max(0, convertToBdt(parsed, code));
    setBdtAmount(Number(nextBdt.toFixed(4)));
  }

  if (!house) {
    return (
      <div className="rounded-[28px] border border-white/12 bg-[#0c0c0c] p-8">
        <p className="text-2xl font-semibold tracking-tight">The desk is empty.</p>
      </div>
    );
  }

  return (
    <div
      id="desk"
      className="relative w-full max-w-full overflow-hidden rounded-[26px] border border-white/[0.14] bg-[#0b0b0b] shadow-[0_50px_120px_rgba(0,0,0,0.55)] sm:rounded-[34px]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.07),transparent_42%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
      />

      <div className="relative px-4 pb-[3.75rem] pt-6 sm:px-8 sm:pb-[5.25rem] sm:pt-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
            iCash desk
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Live
          </span>
        </div>
        <h2 className="display mt-4 text-[clamp(1.35rem,5.4vw,1.9rem)] leading-[0.92] tracking-tight text-white">
          <span className="block">Pay securely with</span>
          <span className="block">iCash vouchers</span>
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55 sm:text-[15px]">
          Enter an amount, pick a coin, and the desk exchanges both sides instantly. Payment settles
          in BDT after you confirm.
        </p>
        <Link
          href="/explore"
          className="ladder-power group relative mt-5 block max-w-md overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.1] to-white/[0.02] p-4 transition hover:border-white/30"
        >
          <div className="relative flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
              Loyalty ladder
            </p>
            <span className="ladder-power-explore inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-black">
              Explore
              <span aria-hidden="true" className="ladder-power-arrow">
                →
              </span>
            </span>
          </div>

          <p className="relative mt-2.5 text-[15px] font-semibold leading-snug tracking-tight text-white">
            Unlock Silver at ৳1 lakh
          </p>
          <p className="relative mt-1 text-xs leading-relaxed text-white/50">
            Then climb Gold → Platinum → Diamond. Animated rewards wait inside.
          </p>

          {/* Mini rising bars — obvious power loop */}
          <div
            aria-hidden="true"
            className="relative mt-3.5 flex h-11 items-end gap-1.5 rounded-xl border border-white/10 bg-black/30 px-2.5 pb-2 pt-1.5"
          >
            {[28, 48, 68, 100].map((h, i) => (
              <span
                key={h}
                className="ladder-power-bar block w-full rounded-t-sm bg-gradient-to-t from-white/50 to-white"
                style={{
                  height: `${h}%`,
                  animationDelay: `${i * 0.22}s`,
                }}
              />
            ))}
          </div>

          <div className="relative mt-2.5 h-px overflow-hidden rounded-full bg-white/10">
            <span className="ladder-power-line block h-full w-full bg-gradient-to-r from-white/20 via-white to-white/20" />
          </div>

          <div className="relative mt-2.5 flex flex-wrap gap-1.5">
            {["Silver", "Gold", "Platinum", "Diamond"].map((tier, i) => (
              <span
                key={tier}
                className="ladder-power-chip rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                style={{ animationDelay: `${i * 0.35}s` }}
              >
                {tier}
              </span>
            ))}
          </div>
        </Link>
      </div>

      <div className="relative z-10 -mt-10 px-2.5 pb-2.5 sm:-mt-12 sm:px-4 sm:pb-4">
        <div className="relative overflow-hidden rounded-[22px] border border-black/[0.06] bg-white px-3.5 py-5 text-black shadow-[0_30px_70px_rgba(0,0,0,0.38),0_2px_0_rgba(255,255,255,0.65)_inset] sm:rounded-[26px] sm:px-6 sm:py-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent"
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/35">
              You send exactly
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-[#f6f6f6] px-2.5 py-1 text-[11px] font-semibold tracking-tight text-black/55">
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3 fill-current">
                <path d="M8 1.5a3.5 3.5 0 00-3.5 3.5v1.2H4a1.5 1.5 0 00-1.5 1.5v5.3A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V7.7A1.5 1.5 0 0012 6.2h-.5V5A3.5 3.5 0 008 1.5zm-2 3.5a2 2 0 114 0v1.2H6V5z" />
              </svg>
              {selected && selected.stock > 0 ? "Protected" : "Unavailable"}
            </span>
          </div>

          {/* Choose row — coin + editable amount */}
          <div className="relative mt-4">
            <div className="flex w-full min-w-0 items-center justify-between gap-2 rounded-[18px] border border-black/[0.07] bg-[linear-gradient(180deg,#fafafa_0%,#f1f1f1_100%)] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:gap-3 sm:px-4 sm:py-3.5">
              <button
                type="button"
                aria-expanded={picker === "choose"}
                aria-haspopup="listbox"
                onClick={() => setPicker((value) => (value === "choose" ? null : "choose"))}
                className="inline-flex min-w-0 items-center gap-2.5 sm:gap-3"
              >
                <CoinMark symbol={chooseRate.symbol} />
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-sm font-semibold tracking-tight text-black sm:text-[1.05rem]">
                    {chooseRate.code}
                  </span>
                  <Chevron open={picker === "choose"} />
                </span>
              </button>
              <label className="min-w-0 flex-1 text-right">
                <span className="sr-only">Choose amount</span>
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
                  className="display-soft w-full min-w-0 bg-transparent text-right text-[1.55rem] leading-none tracking-tight text-black outline-none placeholder:text-black/25 sm:text-[2rem]"
                  placeholder="0"
                />
              </label>
            </div>
            {picker === "choose" ? (
              <CurrencyMenu active={chooseCurrency} onPick={pickCurrency} />
            ) : null}
          </div>

          {/* Rate bridge */}
          <div className="relative z-20 my-1.5 flex items-center justify-center py-1">
            <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-black/10 to-transparent" />
            <button
              type="button"
              aria-label="Swap currencies"
              onClick={swapCurrencies}
              className="relative inline-flex max-w-[calc(100%-0.5rem)] items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-left shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition hover:border-black/20"
            >
              <span
                aria-hidden="true"
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white"
              >
                ↺
              </span>
              <span className="truncate text-[11px] font-semibold tracking-tight text-black/70 sm:text-[13px]">
                {rateLabel}
              </span>
            </button>
          </div>

          {/* Pay row — coin + editable amount */}
          <div className="relative">
            <div className="rounded-[18px] border border-black/[0.07] bg-[linear-gradient(180deg,#fafafa_0%,#f1f1f1_100%)] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:px-4 sm:py-3.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/35">
                You pay
              </p>
              <div className="mt-2 flex min-w-0 items-center justify-between gap-2 sm:gap-3">
                <button
                  type="button"
                  aria-expanded={picker === "pay"}
                  aria-haspopup="listbox"
                  aria-label="Change pay currency"
                  onClick={() => setPicker((value) => (value === "pay" ? null : "pay"))}
                  className="inline-flex min-w-0 items-center gap-2.5 sm:gap-3"
                >
                  <CoinMark symbol={payRate.symbol} />
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-sm font-semibold tracking-tight text-black sm:text-[1.05rem]">
                      {payRate.code}
                    </span>
                    <Chevron open={picker === "pay"} />
                  </span>
                </button>
                <label className="min-w-0 flex-1 text-right">
                  <span className="sr-only">Pay amount</span>
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
                    className="display-soft w-full min-w-0 bg-transparent text-right text-[1.55rem] leading-none tracking-tight text-black outline-none placeholder:text-black/25 sm:text-[2rem]"
                    placeholder="0"
                  />
                </label>
              </div>
              {payCurrency !== "BDT" ? (
                <p className="mt-2 text-[11px] font-medium text-black/40">
                  Settles in {formatBdt(Math.round(bdtAmount))}
                </p>
              ) : null}
            </div>
            {picker === "pay" ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-40 sm:left-0 sm:right-auto sm:w-[21rem]">
                <CurrencyMenu active={payCurrency} onPick={pickCurrency} />
              </div>
            ) : null}
          </div>

          <div className="mt-5 space-y-3.5 border-t border-black/[0.07] pt-5 text-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="flex min-w-0 items-start gap-2.5 text-black/65">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-black/50">
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
                    <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.25 4.75a.75.75 0 011.5 0v3.1l1.9 1.1a.75.75 0 11-.75 1.3l-2.3-1.33A.75.75 0 017.25 8V4.75z" />
                  </svg>
                </span>
                <span>
                  <span className="font-semibold text-black">Arrives on your order page</span>
                  <span className="mt-0.5 block text-xs text-black/40">
                    After the desk confirms the deposit
                  </span>
                </span>
              </p>
              <span className="shrink-0 rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-semibold text-black/70">
                Usually minutes
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <p className="flex min-w-0 items-start gap-2.5 text-black/65">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-black/50">
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
                    <path d="M4 1.5A1.5 1.5 0 002.5 3v10A1.5 1.5 0 004 14.5h8a1.5 1.5 0 001.5-1.5V5.06a1.5 1.5 0 00-.44-1.06L10.5 1.94A1.5 1.5 0 009.44 1.5H4zm5.5 1.06L12.44 5H10a.5.5 0 01-.5-.5V2.56zM5 8.25a.75.75 0 000 1.5h6a.75.75 0 000-1.5H5zm0 3a.75.75 0 000 1.5h4a.75.75 0 000-1.5H5z" />
                  </svg>
                </span>
                <span>
                  <span className="font-semibold text-black">Desk fee · 2.5%</span>
                  <span className="mt-0.5 block text-xs text-black/40">
                    Added on top · pay {formatBdt(fees.total)}
                  </span>
                </span>
              </p>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-black/70">
                ৳{fees.fee.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <BuyGate
              href={href}
              loggedIn={loggedIn}
              disabled={!selected || selected.stock < 1}
              label="Continue securely"
              onContinue={() => setConfirmOpen(true)}
              className="!h-12 !rounded-full !bg-black !text-[0.95rem] !font-semibold !tracking-tight !text-white shadow-[0_14px_34px_rgba(0,0,0,0.22)] transition hover:!bg-[#161616] sm:!h-[3.6rem] sm:!text-base"
            />
          </div>

          <DeskConfirmModal
            open={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            loggedIn={loggedIn}
            productTitle={selected?.title ?? "Note"}
            quantity={quantity}
            voucher={fees.voucher}
            fee={fees.fee}
            total={fees.total}
            onConfirm={() => {
              setConfirmOpen(false);
              if (!loggedIn) {
                try {
                  sessionStorage.setItem("icash_pending_buy", href);
                } catch {
                  /* ignore */
                }
                router.push("/auth?next=/account");
                return;
              }
              router.push(href);
            }}
          />

          <div className="mt-3 flex flex-col items-center gap-1.5 text-center">
            {!loggedIn && selected && selected.stock > 0 ? (
              <p className="text-xs text-black/40">Account required before checkout.</p>
            ) : null}
            <Link
              href="/catalog"
              className="text-xs font-semibold text-black/50 underline decoration-black/15 underline-offset-4 transition hover:text-black hover:decoration-black/40"
            >
              View catalog →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
