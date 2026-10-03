"use client";

import { motion } from "motion/react";
import { BrandLogo } from "@/components/brand-logo";
import { Frame } from "@/components/frame";
import { VoucherDesk } from "@/components/voucher-desk";
import type { PublicProduct } from "@/lib/types";

export function Hero({ products }: { products: PublicProduct[] }) {
  return (
    <section className="relative overflow-hidden bg-black pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[12%] top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(255,40,40,0.18),transparent_65%)] blur-2xl"
      />
      <Frame className="relative grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14">
        <div className="max-w-xl">
          <motion.div
            initial={{ y: 18, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <BrandLogo priority size="hero" glow />
          </motion.div>
          <motion.h1
            className="display mt-8 text-[clamp(3.2rem,8vw,5.8rem)]"
            initial={{ y: 22 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.05 }}
          >
            <span className="block">Send value</span>
            <span className="block text-white/55">as a code.</span>
          </motion.h1>
          <motion.p
            className="mt-6 max-w-md text-lg leading-relaxed text-muted"
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Choose a note. Pay. Read the code on your order page. Encrypted at rest. Sold once.
          </motion.p>
          <motion.div
            className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/15 px-4 py-2 text-sm text-white/70"
            initial={{ y: 12 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.14 }}
          >
            <span className="h-2 w-2 rounded-full bg-[#ff2d2d]" />
            Bangladesh · Digital notes
          </motion.div>
        </div>
        <motion.div
          className="justify-self-stretch lg:justify-self-end"
          initial={{ y: 24 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.85, delay: 0.08 }}
        >
          <VoucherDesk products={products} />
        </motion.div>
      </Frame>
    </section>
  );
}
