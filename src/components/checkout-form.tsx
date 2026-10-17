"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/provider";
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
  tone = "marketing",
}: {
  productSlug: string;
  title: string;
  quantity: number;
  voucher: number;
  fee: number;
  total: number;
  signedInAs: string;
  tone?: "marketing" | "portal";
}) {
  const t = useT();
  const [pending, setPending] = useState(false);
  const portal = tone === "portal";

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

  if (portal) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div
          className="rounded-2xl px-4 py-4"
          style={{ border: "1px solid #e4e4e7", background: "#fafafa" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {t("checkout.signedIn")}
          </p>
          <p className="mt-1.5 truncate text-sm font-semibold text-zinc-900">{signedInAs}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{t("checkout.codesGoHere")}</p>
        </div>

        <div
          className="rounded-2xl px-4 py-4 text-sm"
          style={{ border: "1px solid #e4e4e7", background: "#fff" }}
        >
          <p className="font-semibold text-zinc-900">
            {title} × {quantity}
          </p>
          <div className="mt-3 space-y-1.5 text-zinc-600">
            <p className="flex justify-between gap-3">
              <span>{t("desk.voucher")}</span>
              <span className="tabular-nums font-medium text-zinc-900">{formatBdt(voucher)}</span>
            </p>
            <p className="flex justify-between gap-3">
              <span>{t("desk.deskFee")}</span>
              <span className="tabular-nums font-medium text-zinc-900">{formatBdt(fee)}</span>
            </p>
            <p
              className="flex justify-between gap-3 border-t pt-2 font-semibold text-zinc-900"
              style={{ borderColor: "#e4e4e7" }}
            >
              <span>{t("desk.totalPay")}</span>
              <span className="tabular-nums">{formatBdt(total)}</span>
            </p>
          </div>
          <p className="mt-3 text-zinc-500">{t("checkout.nextDeposit")}</p>
        </div>

        <Button
          type="submit"
          className="!h-12 w-full !rounded-xl !bg-[#e11d2e] !text-base !font-semibold !text-white hover:!bg-[#c41828]"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? t("checkout.reserving") : t("checkout.continueDeposit")}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-[24px] border border-white/12 bg-white/[0.03] px-5 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-white/45">{t("checkout.signedIn")}</p>
        <p className="mt-2 truncate text-sm font-medium text-white/85">{signedInAs}</p>
        <p className="mt-2 text-sm text-white/40">{t("checkout.codesGoHere")}</p>
      </div>

      <div className="rounded-[24px] border border-white/12 bg-white/[0.03] px-5 py-4 text-sm leading-relaxed text-white/60">
        <p className="font-medium text-white/80">
          {title} × {quantity}
        </p>
        <div className="mt-3 space-y-1.5">
          <p className="flex justify-between gap-3">
            <span>{t("desk.voucher")}</span>
            <span className="tabular-nums text-white/80">{formatBdt(voucher)}</span>
          </p>
          <p className="flex justify-between gap-3">
            <span>{t("desk.deskFee")}</span>
            <span className="tabular-nums text-white/80">{formatBdt(fee)}</span>
          </p>
          <p className="flex justify-between gap-3 border-t border-white/10 pt-2 font-medium text-white">
            <span>{t("desk.totalPay")}</span>
            <span className="tabular-nums">{formatBdt(total)}</span>
          </p>
        </div>
        <p className="mt-3 text-white/40">{t("checkout.nextDeposit")}</p>
      </div>

      <Button type="submit" className="h-14 w-full text-base" disabled={pending} aria-busy={pending}>
        {pending ? t("checkout.reserving") : t("checkout.continueDeposit")}
      </Button>
    </form>
  );
}
