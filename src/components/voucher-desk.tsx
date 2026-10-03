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
      <div className="premium-card rounded-[40px] p-10">
        <p className="display text-4xl">The desk is empty.</p>
      </div>
    );
  }

  return (
    <div id="desk" className="premium-card w-full rounded-[40px] p-6 sm:p-9">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm text-white/75">
          <span className="h-2 w-2 rounded-full bg-white" />
          Instant digital note
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
          {selected.stock > 0 ? `${selected.stock} ready` : "Sold out"}
        </p>
      </div>

      <div className="mt-7 rounded-[30px] border border-white/12 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-black/50 p-5 sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-base text-white/50">You choose</p>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm font-medium text-white"
          >
            Note
            <span aria-hidden="true" className="text-white/50">
              ▾
            </span>
          </button>
        </div>

        {open ? (
          <div className="mt-4 grid gap-2.5" role="listbox" aria-label="Notes">
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
                  className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition disabled:opacity-40 ${
                    active ? "border-white bg-white text-black" : "border-white/12 hover:border-white/35"
                  }`}
                >
                  <span className="text-lg font-semibold">{formatBdt(product.faceValue)}</span>
                  <span className={`text-sm ${active ? "text-black/55" : "text-muted"}`}>
                    {product.stock > 0 ? `${product.stock} ready` : "Sold out"}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-6 display text-[3.4rem] leading-none tracking-tight sm:text-[4.4rem]">
            {formatBdt(selected.faceValue)}
          </p>
        )}
      </div>

      <div className="mt-4 rounded-[28px] border border-white/12 bg-white/[0.035] px-5 py-4 text-base leading-relaxed text-white/65">
        Codes are encrypted at rest and sold once. Unpaid holds return in 15 minutes.
      </div>

      <div className="mt-4 rounded-[30px] border border-white/12 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-black/50 p-5 sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-base text-white/50">Quantity</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Fewer"
              disabled={quantity <= 1 || max < 1}
              onClick={() => setQty((current) => Math.max(1, current - 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-xl disabled:opacity-30"
            >
              –
            </button>
            <span className="min-w-8 text-center font-mono text-2xl" aria-live="polite">
              {max < 1 ? 0 : quantity}
            </span>
            <button
              type="button"
              aria-label="More"
              disabled={max < 1 || quantity >= max}
              onClick={() => setQty((current) => Math.min(max, current + 1))}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-xl disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>
        <p className="mt-6 display text-[3.2rem] leading-none tracking-tight sm:text-[4.2rem]">
          {formatBdt(max < 1 ? selected.faceValue : faceTotal)}
        </p>
        <p className="mt-3 text-base text-white/50">Recipient gets the code</p>
      </div>

      <div className="mt-6 space-y-4 text-base text-white/65">
        <div className="flex items-start gap-3">
          <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/25 text-[10px]">
            ●
          </span>
          <p>Arrives on your order page within minutes after payment.</p>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/25 text-[10px]">
            ●
          </span>
          <p>
            You pay <span className="font-semibold text-white">{formatBdt(max < 1 ? selected.price : total)}</span>
            . Included. No surprise fees on this desk.
          </p>
        </div>
      </div>

      <div className="mt-8">
        {selected.stock < 1 ? (
          <Button className="h-14 w-full text-base" disabled>
            Sold out
          </Button>
        ) : (
          <ButtonLink href={href} className="h-14 w-full text-base">
            Buy this note
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
