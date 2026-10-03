"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatBdt } from "@/lib/format";

export function CheckoutForm({
  productSlug,
  title,
  quantity,
  total,
}: {
  productSlug: string;
  title: string;
  quantity: number;
  total: number;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
    <form onSubmit={onSubmit} className="max-w-md">
      <label className="block text-[11px] uppercase tracking-[0.18em] text-gold" htmlFor="email">
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
        className="mt-2 w-full border-b border-white/20 bg-transparent py-3 text-white outline-none focus:border-gold"
        placeholder="you@email.com"
      />
      <label className="mt-8 block text-[11px] uppercase tracking-[0.18em] text-gold" htmlFor="phone">
        Mobile, optional
      </label>
      <input
        id="phone"
        name="phone"
        inputMode="numeric"
        autoComplete="tel"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        className="mt-2 w-full border-b border-white/20 bg-transparent py-3 text-white outline-none focus:border-gold"
        placeholder="01XXXXXXXXX"
      />
      <p className="mt-8 text-sm leading-relaxed text-muted">
        {title} × {quantity}. You pay {formatBdt(total)}. The hold lasts 15 minutes, then the codes return to the desk.
      </p>
      {error ? <p className="mt-4 text-sm text-[#e8c4b8]">{error}</p> : null}
      <Button type="submit" className="mt-8" disabled={pending} aria-busy={pending}>
        {pending ? "Reserving…" : "Continue to checkout"}
      </Button>
    </form>
  );
}
