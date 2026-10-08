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
  const selected = products.find((product) => product.slug === slug) ?? products[0];

  const max = selected ? Math.min(5, selected.stock) : 0;
  const quantity = Math.min(Math.max(qty, 1), Math.max(max, 1));
  const total = selected ? selected.price * Math.min(quantity, Math.max(max, 0)) : 0;

  const href = useMemo(() => {
    if (!selected || selected.stock < 1) return "/catalog";
    return `/checkout?product=${selected.slug}&qty=${Math.min(quantity, max)}`;
  }, [selected, quantity, max]);

  if (!selected) {
    return (
      <div className="rounded-[28px] border border-white/12 bg-[#0c0c0c] p-8">
        <p className="text-2xl font-semibold tracking-tight">The desk is empty.</p>
      </div>
    );
  }

  return (
    <div id="desk" className="w-full rounded-[28px] border border-white/12 bg-[#0c0c0c] p-5 sm:rounded-[32px] sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-white/50">You choose</p>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/40">
          {selected.stock > 0 ? `${selected.stock} ready` : "Sold out"}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2" role="listbox" aria-label="Notes">
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
              }}
              className={`rounded-2xl px-4 py-3 text-left transition disabled:opacity-40 ${
                active ? "bg-white text-black" : "bg-white/[0.06] text-white hover:bg-white/10"
              }`}
            >
              <span className="block text-lg font-semibold tracking-tight">{formatBdt(product.faceValue)}</span>
              <span className={`mt-0.5 block text-xs ${active ? "text-black/50" : "text-white/40"}`}>
                {product.title}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/10 pt-6">
        <div>
          <p className="text-sm text-white/50">You pay</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
            {formatBdt(max < 1 ? selected.price : total)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Fewer"
            disabled={quantity <= 1 || max < 1}
            onClick={() => setQty((current) => Math.max(1, current - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-xl disabled:opacity-30"
          >
            –
          </button>
          <span className="min-w-6 text-center text-xl font-semibold" aria-live="polite">
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

      <p className="mt-4 text-sm leading-relaxed text-white/50">
        The code arrives on your order page after the desk confirms the deposit.
      </p>

      <div className="mt-6">
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
