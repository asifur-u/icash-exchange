"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

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
  const href = useSyncExternalStore(subscribe, readPendingBuy, () => null);

  if (!href) return null;

  return (
    <div className="relative mt-8 overflow-hidden rounded-[28px] border border-[#ff2d2d]/30 bg-[#140a0a]">
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-[#ff2d2d]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#ff2d2d]/20 blur-[60px]"
      />
      <div className="relative flex flex-col gap-4 px-6 py-6 pl-7 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:pl-9">
        <div>
          <p className="text-sm font-semibold tracking-tight text-[#ff2d2d]">Continue your purchase</p>
          <p className="mt-2 max-w-xl text-base text-white/65">
            You started a note before logging in. Finish the deposit next.
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
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          Continue to deposit
        </Link>
      </div>
    </div>
  );
}
