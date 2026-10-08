"use client";

import { motion } from "motion/react";
import { useLayoutEffect, useRef } from "react";
import { Frame } from "@/components/frame";
import { VoucherDesk } from "@/components/voucher-desk";
import { ButtonLink } from "@/components/ui/button-link";
import type { PublicProduct } from "@/lib/types";

/** Keep readable size; only scale X so the line ends on EXTRA's right edge. */
function fitTopToMain(top: HTMLElement, main: HTMLElement) {
  top.style.transform = "none";
  const target = main.getBoundingClientRect().width;
  const width = top.getBoundingClientRect().width;
  if (target < 8 || width < 8) return;
  const scale = target / width;
  // Cap so words stay close — never crush or wildly stretch.
  const safe = Math.min(1.28, Math.max(0.94, scale));
  top.style.transform = `scaleX(${safe})`;
  top.style.transformOrigin = "left center";
}

export function Hero({ products, loggedIn = false }: { products: PublicProduct[]; loggedIn?: boolean }) {
  const mainRef = useRef<HTMLSpanElement>(null);
  const topRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    let alive = true;

    async function sync() {
      try {
        await document.fonts.ready;
      } catch {
        /* ignore */
      }
      if (!alive || !mainRef.current || !topRef.current) return;
      fitTopToMain(topRef.current, mainRef.current);
    }

    sync();
    requestAnimationFrame(sync);
    const ro = new ResizeObserver(() => requestAnimationFrame(sync));
    if (mainRef.current) ro.observe(mainRef.current);
    window.addEventListener("resize", sync);
    return () => {
      alive = false;
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-black pb-14 pt-[calc(5.5rem+env(safe-area-inset-top))] sm:pb-24 sm:pt-36 md:pb-28 md:pt-40">
      <Frame className="relative grid items-center gap-12 sm:gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 xl:gap-24">
        <div className="min-w-0 max-w-2xl">
          <motion.h1
            className="hero-offer"
            initial={{ y: 16, opacity: 0.92 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.75, delay: 0.05 }}
          >
            <span
              ref={topRef}
              className="hero-offer-top display-hero text-[clamp(1.65rem,6.8vw,2.85rem)] leading-none text-white"
            >
              Every deposit
            </span>
            <span
              ref={mainRef}
              className="hero-offer-main hero-offer-power display-hero mt-[2px] text-[clamp(3.35rem,15.5vw,7.4rem)] leading-[0.86]"
            >
              5% extra
            </span>
            <span className="hero-offer-bonus mt-[2px] display-hero text-[clamp(1.75rem,7.5vw,3.3rem)] leading-none text-white">
              {"BONUS".split("").map((letter, index) => (
                <span key={`${letter}-${index}`}>{letter}</span>
              ))}
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-md text-base leading-[1.55] text-white/70 sm:mt-8 sm:text-xl sm:leading-[1.6]"
            initial={{ y: 14 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Buy iCash vouchers using local payment methods and enjoy an extra 5% on every eligible deposit
          </motion.p>

          <motion.div
            className="mt-8 sm:mt-10"
            initial={{ y: 14 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.7, delay: 0.14 }}
          >
            <ButtonLink
              href="#desk"
              className="h-14 w-full gap-2.5 text-base font-semibold sm:h-16 sm:w-auto sm:min-w-[300px] sm:px-10 sm:text-lg"
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
