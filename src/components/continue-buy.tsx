"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function ContinueBuy() {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    try {
      const pending = sessionStorage.getItem("icash_pending_buy");
      if (pending?.startsWith("/checkout")) setHref(pending);
    } catch {
      /* ignore */
    }
  }, []);

  if (!href) return null;

  return (
    <div className="premium-card mt-8 flex flex-col gap-4 rounded-[24px] p-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-[#ff2d2d]">Continue your purchase</p>
        <p className="mt-2 text-base text-white/60">You started a note before logging in. Finish the deposit next.</p>
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
        className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black"
      >
        Continue to deposit
      </Link>
    </div>
  );
}
