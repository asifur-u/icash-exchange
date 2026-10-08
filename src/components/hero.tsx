"use client";

import { motion } from "motion/react";
import { BrandLogo } from "@/components/brand-logo";
import { Frame } from "@/components/frame";
import { VoucherDesk } from "@/components/voucher-desk";
import { ButtonLink } from "@/components/ui/button-link";
import type { PublicProduct } from "@/lib/types";

const trust = ["Encrypted", "Sold once", "Instant"];

export function Hero({ products }: { products: PublicProduct[] }) {
  return (
    <section className="relative overflow-hidden bg-black pb-12 pt-[calc(4.75rem+env(safe-area-inset-top))] sm:pb-24 sm:pt-32 md:pb-28 md:pt-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-24 h-[360px] w-[360px] rounded-full bg-[#ff2d2d]/[0.07] blur-[110px] sm:h-[520px] sm:w-[520px]"
      />
      <Frame className="relative grid items-center gap-8 sm:gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14 xl:gap-20">
        <div className="min-w-0 max-w-2xl">
          <motion.div
            className="hidden sm:block"
            initial={{ y: 20, opacity: 0.85 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <BrandLogo priority size="hero" />
          </motion.div>

          <motion.h1
            className="display text-[clamp(2.9rem,13.5vw,6.8rem)] sm:mt-9"
            initial={{ y: 24 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.85, delay: 0.05 }}
          >
            <span className="block">Send value</span>
            <span className="block accent-red">as a code.</span>
          </motion.h1>

          <motion.p
            className="mt-5 max-w-lg text-base leading-relaxed text-white/65 sm:mt-7 sm:text-lg md:text-xl"
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, delay: 0.1 }}
          >
            Choose a note. Pay by bKash, Nagad, Rocket or bank. Get your code the moment the desk confirms it.
          </motion.p>

          <motion.div
            className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center"
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, delay: 0.14 }}
          >
            <ButtonLink href="#desk" className="h-14 w-full text-base font-semibold sm:w-auto sm:px-9">
              Get a code
            </ButtonLink>
            <ButtonLink href="/catalog" variant="ghost" className="h-14 w-full text-base font-semibold sm:w-auto sm:px-9">
              See all notes
            </ButtonLink>
          </motion.div>

          <ul className="mt-6 flex flex-wrap gap-2 sm:mt-8">
            {trust.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff2d2d]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <motion.div
          className="w-full min-w-0 justify-self-stretch lg:justify-self-end lg:max-w-[560px]"
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
