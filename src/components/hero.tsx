"use client";

import { motion } from "motion/react";
import { BrandLogo } from "@/components/brand-logo";
import { Frame } from "@/components/frame";
import { VoucherDesk } from "@/components/voucher-desk";
import type { PublicProduct } from "@/lib/types";

export function Hero({ products }: { products: PublicProduct[] }) {
  return (
    <section className="relative overflow-hidden bg-black pb-20 pt-28 sm:pb-28 sm:pt-36">
      <Frame className="relative grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16 xl:gap-20">
        <div className="max-w-2xl">
          <motion.div
            initial={{ y: 20, opacity: 0.85 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <BrandLogo priority size="hero" />
          </motion.div>
          <motion.h1
            className="display mt-10 text-[clamp(3.2rem,7.5vw,5.6rem)]"
            initial={{ y: 24 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.85, delay: 0.05 }}
          >
            <span className="block">Send value</span>
            <span className="block text-white/45">as a code.</span>
          </motion.h1>
          <motion.p
            className="mt-7 max-w-lg text-lg leading-relaxed text-white/55 sm:text-xl"
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, delay: 0.1 }}
          >
            Choose a note. Pay. Read the code on your order page. Encrypted at rest. Sold once.
          </motion.p>
        </div>
        <motion.div
          className="w-full justify-self-stretch lg:justify-self-end lg:max-w-[560px]"
          initial={{ y: 28 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, delay: 0.08 }}
        >
          <VoucherDesk products={products} />
        </motion.div>
      </Frame>
    </section>
  );
}
