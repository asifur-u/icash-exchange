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

        <div className="mx-auto mt-10 grid max-w-[640px] grid-cols-2 gap-2 sm:mt-12 sm:grid-cols-4" role="listbox" aria-label="Voucher values">
          {products.map((product, productIndex) => {
            const selected = productIndex === index;
            return (
              <button
                key={product.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => setIndex(productIndex)}
                className={`rounded-2xl px-4 py-4 text-left transition ${
                  selected ? "bg-white text-black" : "bg-white/[0.06] text-white hover:bg-white/10"
                }`}
              >
                <p className="text-lg font-semibold tracking-tight">{formatBdt(product.faceValue)}</p>
                <p className={`mt-1 text-xs ${selected ? "text-black/50" : "text-white/40"}`}>
                  {product.stock > 0 ? `${product.stock} ready` : "Sold out"}
                </p>
              </button>
            );
          })}
        </div>
      </Frame>
    </section>
  );
}
