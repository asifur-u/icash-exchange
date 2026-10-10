"use client";

import Link from "next/link";
import { faqs } from "@/lib/content";

const tips = [
  "Send the exact order total.",
  "Keep a clear screenshot of the TrxID.",
  "Stay on the order page while the desk reviews.",
  "Copy the code only after status is DELIVERED.",
];

export function AccountSupport() {
  return (
    <div className="space-y-5">
      <header className="rounded-[28px] border border-white/12 bg-[#0a0a0a] p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff2d2d]">Support</p>
        <h1 className="mt-2 display text-[clamp(2rem,6vw,3.2rem)] leading-[0.95]">
          Help from the desk.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
          Quick answers for deposits, codes, and timing. Full FAQ is also on the public site.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            href="/faq"
            className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-black"
          >
            Open full FAQ
          </Link>
          <Link
            href="/account/orders"
            className="inline-flex h-11 items-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white"
          >
            Check my orders
          </Link>
        </div>
      </header>

      <section className="rounded-[28px] border border-white/12 bg-[#0a0a0a] p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">Before you write</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {tips.map((tip) => (
            <li
              key={tip}
              className="flex gap-3 rounded-2xl bg-white/[0.03] px-4 py-3 text-sm text-white/65"
            >
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff2d2d]" />
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-white/12 bg-[#0a0a0a]">
        <div className="border-b border-white/10 px-5 py-4 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">FAQ</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Common questions</h2>
        </div>
        <ul className="divide-y divide-white/10">
          {faqs.map((item) => (
            <li key={item.q} className="px-5 py-5 sm:px-6">
              <p className="font-semibold tracking-tight text-white">{item.q}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{item.a}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
