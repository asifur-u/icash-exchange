"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Frame } from "@/components/frame";
import { useT } from "@/i18n/provider";
import { formatBdt } from "@/lib/format";
import type { PublicProduct } from "@/lib/types";

export function VoucherShowcase({ products }: { products: PublicProduct[] }) {
  const t = useT();
  if (products.length === 0) return null;

  const readyInStock = products.filter((p) => p.stock > 0).length;

  return (
    <section id="notes" className="bg-black py-16 sm:py-24 md:py-28">
      <Frame>
        <div className="mx-auto mt-0 max-w-[640px]">
          <div className="mb-3 flex items-end justify-between gap-3 px-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
              {t("home.chooseNote")}
            </p>
            <p className="text-xs text-white/35">
              {t("home.inStock", { ready: readyInStock, total: products.length })}
            </p>
          </div>

          <div
            className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3"
            role="listbox"
            aria-label={t("home.voucherValues")}
          >
            {products.map((product, productIndex) => {
              const soldOut = product.stock < 1;
              const maxStock = Math.max(...products.map((p) => p.stock), 1);
              const fill = soldOut ? 0 : Math.max(12, Math.round((product.stock / maxStock) * 100));

              return (
                <motion.div
                  key={product.id}
                  whileHover={soldOut ? undefined : { y: -4, scale: 1.02 }}
                  whileTap={soldOut ? undefined : { scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 380, damping: 22 }}
                >
                  <Link
                    href={soldOut ? "#notes" : `/order/${product.slug}`}
                    aria-disabled={soldOut}
                    role="option"
                    className={`note-pick group relative block overflow-hidden rounded-[18px] border px-3.5 py-3.5 text-left sm:rounded-[20px] sm:px-4 sm:py-4 ${
                      soldOut
                        ? "pointer-events-none cursor-not-allowed border-white/8 bg-white/[0.03] text-white/35"
                        : "border-white/12 bg-gradient-to-b from-white/[0.09] to-white/[0.03] text-white hover:border-white/25"
                    }`}
                  >
                    <div className="relative flex items-start justify-between gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold tracking-tight text-white/70">
                        {String(productIndex + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${
                          soldOut ? "bg-white/5 text-white/30" : "bg-white/8 text-white/45"
                        }`}
                      >
                        {soldOut ? t("home.out") : t("home.live")}
                      </span>
                    </div>

                    <p className="relative mt-3 text-[1.05rem] font-semibold tracking-tight sm:text-lg">
                      {formatBdt(product.faceValue)}
                    </p>
                    <p
                      className={`relative mt-1 text-[11px] ${soldOut ? "text-white/25" : "text-white/40"}`}
                    >
                      {soldOut ? t("home.soldOut") : t("desk.ready", { n: product.stock })}
                    </p>

                    <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                      <motion.span
                        className={`absolute inset-y-0 left-0 rounded-full ${soldOut ? "bg-white/15" : "bg-white/70"}`}
                        initial={false}
                        animate={{ width: `${fill}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 18 }}
                      />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Frame>
    </section>
  );
}
