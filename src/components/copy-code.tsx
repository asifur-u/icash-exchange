"use client";

import { useState } from "react";

export function CopyCode({ value }: { value: string }) {
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
    <div className="border border-gold/40 px-5 py-6">
      <p className="break-all font-mono text-xl tracking-[0.14em] text-gold sm:text-2xl">{value}</p>
      <button type="button" onClick={copy} className="mt-4 text-sm text-white/70 hover:text-gold">
        {copied ? "Copied" : "Copy code"}
      </button>
    </div>
  );
}
