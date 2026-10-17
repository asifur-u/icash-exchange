"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { depositAccounts, type PaymentMethodId } from "@/lib/deposit";
import { formatBdt } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/swal";

export function PayPanel({
  orderId,
  token,
  number,
  email,
  phone,
  total,
  title,
  tone = "marketing",
}: {
  orderId: string;
  token: string;
  number: string;
  email: string;
  phone?: string;
  total: number;
  title: string;
  tone?: "marketing" | "portal";
}) {
  const accounts = useMemo(() => depositAccounts(), []);
  const [method, setMethod] = useState<PaymentMethodId>("bkash");
  const [transactionId, setTransactionId] = useState("");
  const [proofDataUrl, setProofDataUrl] = useState<string | null>(null);
  const [proofName, setProofName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const selected = accounts.find((item) => item.id === method) ?? accounts[0]!;
  const portal = tone === "portal";

  async function onFile(file: File | null) {
    setProofDataUrl(null);
    setProofName(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      await notifyError("Invalid file", "Upload a screenshot image");
      return;
    }
    if (file.size > 2_400_000) {
      await notifyError("File too large", "Screenshot must be under 2.5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        void notifyError("Upload failed", "Could not read that screenshot");
        return;
      }
      setProofDataUrl(result);
      setProofName(file.name);
    };
    reader.readAsDataURL(file);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!proofDataUrl) {
      await notifyError("Screenshot needed", "Add the payment screenshot");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/checkout/payment", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId,
          token,
          method,
          transactionId,
          proofDataUrl,
        }),
      });
      const data = (await response.json()) as { orderUrl?: string; error?: { message?: string } };
      if (!response.ok || !data.orderUrl) {
        await notifyError(
          "Submit failed",
          data.error?.message ?? "Could not submit the deposit proof",
        );
        setPending(false);
        return;
      }
      await notifySuccess("Proof submitted", "The desk will review your deposit.");
      window.location.assign(data.orderUrl);
    } catch {
      await notifyError("Submit failed", "Could not submit the deposit proof");
      setPending(false);
    }
  }

  if (portal) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:gap-5">
        <form
          onSubmit={submit}
          className="al-card space-y-5 p-5 sm:p-7"
          style={{ color: "#09090b" }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e11d2e]">
              Deposit
            </p>
            <h1 className="mt-2 text-[clamp(1.7rem,4vw,2.4rem)] font-extrabold tracking-tight text-zinc-900">
              Send {formatBdt(total)}
            </h1>
            <p className="mt-2 break-words text-sm leading-relaxed text-zinc-500">
              {title} · {number}
              <br />
              <span className="break-all">{email}</span>
              {phone ? ` · ${phone}` : ""}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Payment method
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {accounts.map((account) => {
                const active = account.id === method;
                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setMethod(account.id)}
                    aria-label={account.label}
                    aria-pressed={active}
                    className="flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 transition"
                    style={
                      active
                        ? {
                            borderColor: "#e11d2e",
                            background: "#fff5f5",
                            boxShadow: "0 8px 20px rgba(225,29,46,0.12)",
                          }
                        : { borderColor: "#e4e4e7", background: "#fafafa" }
                    }
                  >
                    <span className="relative block h-10 w-10 overflow-hidden rounded-xl bg-white p-1">
                      <Image
                        src={account.logo}
                        alt={account.label}
                        width={40}
                        height={40}
                        unoptimized
                        className="h-full w-full object-contain"
                      />
                    </span>
                    <span className="text-xs font-semibold text-zinc-800">{account.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="rounded-2xl p-4"
            style={{ border: "1px solid #fee2e2", background: "#fff5f5" }}
          >
            <div className="flex items-center gap-3">
              <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white p-1">
                <Image
                  src={selected.logo}
                  alt={selected.label}
                  width={44}
                  height={44}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Send to this {selected.label}
                </p>
                <p className="mt-1 break-all text-xl font-bold tracking-tight text-zinc-900">
                  {selected.number}
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm text-zinc-600">{selected.name}</p>
            {selected.note ? <p className="mt-2 text-sm leading-relaxed text-zinc-500">{selected.note}</p> : null}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400" htmlFor="trx">
              Transaction ID / TrxID
            </label>
            <input
              id="trx"
              required
              value={transactionId}
              onChange={(event) => setTransactionId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 font-mono text-zinc-900 outline-none focus:border-[#e11d2e]"
              placeholder="e.g. 8N7A2B9C4D"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400" htmlFor="proof">
              Payment screenshot
            </label>
            <label
              htmlFor="proof"
              className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-center transition hover:border-[#e11d2e]"
            >
              <span className="text-sm font-semibold text-zinc-900">
                {proofName ? proofName : "Tap to upload screenshot"}
              </span>
              <span className="mt-1 text-xs text-zinc-500">PNG, JPG, or WebP · under 2.5 MB</span>
              <input
                id="proof"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => onFile(event.target.files?.[0] ?? null)}
              />
            </label>
            {proofDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proofDataUrl}
                alt="Payment proof preview"
                className="mt-3 max-h-48 rounded-xl border border-zinc-200 object-contain"
              />
            ) : null}
          </div>

          <Button
            type="submit"
            className="!h-12 w-full !rounded-xl !bg-[#e11d2e] !text-base !font-semibold !text-white hover:!bg-[#c41828]"
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? "Submitting…" : "Submit deposit proof"}
          </Button>
        </form>

        <aside className="al-card h-fit p-5 sm:p-6" style={{ color: "#09090b" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            How it works
          </p>
          <ol className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-600">
            <li>
              <span className="font-bold text-zinc-900">1.</span> Send exactly {formatBdt(total)} to
              the number.
            </li>
            <li>
              <span className="font-bold text-zinc-900">2.</span> Enter the TrxID and upload the
              screenshot.
            </li>
            <li>
              <span className="font-bold text-zinc-900">3.</span> Wait for approval — code unlocks on
              your order page.
            </li>
          </ol>
          <div
            className="mt-5 rounded-xl px-4 py-3 text-sm text-zinc-600"
            style={{ background: "#f4f4f5", border: "1px solid #e4e4e7" }}
          >
            Stay in this portal. After review, open Orders to copy your code.
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <form onSubmit={submit} className="premium-card rounded-[28px] p-5 sm:rounded-[40px] sm:p-10">
        <p className="text-xs uppercase tracking-[0.22em] text-white/45">Deposit checkout</p>
        <h1 className="mt-4 display text-[clamp(2rem,8vw,3rem)] sm:text-5xl">Send {formatBdt(total)}</h1>
        <p className="mt-4 break-words text-sm leading-relaxed text-white/50 sm:text-base">
          {title} · {number}
          <br />
          <span className="break-all">{email}</span>
          {phone ? ` · ${phone}` : ""}
        </p>

        <p className="mt-10 text-xs uppercase tracking-[0.18em] text-white/45">Payment method</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {accounts.map((account) => {
            const active = account.id === method;
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => setMethod(account.id)}
                aria-label={account.label}
                aria-pressed={active}
                className={`flex flex-col items-center gap-2 rounded-[20px] border px-2 py-3 transition ${
                  active
                    ? "border-white bg-white shadow-[0_12px_28px_rgba(255,255,255,0.12)]"
                    : "border-white/15 bg-white/[0.03] hover:border-white/35"
                }`}
              >
                <span className="relative block h-11 w-11 overflow-hidden rounded-[14px] bg-white p-1 shadow-[0_8px_20px_rgba(0,0,0,0.22)]">
                  <Image
                    src={account.logo}
                    alt={account.label}
                    width={44}
                    height={44}
                    unoptimized
                    className="h-full w-full object-contain"
                  />
                </span>
                <span className={`text-xs font-medium tracking-tight ${active ? "text-black" : "text-white"}`}>
                  {account.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 rounded-[28px] border border-white/15 bg-white/[0.04] p-5">
          <div className="flex items-center gap-4">
            <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-[14px] bg-white p-1">
              <Image
                src={selected.logo}
                alt={selected.label}
                width={44}
                height={44}
                unoptimized
                className="h-full w-full object-contain"
              />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Send to this {selected.label}</p>
              <p className="mt-2 break-all text-xl font-medium tracking-tight text-white sm:text-2xl">{selected.number}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/55">{selected.name}</p>
          {selected.note ? <p className="mt-3 text-sm leading-relaxed text-white/40">{selected.note}</p> : null}
        </div>

        <label className="mt-8 block text-xs uppercase tracking-[0.18em] text-white/45" htmlFor="trx-m">
          Transaction ID / TrxID
        </label>
        <input
          id="trx-m"
          required
          value={transactionId}
          onChange={(event) => setTransactionId(event.target.value)}
          className="mt-3 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-3.5 font-mono text-white outline-none focus:border-white/40"
          placeholder="e.g. 8N7A2B9C4D"
        />

        <label className="mt-8 block text-xs uppercase tracking-[0.18em] text-white/45" htmlFor="proof-m">
          Payment screenshot
        </label>
        <label
          htmlFor="proof-m"
          className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-white/20 bg-white/[0.03] px-6 py-10 text-center transition hover:border-white/40"
        >
          <span className="text-base font-medium text-white">
            {proofName ? proofName : "Tap to upload screenshot"}
          </span>
          <span className="mt-2 text-sm text-white/40">PNG, JPG, or WebP · under 2.5 MB</span>
          <input
            id="proof-m"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => onFile(event.target.files?.[0] ?? null)}
          />
        </label>
        {proofDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={proofDataUrl} alt="Payment proof preview" className="mt-4 max-h-48 rounded-2xl border border-white/10 object-contain" />
        ) : null}

        <Button type="submit" className="mt-8 h-14 w-full text-base" disabled={pending} aria-busy={pending}>
          {pending ? "Submitting…" : "Submit deposit proof"}
        </Button>
        <p className="mt-4 text-sm leading-relaxed text-white/40">
          After the owner confirms the deposit, your voucher code appears on the order page and can be emailed.
        </p>
      </form>

      <aside className="premium-card h-fit rounded-[28px] p-5 sm:rounded-[40px] sm:p-10 lg:sticky lg:top-28">
        <p className="text-xs uppercase tracking-[0.18em] text-white/45">How it works</p>
        <ol className="mt-6 space-y-5 text-base leading-relaxed text-white/60">
          <li>
            <span className="font-medium text-white">1.</span> Send exactly {formatBdt(total)} to the number above.
          </li>
          <li>
            <span className="font-medium text-white">2.</span> Enter the TrxID and upload the screenshot.
          </li>
          <li>
            <span className="font-medium text-white">3.</span> Wait for approval. Your code unlocks on the order page.
          </li>
        </ol>
      </aside>
    </div>
  );
}
