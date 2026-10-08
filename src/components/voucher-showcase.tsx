"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Frame } from "@/components/frame";
import { VoucherCard } from "@/components/voucher-card";
import { formatBdt } from "@/lib/format";
import type { PublicProduct } from "@/lib/types";

export function VoucherShowcase({ products }: { products: PublicProduct[] }) {
  const [index, setIndex] = useState(
    Math.max(
      0,
      products.findIndex((product) => product.slug === "note-1000"),
    ),
  );
  const active = products[index] ?? products[0];
  if (!active) return null;

  function prev() {
    setIndex((current) => (current - 1 + products.length) % products.length);
  }

  function next() {
    setIndex((current) => (current + 1) % products.length);
  }

  return (
    <section className="relative overflow-hidden border-t border-white/10 py-16 sm:py-24 md:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-10%] top-20 h-[480px] w-[480px] rounded-full bg-white/[0.035] blur-[110px]"
      />

      <Frame>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p className="eyebrow">Vouchers</p>
            <h2 className="mt-4 display text-[clamp(2.4rem,10vw,5.2rem)]">
              Premium <span className="accent-red">notes.</span>
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/50 sm:text-lg">
              Every iCash note on the desk. Pick a value. See the real voucher card.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              aria-label="Previous voucher"
              onClick={prev}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 text-xl text-white transition hover:bg-white hover:text-black sm:h-14 sm:w-14"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next voucher"
              onClick={next}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white text-xl text-black transition hover:bg-white/85 sm:h-14 sm:w-14"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-8 grid items-center gap-6 sm:mt-14 sm:gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={`card-${active.id}`}
              initial={{ opacity: 0.4, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0.3, scale: 0.97, y: -12 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="order-1 mx-auto w-full max-w-[620px] lg:order-2"
            >
              <VoucherCard faceValue={active.faceValue} title={active.title} large />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="premium-card relative order-2 overflow-hidden rounded-[24px] p-5 sm:rounded-[40px] sm:p-12 lg:order-1"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/[0.07] blur-3xl"
              />
              <div className="relative flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">
                  {active.stock > 0 ? `${active.stock} ready` : "Sold out"}
                </p>
                <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                  {index + 1} / {products.length}
                </p>
              </div>
              <p className="relative mt-5 display text-[clamp(2.4rem,10vw,5.8rem)] sm:mt-8">
                {formatBdt(active.faceValue)}
              </p>
              <p className="relative mt-2 text-lg font-medium tracking-tight text-white/80 sm:mt-3 sm:text-xl">
                {active.title}
              </p>
              <p className="relative mt-3 max-w-md text-base leading-relaxed text-white/50 sm:mt-5 sm:text-lg">
                {active.blurb}
              </p>
              <Link
                href={`/order/${active.slug}`}
                className="relative mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-8 text-base font-medium tracking-tight text-black transition hover:bg-white/85 sm:mt-10 sm:h-14 sm:w-auto"
              >
                Open {active.title}
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 sm:mt-12">
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/40 sm:mb-4">Choose a value</p>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4" role="listbox" aria-label="Voucher values">
            {products.map((product, productIndex) => {
              const selected = productIndex === index;
              return (
                <button
                  key={product.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => setIndex(productIndex)}
                  className={`rounded-[20px] border px-3.5 py-4 text-left transition sm:rounded-[28px] sm:px-5 sm:py-6 ${
                    selected
                      ? "border-white bg-gradient-to-b from-white to-white/85 text-black shadow-[0_20px_60px_rgba(255,255,255,0.12)]"
                      : "border-white/15 bg-white/[0.03] text-white hover:border-white/40 hover:bg-white/[0.06]"
                  }`}
                >
                  <p className={`text-[10px] uppercase tracking-[0.18em] sm:text-[11px] ${selected ? "text-black/55" : "text-white/45"}`}>
                    {product.title}
                  </p>
                  <p className="mt-2 text-xl font-medium tracking-tight sm:mt-3 sm:text-3xl">
                    {formatBdt(product.faceValue)}
                  </p>
                  <p className={`mt-1.5 text-[10px] uppercase tracking-[0.18em] sm:mt-2 sm:text-xs ${selected ? "text-black/45" : "text-white/35"}`}>
                    {product.stock > 0 ? `${product.stock} ready` : "Sold out"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </Frame>
    </section>
  );
}
