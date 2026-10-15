"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useT } from "@/i18n/provider";

function readPendingBuy() {
  try {
    const pending = sessionStorage.getItem("icash_pending_buy");
    return pending?.startsWith("/checkout") ? pending : null;
  } catch {
    return null;
  }
}

function subscribe() {
  return () => {};
}

export function ContinueBuy() {
  const t = useT();
  const href = useSyncExternalStore(subscribe, readPendingBuy, () => null);

  if (!href) return null;

  return (
    <div
      className="overflow-hidden rounded-[1.25rem] px-5 py-5 sm:px-6"
      style={{
        border: "1px solid #bae6fd",
        background: "linear-gradient(90deg, #f0f9ff, #ffffff)",
        color: "#09090b",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "#0284c7" }}
          >
            {t("account.pendingCheckout")}
          </p>
          <p className="mt-1 text-base font-bold" style={{ color: "#09090b" }}>
            {t("account.continuePurchase")}
          </p>
          <p className="mt-1.5 max-w-xl text-sm" style={{ color: "#52525b" }}>
            {t("account.continuePurchaseLead")}
          </p>
        </div>
        <Link
          href={href}
          onClick={() => {
            try {
              sessionStorage.removeItem("icash_pending_buy");
            } catch {
              /* ignore */
            }
          }}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl px-5 text-sm font-semibold"
          style={{ background: "#0284c7", color: "#fff" }}
        >
          {t("account.continueDeposit")}
        </Link>
      </div>
    </div>
  );
}
