"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
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

  return (
    <section className="bg-black py-16 sm:py-24 md:py-28">
      <Frame>
        <div className="max-w-xl">
          <p className="eyebrow">Vouchers</p>
          <h2 className="mt-4 display text-[clamp(2.4rem,10vw,5rem)]">
            Premium <span className="accent-red">notes.</span>
          </h2>
        </div>

        <div className="mx-auto mt-10 max-w-[640px] sm:mt-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <VoucherCard faceValue={active.faceValue} title={active.title} large />
              <div className="mt-6 flex flex-col items-start gap-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-sm text-base leading-relaxed text-white/55">
                  {active.blurb}{" "}
                  {active.stock > 0 ? `${active.stock} ready.` : "Sold out."}
                </p>
                <Link
                  href={`/order/${active.slug}`}
                  className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-black transition hover:bg-white/85"
                >
                  Open {active.title}
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mx-auto mt-10 max-w-[640px] sm:mt-12">
          <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
              Choose a note
            </p>
            <p className="text-xs text-white/35">
              {products.filter((p) => p.stock > 0).length} of {products.length} in stock
            </p>
          </div>

          <div
            className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3"
            role="listbox"
            aria-label="Voucher values"
          >
            {products.map((product, productIndex) => {
              const selected = productIndex === index;
              const soldOut = product.stock < 1;
              const maxStock = Math.max(...products.map((p) => p.stock), 1);
              const fill = soldOut ? 0 : Math.max(12, Math.round((product.stock / maxStock) * 100));

              return (
                <motion.button
                  key={product.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={soldOut}
                  onClick={() => setIndex(productIndex)}
                  whileHover={soldOut ? undefined : { y: -4, scale: 1.02 }}
                  whileTap={soldOut ? undefined : { scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  className={`note-pick group relative overflow-hidden rounded-[18px] border px-3.5 py-3.5 text-left sm:rounded-[20px] sm:px-4 sm:py-4 ${
                    selected
                      ? "note-pick-active border-white bg-white text-black shadow-[0_16px_40px_rgba(255,255,255,0.12)]"
                      : soldOut
                        ? "cursor-not-allowed border-white/8 bg-white/[0.03] text-white/35"
                        : "border-white/12 bg-gradient-to-b from-white/[0.09] to-white/[0.03] text-white hover:border-white/25"
                  }`}
                >
                  {selected ? <span aria-hidden="true" className="note-pick-ring" /> : null}

                  <div className="relative flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold tracking-tight ${
                        selected ? "bg-black text-white" : "bg-white/10 text-white/70"
                      }`}
                    >
                      {String(productIndex + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${
                        soldOut
                          ? "bg-white/5 text-white/30"
                          : selected
                            ? "bg-black/8 text-black/50"
                            : "bg-white/8 text-white/45"
                      }`}
                    >
                      {soldOut ? "Out" : "Live"}
                    </span>
                  </div>

                  <p className="relative mt-3 text-[1.05rem] font-semibold tracking-tight sm:text-lg">
                    {formatBdt(product.faceValue)}
                  </p>
                  <p
                    className={`relative mt-1 text-[11px] ${
                      selected ? "text-black/50" : soldOut ? "text-white/25" : "text-white/40"
                    }`}
                  >
                    {soldOut ? "Sold out" : `${product.stock} ready`}
                  </p>

                  <div
                    className={`relative mt-3 h-1 overflow-hidden rounded-full ${
                      selected ? "bg-black/10" : "bg-white/10"
                    }`}
                  >
                    <motion.span
                      className={`absolute inset-y-0 left-0 rounded-full ${
                        selected ? "bg-black" : soldOut ? "bg-white/15" : "bg-white/70"
                      }`}
                      initial={false}
                      animate={{ width: `${fill}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 18 }}
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </Frame>
    </section>
  );
}
