"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { depositAccounts, type PaymentMethodId } from "@/lib/deposit";
import { formatBdt } from "@/lib/format";

export function PayPanel({
  orderId,
  token,
  number,
  email,
  phone,
  total,
  title,
}: {
  orderId: string;
  token: string;
  number: string;
  email: string;
  phone?: string;
  total: number;
  title: string;
}) {
  const accounts = useMemo(() => depositAccounts(), []);
  const [method, setMethod] = useState<PaymentMethodId>("bkash");
  const [transactionId, setTransactionId] = useState("");
  const [proofDataUrl, setProofDataUrl] = useState<string | null>(null);
  const [proofName, setProofName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const selected = accounts.find((item) => item.id === method) ?? accounts[0]!;

  async function onFile(file: File | null) {
    setError(null);
    setProofDataUrl(null);
    setProofName(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Upload a screenshot image");
      return;
    }
    if (file.size > 2_400_000) {
      setError("Screenshot must be under 2.5 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        setError("Could not read that screenshot");
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
      setError("Add the payment screenshot");
      return;
    }
    setPending(true);
    setError(null);
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
        setError(data.error?.message ?? "Could not submit the deposit proof");
        setPending(false);
        return;
      }
      window.location.assign(data.orderUrl);
    } catch {
      setError("Could not submit the deposit proof");
      setPending(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <form onSubmit={submit} className="premium-card rounded-[40px] p-8 sm:p-10">
        <p className="text-xs uppercase tracking-[0.22em] text-white/45">Deposit checkout</p>
        <h1 className="mt-4 display text-4xl sm:text-5xl">Send {formatBdt(total)}</h1>
        <p className="mt-4 text-base leading-relaxed text-white/50">
          {title} · {number}
          <br />
          {email}
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
              <p className="mt-2 text-2xl font-medium tracking-tight text-white">{selected.number}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/55">{selected.name}</p>
          {selected.note ? <p className="mt-3 text-sm leading-relaxed text-white/40">{selected.note}</p> : null}
        </div>

        <label className="mt-8 block text-xs uppercase tracking-[0.18em] text-white/45" htmlFor="trx">
          Transaction ID / TrxID
        </label>
        <input
          id="trx"
          required
          value={transactionId}
          onChange={(event) => setTransactionId(event.target.value)}
          className="mt-3 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-3.5 font-mono text-white outline-none focus:border-white/40"
          placeholder="e.g. 8N7A2B9C4D"
        />

        <label className="mt-8 block text-xs uppercase tracking-[0.18em] text-white/45" htmlFor="proof">
          Payment screenshot
        </label>
        <label
          htmlFor="proof"
          className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-white/20 bg-white/[0.03] px-6 py-10 text-center transition hover:border-white/40"
        >
          <span className="text-base font-medium text-white">
            {proofName ? proofName : "Tap to upload screenshot"}
          </span>
          <span className="mt-2 text-sm text-white/40">PNG, JPG, or WebP · under 2.5 MB</span>
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
          <img src={proofDataUrl} alt="Payment proof preview" className="mt-4 max-h-48 rounded-2xl border border-white/10 object-contain" />
        ) : null}

        {error ? <p className="mt-6 text-sm text-[#e8c4b8]">{error}</p> : null}

        <Button type="submit" className="mt-8 h-14 w-full text-base" disabled={pending} aria-busy={pending}>
          {pending ? "Submitting…" : "Submit deposit proof"}
        </Button>
        <p className="mt-4 text-sm leading-relaxed text-white/40">
          After the owner confirms the deposit, your voucher code appears on the order page and can be emailed.
        </p>
      </form>

      <aside className="premium-card h-fit rounded-[40px] p-8 sm:p-10 lg:sticky lg:top-28">
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
        <div className="mt-8 rounded-[24px] border border-white/12 bg-black/40 px-5 py-4 text-sm text-white/50">
          Keep this order link. Open it anytime with your email receipt or the checkout redirect.
        </div>
      </aside>
    </div>
  );
}
