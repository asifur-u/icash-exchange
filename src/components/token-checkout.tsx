"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Frame } from "@/components/frame";
import { useT } from "@/i18n/provider";
import { depositAccount, type PaymentMethodId } from "@/lib/deposit";
import { formatBdt } from "@/lib/format";
import type { TokenPack } from "@/lib/token-packs";

type Step = 1 | 2 | 3 | 4;
type Rail = "bkash" | "nagad";

const RAILS: Array<{
  id: Rail;
  label: string;
  color: string;
  glow: string;
  logo: string;
}> = [
  { id: "bkash", label: "bKash", color: "#E2136E", glow: "rgba(226,19,110,0.45)", logo: "/payments/bkash.png" },
  { id: "nagad", label: "Nagad", color: "#F47722", glow: "rgba(244,119,34,0.45)", logo: "/payments/nagad.png" },
];

const field =
  "mt-2 h-14 w-full rounded-2xl border border-white/10 bg-black px-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-white/50";

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
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
    return ok;
  }
}

export function TokenCheckout({ pack }: { pack: TokenPack }) {
  const t = useT();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<Rail | null>(null);
  const [trx, setTrx] = useState("");
  const [payer, setPayer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [number, setNumber] = useState("");
  const [copied, setCopied] = useState<"amount" | "wallet" | null>(null);

  const account = method ? depositAccount(method as PaymentMethodId) : null;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const payerOk = /^01\d{9}$/.test(payer.trim());
  const steps = [t("tokenCheckout.stepEmail"), t("tokenCheckout.stepPay"), t("tokenCheckout.stepProof")];

  const rail = useMemo(() => RAILS.find((item) => item.id === method) ?? null, [method]);

  async function copy(kind: "amount" | "wallet", value: string) {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  }

  async function submit() {
    if (!method || !payerOk || trx.trim().length < 4) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/desk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          intent: "token",
          email: email.trim(),
          tokens: pack.tokens,
          method,
          transactionId: trx.trim(),
          payerNumber: payer.trim(),
        }),
      });
      const body = (await response.json()) as {
        number?: string;
        message?: string;
        error?: { message?: string } | string;
      };
      const message = typeof body.error === "string" ? body.error : body.error?.message || body.message;
      if (!response.ok) throw new Error(message || "The desk could not take this request.");
      setNumber(body.number ?? "");
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The desk could not take this request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="relative overflow-x-clip bg-black pb-24 pt-[calc(5.5rem+env(safe-area-inset-top))] sm:pb-28 sm:pt-28">
      <Frame>
        <div className="mx-auto max-w-[560px]">
        <Link href="/" className="text-sm font-semibold text-white/45 transition hover:text-white">
          ← {t("tokenCheckout.home")}
        </Link>

        <div className="mt-6 overflow-hidden rounded-[32px] border border-white/10 bg-[#0c0c0c] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.45)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">{t("tokenCheckout.eyebrow")}</p>
          <h1 className="mt-3 text-[1.85rem] font-semibold tracking-tight text-white sm:text-[2.1rem]">{t("tokenCheckout.title")}</h1>

          <div className="mt-5 rounded-[24px] border border-white/12 bg-black px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">{t("tokenCheckout.locked")}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="flex items-baseline gap-2 text-white">
                <span className="text-[2.1rem] font-extrabold leading-none tracking-tight">{pack.tokens}</span>
                <span className="text-base font-semibold text-white/40">{t("tokenPacks.tokenName")}</span>
              </p>
              <p className="text-xl font-extrabold tabular-nums text-white">{formatBdt(pack.price)}</p>
            </div>
          </div>

          {step < 4 ? (
            <div className="mt-6">
              <div className="grid grid-cols-3 gap-1.5">
                {steps.map((label, index) => (
                  <span key={label} className={`h-1 rounded-full ${step > index ? "bg-white" : "bg-white/12"}`} />
                ))}
              </div>
              <p className="mt-3 text-xs font-medium text-white/50">
                {step} / 3 · {steps[step - 1]}
              </p>
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="email"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-6 space-y-4"
              >
                <label className="block text-[13px] font-medium text-white/70">
                  {t("tokenCheckout.email")}
                  <input
                    className={field}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@email.com"
                  />
                </label>
                <p className="text-xs leading-relaxed text-white/40">{t("tokenCheckout.emailHint")}</p>
                <button
                  type="button"
                  disabled={!emailOk}
                  onClick={() => setStep(2)}
                  className="h-12 w-full rounded-full bg-white text-sm font-semibold text-black disabled:opacity-30"
                >
                  {t("tokenCheckout.continue")}
                </button>
              </motion.div>
            ) : null}

            {step === 2 ? (
              <motion.div
                key="pay"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-6 space-y-5"
              >
                <div className="rounded-[24px] border border-white/12 bg-black px-5 py-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
                    {t("tokenCheckout.sendThis")}
                  </p>
                  <p className="mt-2 text-[2.6rem] font-extrabold leading-none tracking-tight text-white">
                    {formatBdt(pack.price)}
                  </p>
                  <button
                    type="button"
                    onClick={() => void copy("amount", String(pack.price))}
                    className="mt-4 h-11 rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition hover:border-white/40"
                  >
                    {copied === "amount" ? t("tokenCheckout.copied") : t("tokenCheckout.copy")}
                  </button>
                </div>

                <p className="text-[13px] font-medium text-white/70">{t("tokenCheckout.payWith")}</p>
                <div className="grid grid-cols-2 gap-3">
                  {RAILS.map((item) => {
                    const selected = method === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMethod(item.id)}
                        className={`relative overflow-hidden rounded-[28px] border px-3 py-5 text-left transition ${
                          selected ? "border-white bg-white/[0.07]" : "border-white/10 bg-black hover:border-white/25"
                        }`}
                        style={selected ? { boxShadow: `0 18px 50px ${item.glow}` } : undefined}
                      >
                        <motion.span
                          className="relative mx-auto grid h-[4.75rem] w-[4.75rem] place-items-center sm:h-24 sm:w-24"
                          animate={reduce ? undefined : { y: [0, -7, 0] }}
                          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: item.id === "nagad" ? 0.4 : 0 }}
                        >
                          <span
                            aria-hidden
                            className="absolute inset-0 rounded-[22px] blur-xl"
                            style={{ background: item.glow, opacity: selected ? 0.9 : 0.45 }}
                          />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.logo}
                            alt=""
                            className="relative h-[4.75rem] w-[4.75rem] rounded-[22px] object-cover sm:h-24 sm:w-24"
                          />
                        </motion.span>
                        <p className="relative mt-3 text-center text-sm font-bold text-white">{item.label}</p>
                      </button>
                    );
                  })}
                </div>

                {account && rail ? (
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[24px] border border-white/12 bg-black px-5 py-5"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
                      {t("tokenCheckout.sendTo", { rail: rail.label })}
                    </p>
                    <p className="mt-2 font-mono text-[1.85rem] font-extrabold tracking-wide text-white">{account.number}</p>
                    <p className="mt-1 text-sm text-white/45">{account.name}</p>
                    <button
                      type="button"
                      onClick={() => void copy("wallet", account.number)}
                      className="mt-4 h-11 rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition hover:border-white/40"
                    >
                      {copied === "wallet" ? t("tokenCheckout.copied") : t("tokenCheckout.copyNumber")}
                    </button>
                  </motion.div>
                ) : null}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-12 flex-1 rounded-full border border-white/15 text-sm font-semibold text-white"
                  >
                    {t("tokenCheckout.back")}
                  </button>
                  <button
                    type="button"
                    disabled={!method}
                    onClick={() => setStep(3)}
                    className="h-12 flex-[1.6] rounded-full bg-white text-sm font-semibold text-black disabled:opacity-30"
                  >
                    {t("tokenCheckout.continue")}
                  </button>
                </div>
              </motion.div>
            ) : null}

            {step === 3 ? (
              <motion.div
                key="proof"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-6 space-y-4"
              >
                <label className="block text-[13px] font-medium text-white/70">
                  {t("tokenCheckout.trx")}
                  <input
                    className={field}
                    value={trx}
                    onChange={(event) => setTrx(event.target.value)}
                    autoCapitalize="characters"
                    autoComplete="off"
                    placeholder="TrxID"
                  />
                </label>
                <label className="block text-[13px] font-medium text-white/70">
                  {t("tokenCheckout.fromNumber")}
                  <input
                    className={field}
                    value={payer}
                    onChange={(event) => setPayer(event.target.value.replace(/[^\d]/g, "").slice(0, 11))}
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="01XXXXXXXXX"
                  />
                </label>
                <p className="text-xs leading-relaxed text-white/40">{t("tokenCheckout.fromHint")}</p>
                {error ? <p className="text-sm font-semibold text-[#ff7a84]">{error}</p> : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="h-12 flex-1 rounded-full border border-white/15 text-sm font-semibold text-white"
                  >
                    {t("tokenCheckout.back")}
                  </button>
                  <button
                    type="button"
                    disabled={busy || trx.trim().length < 4 || !payerOk}
                    onClick={() => void submit()}
                    className="h-12 flex-[1.6] rounded-full bg-white text-sm font-semibold text-black disabled:opacity-30"
                  >
                    {busy ? t("tokenCheckout.sending") : t("tokenCheckout.submit")}
                  </button>
                </div>
              </motion.div>
            ) : null}

            {step === 4 ? (
              <motion.div
                key="done"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <p className="text-[1.65rem] font-semibold tracking-tight text-white">{t("tokenCheckout.doneTitle")}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  {t("tokenCheckout.doneBody", { email: email.trim() })}
                </p>
                <p className="mt-5 font-mono text-sm text-white/70">{t("tokenCheckout.order", { number })}</p>
                <Link
                  href="/"
                  className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black"
                >
                  {t("tokenCheckout.home")}
                </Link>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        </div>
      </Frame>
    </section>
  );
}
