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
    <div className="overflow-hidden rounded-[24px] border border-white/15 bg-[#111]">
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-semibold tracking-tight text-white">Continue your purchase</p>
          <p className="mt-1.5 max-w-xl text-sm text-white/50">
            You started before login. Finish the deposit when you are ready.
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
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90"
        >
          Continue to deposit
        </Link>
      </div>
    </div>
  );
}
