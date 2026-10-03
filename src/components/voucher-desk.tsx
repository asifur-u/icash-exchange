"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { formatBdt } from "@/lib/format";
import type { PublicProduct } from "@/lib/types";

export function VoucherDesk({ products }: { products: PublicProduct[] }) {
  const initial = products.find((product) => product.slug === "note-1000") ?? products[0];
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);
  const selected = products.find((product) => product.slug === slug) ?? products[0];

  const max = selected ? Math.min(5, selected.stock) : 0;
  const quantity = Math.min(Math.max(qty, 1), Math.max(max, 1));
  const total = selected ? selected.price * Math.min(quantity, Math.max(max, 0)) : 0;
  const faceTotal = selected ? selected.faceValue * Math.min(quantity, Math.max(max, 0)) : 0;

  const href = useMemo(() => {
    if (!selected || selected.stock < 1) return "/catalog";
    return `/checkout?product=${selected.slug}&qty=${Math.min(quantity, max)}`;
  }, [selected, quantity, max]);

  if (!selected) {
    return (
      <div className="premium-card rounded-[28px] p-8">
        <p className="display text-3xl">The desk is empty.</p>
      </div>
    );
  }

  return (
    <div id="desk" className="premium-card w-full max-w-md rounded-[28px] p-5 sm:p-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        Instant digital note · BDT
      </div>

      <div className="mt-5 rounded-[22px] border border-white/10 bg-black/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">You choose</p>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-sm text-white"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
              BD
            </span>
            Note
            <span aria-hidden="true" className="text-white/50">
              ▾
            </span>
          </button>
        </div>

        {open ? (
          <div className="mt-3 grid gap-2" role="listbox" aria-label="Notes">
            {products.map((product) => {
              const active = product.slug === selected.slug;
              return (
                <button
                  key={product.slug}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={product.stock < 1}
                  onClick={() => {
                    setSlug(product.slug);
                    setQty(1);
                    setOpen(false);
                  }}
                  className={`flex items-center justify-between rounded-2xl border px-3 py-3 text-left transition disabled:opacity-40 ${
                    active ? "border-white bg-white/10" : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <span className="font-semibold">{formatBdt(product.faceValue)}</span>
                  <span className="text-xs text-muted">
                    {product.stock > 0 ? `${product.stock} ready` : "Sold out"}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 display text-[2.6rem] leading-none tracking-tight sm:text-5xl">
            {formatBdt(selected.faceValue)}
          </p>
        )}
      </div>

      <div className="mt-3 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75">
        Codes are encrypted at rest and sold once. Unpaid holds return in 15 minutes.
      </div>

      <div className="mt-3 rounded-[22px] border border-white/10 bg-black/50 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">Quantity</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Fewer"
              disabled={quantity <= 1 || max < 1}
              onClick={() => setQty((current) => Math.max(1, current - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 disabled:opacity-30"
            >
              –
            </button>
            <span className="min-w-6 text-center font-mono text-lg" aria-live="polite">
              {max < 1 ? 0 : quantity}
            </span>
            <button
              type="button"
              aria-label="More"
              disabled={max < 1 || quantity >= max}
              onClick={() => setQty((current) => Math.min(max, current + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>
        <p className="mt-4 display text-[2.4rem] leading-none tracking-tight sm:text-5xl">
          {formatBdt(max < 1 ? selected.faceValue : faceTotal)}
        </p>
        <p className="mt-2 text-sm text-muted">Recipient gets the code</p>
      </div>

      <div className="mt-4 space-y-3 text-sm text-white/70">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 text-[10px]">
            ●
          </span>
          <p>Arrives on your order page within minutes after payment.</p>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 text-[10px]">
            ●
          </span>
          <p>
            You pay <span className="text-white">{formatBdt(max < 1 ? selected.price : total)}</span>
            . Included. No surprise fees on this desk.
          </p>
        </div>
      </div>

      <div className="mt-6">
        {selected.stock < 1 ? (
          <Button className="w-full" disabled>
            Sold out
          </Button>
        ) : (
          <ButtonLink href={href} className="w-full">
            Buy this note
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
