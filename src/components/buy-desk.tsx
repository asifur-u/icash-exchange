"use client";

import { useMemo, useState } from "react";
import { Frame } from "@/components/frame";
import { useT } from "@/i18n/provider";
import { deskBreakdown, deskPayout } from "@/lib/desk-fee";
import type { DepositAccount } from "@/lib/deposit";
import { formatBdt } from "@/lib/format";
import type { PublicProduct } from "@/lib/types";

type Step = 1 | 2 | 3 | 4 | 5;
type Intent = "buy" | "sell";

const field =
  "mt-2 h-14 w-full rounded-2xl border border-white/10 bg-black px-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-white/50";

export function BuyDesk({
  deposits,
  embedded = false,
}: {
  products: PublicProduct[];
  deposits: DepositAccount[];
  embedded?: boolean;
}) {
  const t = useT();
  const [intent, setIntent] = useState<Intent>("buy");
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(deposits[0]?.id ?? "bkash");
  const [trx, setTrx] = useState("");
  const [proof, setProof] = useState("");
  const [payoutNumber, setPayoutNumber] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [number, setNumber] = useState("");

  const typed = Number(amount.replace(/[^\d]/g, "")) || 0;
  const quote = useMemo(() => {
    if (typed <= 0) return null;
    return intent === "buy" ? deskBreakdown(typed) : deskPayout(typed);
  }, [typed, intent]);
  const account = deposits.find((item) => item.id === method) ?? deposits[0];
  const steps =
    intent === "buy"
      ? [t("buyForm.you"), t("buyForm.amount"), t("buyForm.pay"), t("buyForm.proof")]
      : [t("buyForm.you"), t("buyForm.amount"), t("buyForm.voucherCode")];

  function detailsOk() {
    return name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && /^01\d{9}$/.test(phone.trim());
  }

  function switchIntent(next: Intent) {
    setIntent(next);
    setStep(1);
    setAmount("");
    setVoucherCode("");
    setPayoutNumber("");
    setError("");
    setNumber("");
  }

  async function onFile(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Use a photo of the payment.");
      return;
    }
    if (file.size > 2_500_000) {
      setError("Screenshot is too large. Use one under 2.5 MB.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Could not read that photo."));
      reader.readAsDataURL(file);
    });
    setProof(dataUrl);
  }

  async function submit() {
    if (!quote || typed < 1) return;
    setBusy(true);
    setError("");
    try {
      const payload =
        intent === "buy"
          ? {
              intent,
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
          amount: typed,
          method,
          transactionId: trx.trim(),
              proofDataUrl: proof,
            }
          : {
              intent,
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
              amount: typed,
              method,
              payoutNumber: payoutNumber.trim(),
              voucherCode: voucherCode.trim(),
            };
      const response = await fetch("/api/desk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as {
        number?: string;
        message?: string;
        error?: { message?: string } | string;
      };
      const message = typeof body.error === "string" ? body.error : body.error?.message || body.message;
      if (!response.ok) throw new Error(message || "The desk could not take this request.");
      setNumber(body.number ?? "");
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The desk could not take this request.");
    } finally {
      setBusy(false);
    }
  }

  const payoutOk =
    method === "bank" ? payoutNumber.trim().length >= 6 : /^01\d{9}$/.test(payoutNumber.trim());
  const canSubmit =
    intent === "buy"
      ? trx.trim().length >= 4 && Boolean(proof)
      : voucherCode.trim().length >= 4 && payoutOk;

  const desk = (
        <div className={embedded ? "w-full" : "mx-auto max-w-[440px]"}>
          <div className="grid grid-cols-2 rounded-full border border-white/10 bg-white/[0.04] p-1">
            {(["buy", "sell"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => switchIntent(mode)}
                className={`h-11 rounded-full text-sm font-semibold tracking-tight transition ${
                  intent === mode ? "bg-white text-black" : "text-white/55 hover:text-white"
                }`}
              >
                {t(mode === "buy" ? "buyForm.buy" : "buyForm.sell")}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-[32px] border border-white/10 bg-[#0c0c0c] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">{t("buyForm.eyebrow")}</p>
            <h2 className="mt-3 text-[1.75rem] font-semibold tracking-tight text-white">
              {intent === "buy" ? t("buyForm.title") : t("buyForm.sellTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              {intent === "buy" ? t("buyForm.lead") : t("buyForm.sellLead")}
            </p>

            {step < 5 ? (
              <div className="mt-6">
                <div className={`grid gap-1.5 ${steps.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
                  {steps.map((label, index) => (
                    <span
                      key={label}
                      className={`h-1 rounded-full ${step > index ? "bg-white" : "bg-white/12"}`}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs font-medium text-white/50">
                  {step} / {steps.length} · {steps[step - 1]}
                </p>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="mt-6 space-y-4">
                <Field label={t("buyForm.name")}>
                  <input className={field} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
                </Field>
                <Field label={t("buyForm.email")}>
                  <input className={field} value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" />
                </Field>
                <Field label={t("buyForm.phone")}>
                  <input className={field} value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" inputMode="numeric" placeholder="01XXXXXXXXX" />
                </Field>
                <button type="button" disabled={!detailsOk()} onClick={() => setStep(2)} className="h-12 w-full rounded-full bg-white text-sm font-semibold text-black disabled:opacity-30">
                  {t("buyForm.next")}
                </button>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="mt-6 space-y-4">
                <Field label={t("buyForm.pickAmount")}>
                  <input
                    className="mt-2 h-24 w-full rounded-2xl border border-white/10 bg-black px-5 text-4xl font-semibold tracking-tight text-white outline-none placeholder:text-white/20 focus:border-white/50"
                    inputMode="numeric"
                    placeholder="1000"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ""))}
                  />
                </Field>
                {quote ? (
                  <div className="rounded-2xl border border-white/10 bg-black px-5 py-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                      {intent === "buy" ? t("buyForm.youSend") : t("buyForm.youReceive")}
                    </p>
                    <p className="mt-2 text-4xl font-semibold tracking-tight text-white">{formatBdt(quote.total)}</p>
                    <p className="mt-2 text-xs text-white/40">
                      {formatBdt(quote.voucher)} · {t("buyForm.fee", { percent: quote.feePercent })}
                    </p>
                  </div>
                ) : null}
                <Nav
                  back={t("buyForm.back")}
                  next={t("buyForm.next")}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                  nextDisabled={typed < 1}
                />
              </div>
            ) : null}

            {step === 3 && intent === "sell" && quote ? (
              <div className="mt-6 space-y-4">
                <Field label={t("buyForm.voucherCode")}>
                  <input
                    className="mt-2 h-16 w-full rounded-2xl border border-white/10 bg-black px-4 font-mono text-lg tracking-[0.08em] text-white outline-none placeholder:tracking-normal placeholder:text-white/20 focus:border-white/50"
                    value={voucherCode}
                    onChange={(event) => setVoucherCode(event.target.value)}
                    autoCapitalize="characters"
                    autoComplete="off"
                    placeholder="XXXX-XXXX-XXXX"
                  />
                </Field>
                <div>
                  <p className="text-[13px] font-medium text-white/70">{t("buyForm.receiveOn")}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {deposits.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMethod(item.id)}
                        className={`flex h-16 items-center gap-3 rounded-2xl border px-3 text-left transition ${
                          method === item.id ? "border-white bg-white text-black" : "border-white/10 text-white hover:border-white/30"
                        }`}
                      >
                        <img src={item.logo} alt="" className="h-8 w-8 rounded-lg object-contain" />
                        <span className="text-sm font-semibold">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Field label={t("buyForm.numberFor")}>
                  <input
                    className={field}
                    value={payoutNumber}
                    onChange={(event) => setPayoutNumber(event.target.value)}
                    inputMode={method === "bank" ? "text" : "numeric"}
                    placeholder={method === "bank" ? "Account number" : "01XXXXXXXXX"}
                    autoComplete="off"
                  />
                </Field>
                <div className="rounded-2xl border border-white/10 bg-black px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">{t("buyForm.youReceive")}</p>
                  <p className="mt-2 text-4xl font-semibold tracking-tight text-white">{formatBdt(quote.total)}</p>
                  <p className="mt-2 text-xs text-white/40">
                    {formatBdt(quote.voucher)} · {t("buyForm.fee", { percent: quote.feePercent })}
                  </p>
                </div>
                {error ? <p className="text-sm text-red-300">{error}</p> : null}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep(2)} className="h-12 flex-1 rounded-full border border-white/15 text-sm font-semibold text-white">
                    {t("buyForm.back")}
                  </button>
                  <button
                    type="button"
                    disabled={busy || !canSubmit}
                    onClick={() => void submit()}
                    className="h-12 flex-[1.6] rounded-full bg-white text-sm font-semibold text-black disabled:opacity-30"
                  >
                    {busy ? t("buyForm.sending") : t("buyForm.sellSubmit")}
                  </button>
                </div>
              </div>
            ) : null}

            {step === 3 && intent === "buy" && quote && account ? (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {deposits.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setMethod(item.id)}
                      className={`flex h-16 items-center gap-3 rounded-2xl border px-3 text-left transition ${
                        method === item.id ? "border-white bg-white text-black" : "border-white/10 text-white hover:border-white/30"
                      }`}
                    >
                      <img src={item.logo} alt="" className="h-8 w-8 rounded-lg object-contain" />
                      <span className="text-sm font-semibold">{item.label}</span>
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/10 bg-black px-5 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    {intent === "buy" ? t("buyForm.sendExactly") : t("buyForm.youReceive")}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-4xl font-semibold tracking-tight text-white">{formatBdt(quote.total)}</p>
                    <CopyChip value={String(quote.total)} label={t("buyForm.copy")} done={t("buyForm.copied")} />
                  </div>
                  {intent === "buy" ? (
                    <>
                      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">{t("buyForm.toAccount")}</p>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <p className="font-mono text-lg text-white">{account.number}</p>
                        <CopyChip value={account.number} label={t("buyForm.copy")} done={t("buyForm.copied")} />
                      </div>
                      <p className="text-sm text-white/45">{account.name}</p>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-white/45">{account.label}</p>
                  )}
                </div>
                <Nav back={t("buyForm.back")} next={t("buyForm.next")} onBack={() => setStep(2)} onNext={() => setStep(4)} />
              </div>
            ) : null}

            {step === 4 && intent === "buy" ? (
              <div className="mt-6 space-y-4">
                <Field label={t("buyForm.trx")}>
                  <input className={field} value={trx} onChange={(event) => setTrx(event.target.value)} autoCapitalize="characters" />
                </Field>
                <Field label={t("buyForm.shot")}>
                  <input className={`${field} py-3`} type="file" accept="image/*" onChange={(event) => void onFile(event.target.files?.[0])} />
                </Field>
                {error ? <p className="text-sm text-red-300">{error}</p> : null}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep(3)} className="h-12 flex-1 rounded-full border border-white/15 text-sm font-semibold text-white">
                    {t("buyForm.back")}
                  </button>
                  <button
                    type="button"
                    disabled={busy || !canSubmit}
                    onClick={() => void submit()}
                    className="h-12 flex-[1.6] rounded-full bg-white text-sm font-semibold text-black disabled:opacity-30"
                  >
                    {busy ? t("buyForm.sending") : intent === "buy" ? t("buyForm.submit") : t("buyForm.sellSubmit")}
                  </button>
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="mt-6">
                <p className="text-2xl font-semibold tracking-tight text-white">
                  {intent === "buy" ? t("buyForm.doneTitle") : t("buyForm.sellDone")}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/50">
                  {intent === "buy" ? t("buyForm.doneBody", { email }) : t("buyForm.sellDoneBody", { email })}
                </p>
                {number ? <p className="mt-4 font-mono text-sm text-white/70">{t("buyForm.order", { number })}</p> : null}
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setTrx("");
                    setProof("");
                    setVoucherCode("");
                    setNumber("");
                    setError("");
                  }}
                  className="mt-6 h-12 w-full rounded-full border border-white/15 text-sm font-semibold text-white"
                >
                  {t("buyForm.again")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
  );

  if (embedded) {
    return (
      <div id="buy" className="w-full scroll-mt-28">
        {desk}
      </div>
    );
  }

  return (
    <section id="buy" className="bg-black pb-28">
      <Frame>{desk}</Frame>
    </section>
  );
}

function CopyChip({ value, label, done }: { value: string; label: string; done: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (!ok) return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="h-9 shrink-0 rounded-full border border-white/15 px-3.5 text-xs font-semibold text-white transition hover:border-white/40"
    >
      {copied ? done : label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[13px] font-medium text-white/70">
      {label}
      {children}
    </label>
  );
}

function Nav({
  back,
  next,
  onBack,
  onNext,
  nextDisabled = false,
}: {
  back: string;
  next: string;
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <button type="button" onClick={onBack} className="h-12 flex-1 rounded-full border border-white/15 text-sm font-semibold text-white">
        {back}
      </button>
      <button type="button" disabled={nextDisabled} onClick={onNext} className="h-12 flex-[1.6] rounded-full bg-white text-sm font-semibold text-black disabled:opacity-30">
        {next}
      </button>
    </div>
  );
}
