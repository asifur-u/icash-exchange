"use client";

import { useState } from "react";

export function CopyCode({ value, title }: { value: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-white/18 bg-gradient-to-b from-white/[0.08] to-black/40 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:rounded-[28px]">
      <div className="h-1 bg-[#ff2d2d]" />
      <div className="p-5 sm:p-7">
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">iCash gift voucher</p>
        {title ? <p className="mt-2 text-sm text-white/55">{title}</p> : null}
        <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-white/40">Voucher code</p>
        <p className="mt-2 break-all font-mono text-lg tracking-[0.1em] text-white sm:text-2xl sm:tracking-[0.12em]">
          {value}
        </p>
        <button
          type="button"
          onClick={copy}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-6 text-sm font-medium text-black transition hover:bg-white/85 sm:w-auto"
        >
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
    </div>
  );
}
