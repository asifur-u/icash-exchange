"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatBdt } from "@/lib/format";

export function CheckoutForm({
  productSlug,
  title,
  quantity,
  total,
  defaultEmail = "",
  defaultPhone = "",
}: {
  productSlug: string;
  title: string;
  quantity: number;
  total: number;
  defaultEmail?: string;
  defaultPhone?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productSlug, quantity, email, phone }),
      });
      const data = (await response.json()) as { paymentUrl?: string; error?: { message?: string } };
      if (!response.ok || !data.paymentUrl) {
        setError(data.error?.message ?? "The desk could not reserve that note");
        setPending(false);
        return;
      }
      window.location.assign(data.paymentUrl);
    } catch {
      setError("The desk could not reserve that note");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-xs uppercase tracking-[0.18em] text-white/45" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-3 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-3.5 text-white outline-none transition placeholder:text-white/30 focus:border-white/40"
          placeholder="you@email.com"
        />
        <p className="mt-2 text-sm text-white/40">Order link and voucher code arrive here after approval.</p>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-[0.18em] text-white/45" htmlFor="phone">
          Mobile number
        </label>
        <input
          id="phone"
          name="phone"
          inputMode="numeric"
          autoComplete="tel"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 11))}
          className="mt-3 w-full rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-3.5 text-white outline-none transition placeholder:text-white/30 focus:border-white/40"
          placeholder="01XXXXXXXXX"
        />
        <p className="mt-2 text-sm text-white/40">Used for SMS when connected, and for deposit checks.</p>
      </div>

      <div className="rounded-[24px] border border-white/12 bg-white/[0.03] px-5 py-4 text-sm leading-relaxed text-white/60">
        {title} × {quantity}. You pay <span className="font-medium text-white">{formatBdt(total)}</span>.
        Next step: send the deposit, upload the screenshot, and enter the TrxID.
      </div>

      {error ? <p className="text-sm text-[#e8c4b8]">{error}</p> : null}

      <Button type="submit" className="h-14 w-full text-base" disabled={pending} aria-busy={pending}>
        {pending ? "Reserving…" : "Continue to deposit"}
      </Button>
    </form>
  );
}
