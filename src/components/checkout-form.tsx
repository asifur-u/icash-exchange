"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatBdt } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/swal";

export function CheckoutForm({
  productSlug,
  title,
  quantity,
  voucher,
  fee,
  total,
  signedInAs,
}: {
  productSlug: string;
  title: string;
  quantity: number;
  voucher: number;
  fee: number;
  total: number;
  signedInAs: string;
}) {
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productSlug, quantity }),
      });
      const data = (await response.json()) as { paymentUrl?: string; error?: { message?: string } };
      if (!response.ok || !data.paymentUrl) {
        await notifyError(
          "Could not reserve",
          data.error?.message ?? "The desk could not reserve that note",
        );
        setPending(false);
        return;
      }
      await notifySuccess("Note reserved", "Continue to the deposit step.");
      window.location.assign(data.paymentUrl);
    } catch {
      await notifyError("Could not reserve", "The desk could not reserve that note");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-[24px] border border-white/12 bg-white/[0.03] px-5 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-white/45">Signed in</p>
        <p className="mt-2 truncate text-sm font-medium text-white/85">{signedInAs}</p>
        <p className="mt-2 text-sm text-white/40">
          Codes and order updates go to this account. Change details in Profile.
        </p>
      </div>

      <div className="rounded-[24px] border border-white/12 bg-white/[0.03] px-5 py-4 text-sm leading-relaxed text-white/60">
        <p className="font-medium text-white/80">
          {title} × {quantity}
        </p>
        <div className="mt-3 space-y-1.5">
          <p className="flex justify-between gap-3">
            <span>Voucher</span>
            <span className="tabular-nums text-white/80">{formatBdt(voucher)}</span>
          </p>
          <p className="flex justify-between gap-3">
            <span>Desk fee 2.5%</span>
            <span className="tabular-nums text-white/80">{formatBdt(fee)}</span>
          </p>
          <p className="flex justify-between gap-3 border-t border-white/10 pt-2 font-medium text-white">
            <span>Total to pay</span>
            <span className="tabular-nums">{formatBdt(total)}</span>
          </p>
        </div>
        <p className="mt-3 text-white/40">
          Next: send this deposit, upload the screenshot, and enter the TrxID.
        </p>
      </div>

      <Button type="submit" className="h-14 w-full text-base" disabled={pending} aria-busy={pending}>
        {pending ? "Reserving…" : "Continue to deposit"}
      </Button>
    </form>
  );
}
