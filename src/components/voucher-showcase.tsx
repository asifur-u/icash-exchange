"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Frame } from "@/components/frame";
import { VoucherCard } from "@/components/voucher-card";
import { formatBdt } from "@/lib/format";
import type { PublicProduct } from "@/lib/types";

export function VoucherShowcase({ products }: { products: PublicProduct[] }) {
  const [index, setIndex] = useState(0);
  const active = products[index] ?? products[0];
  if (!active) return null;

  function prev() {
    setIndex((current) => (current - 1 + products.length) % products.length);
  }

  function next() {
    setIndex((current) => (current + 1) % products.length);
  }

  return (
    <section className="border-t border-white/10 py-16 md:py-24">
      <Frame>
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">Vouchers</p>
            <h2 className="mt-3 display text-4xl leading-none sm:text-5xl">Premium notes.</h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous voucher"
              onClick={prev}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white hover:text-black"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next voucher"
              onClick={next}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white text-black transition hover:bg-white/85"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-10 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35 }}
              className="premium-card overflow-hidden rounded-[28px] p-6 sm:p-8"
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                {active.stock > 0 ? `${active.stock} ready` : "Sold out"}
              </p>
              <p className="mt-6 display text-5xl leading-none sm:text-6xl">{formatBdt(active.faceValue)}</p>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted">{active.blurb}</p>
              <Link
                href={`/order/${active.slug}`}
                className="mt-8 inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/85"
              >
                Open {active.title}
              </Link>
            </motion.div>
          </AnimatePresence>
          <div className="hidden lg:block">
            <VoucherCard faceValue={active.faceValue} title={active.title} large />
          </div>
        </div>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
          {products.map((product, productIndex) => {
            const selected = productIndex === index;
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => setIndex(productIndex)}
                className={`min-w-[140px] rounded-2xl border px-4 py-4 text-left transition ${
                  selected ? "border-white bg-white text-black" : "border-white/12 bg-black text-white hover:border-white/35"
                }`}
              >
                <p className="text-[10px] uppercase tracking-[0.16em] opacity-60">{product.title}</p>
                <p className="mt-2 text-lg font-semibold">{formatBdt(product.faceValue)}</p>
              </button>
            );
          })}
        </div>
      </Frame>
    </section>
  );
}
