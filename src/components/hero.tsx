"use client";

import { motion } from "motion/react";
import { Frame } from "@/components/frame";
import { VoucherDesk } from "@/components/voucher-desk";
import { ButtonLink } from "@/components/ui/button-link";
import type { PublicProduct } from "@/lib/types";

export function Hero({ products, loggedIn = false }: { products: PublicProduct[]; loggedIn?: boolean }) {
  return (
    <section className="relative overflow-hidden bg-black pb-14 pt-[calc(5.5rem+env(safe-area-inset-top))] sm:pb-24 sm:pt-36 md:pb-28 md:pt-40">
      <Frame className="relative grid items-center gap-12 sm:gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 xl:gap-24">
        <div className="min-w-0 max-w-2xl">
          <motion.h1
            className="hero-offer"
            initial={{ y: 20, opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.05 }}
          >
            <span className="hero-offer-line display-hero text-[clamp(1.15rem,4.8vw,2.15rem)] leading-none text-white">
              Every deposit
            </span>
            <span className="mt-1 block display-hero text-[clamp(2.9rem,13.5vw,6.4rem)] leading-[0.88] accent-green">
              5% extra
            </span>
            <span className="hero-offer-line mt-1 display-hero text-[clamp(1.55rem,7vw,3.1rem)] leading-none accent-green">
              Bonus
            </span>
            <div className="hero-power" aria-hidden="true">
              <div className="hero-power-fill" />
            </div>
          </motion.h1>

          <motion.p
            className="mt-7 max-w-md text-lg leading-[1.6] text-white/70 sm:mt-9 sm:text-xl sm:leading-[1.6]"
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, delay: 0.1 }}
          >
            Buy iCash vouchers using local payment methods and enjoy an extra 5% on every eligible deposit.
          </motion.p>

          <motion.div
            className="mt-9 sm:mt-11"
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, delay: 0.14 }}
          >
            <ButtonLink
              href="#desk"
              className="h-16 w-full gap-2.5 text-lg font-semibold sm:w-auto sm:min-w-[300px] sm:px-10"
            >
              Buy iCash Voucher
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4.5 11.5l7-7M5.5 4.5h6v6" />
              </svg>
            </ButtonLink>
          </motion.div>
        </div>

        <motion.div
          className="w-full min-w-0 justify-self-stretch lg:justify-self-end lg:max-w-[560px]"
          initial={{ y: 28 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, delay: 0.08 }}
        >
          <VoucherDesk products={products} loggedIn={loggedIn} />
        </motion.div>
      </Frame>
    </section>
  );
}
