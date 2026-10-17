"use client";

import { useMemo, useState } from "react";
import { VoucherCard } from "@/components/voucher-card";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Frame } from "@/components/frame";
import { formatBdt } from "@/lib/format";
import type { PublicProduct } from "@/lib/types";

export function Purchase({ products }: { products: PublicProduct[] }) {
  const initial = products.find((product) => product.slug === "note-1000") ?? products[0];
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [qty, setQty] = useState(1);
  const selected = products.find((product) => product.slug === slug) ?? products[0];

  const max = selected ? Math.min(5, selected.stock) : 0;
  const quantity = Math.min(Math.max(qty, 1), Math.max(max, 1));
  const total = selected ? selected.price * Math.min(quantity, Math.max(max, 0)) : 0;

  const href = useMemo(() => {
    if (!selected || selected.stock < 1) return "/catalog";
    return `/account/checkout?product=${selected.slug}&qty=${Math.min(quantity, max)}`;
  }, [selected, quantity, max]);

  if (!selected) {
    return (
      <Frame className="py-24">
        <p className="display text-4xl">The desk is empty.</p>
      </Frame>
    );
  }

  return (
    <section id="desk" className="relative overflow-hidden border-t border-white/10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/70 to-transparent"
      />
      <Frame className="grid items-center gap-14 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:py-28">
        <div className="order-2 lg:order-1">
          <p className="text-[11px] uppercase tracking-[0.22em] text-accent">The desk</p>
          <h2 className="display mt-4 text-[clamp(2.6rem,6vw,4.5rem)]">Choose your note.</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">{selected.blurb}</p>

          <div className="mt-10" role="listbox" aria-label="Notes">
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
                  className={`flex w-full items-baseline justify-between gap-4 border-b border-white/10 py-5 text-left transition disabled:opacity-40 ${
                    active ? "text-accent" : "text-white hover:text-white/80"
                  }`}
                >
                  <span className="display text-3xl sm:text-4xl">{formatBdt(product.faceValue)}</span>
                  <span className="text-sm text-muted">
                    {product.stock > 0 ? `${product.stock} ready` : "Sold out"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Fewer"
                disabled={quantity <= 1 || max < 1}
                onClick={() => setQty((current) => Math.max(1, current - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-lg disabled:opacity-30"
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
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-lg disabled:opacity-30"
              >
                +
              </button>
            </div>
            <p className="text-sm text-muted">
              You pay <span className="text-white">{formatBdt(max < 1 ? selected.price : total)}</span>
            </p>
          </div>

          <div className="mt-8">
            {selected.stock < 1 ? (
              <Button disabled>Sold out</Button>
            ) : (
              <ButtonLink href={href}>Continue to checkout</ButtonLink>
            )}
          </div>
        </div>
        <div className="order-1 lg:sticky lg:top-28 lg:order-2">
          <VoucherCard faceValue={selected.faceValue} title={selected.title} large />
        </div>
      </Frame>
    </section>
  );
}
