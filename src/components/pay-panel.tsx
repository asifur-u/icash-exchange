"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatBdt } from "@/lib/format";

export function PayPanel({
  orderId,
  token,
  number,
  email,
  total,
  title,
}: {
  orderId: string;
  token: string;
  number: string;
  email: string;
  total: number;
  title: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function pay() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, token }),
      });
      const data = (await response.json()) as { orderUrl?: string; error?: { message?: string } };
      if (!response.ok || !data.orderUrl) {
        setError(data.error?.message ?? "Payment was not confirmed");
        setPending(false);
        return;
      }
      window.location.assign(data.orderUrl);
    } catch {
      setError("Payment was not confirmed");
      setPending(false);
    }
  }

  return (
    <div className="max-w-md border border-white/10 p-8">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Hosted checkout</p>
      <p className="mt-6 font-mono text-xs text-white/50">{number}</p>
      <h1 className="mt-3 display text-5xl tracking-tight">{formatBdt(total)}</h1>
      <p className="mt-4 text-muted">
        {title} for {email}
      </p>
      <p className="mt-6 text-sm leading-relaxed text-muted">
        Demonstration checkout. No real money moves. A live gateway will replace this page when you have a merchant account.
      </p>
      {error ? <p className="mt-4 text-sm text-[#e8c4b8]">{error}</p> : null}
      <Button className="mt-8 w-full" onClick={pay} disabled={pending} aria-busy={pending}>
        {pending ? "Confirming…" : `Pay ${formatBdt(total)}`}
      </Button>
    </div>
  );
}
