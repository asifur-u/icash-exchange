"use client";

import { motion } from "motion/react";
import { useLayoutEffect, useRef } from "react";
import { Frame } from "@/components/frame";
import { VoucherDesk } from "@/components/voucher-desk";
import { ButtonLink } from "@/components/ui/button-link";
import type { PublicProduct } from "@/lib/types";

function fitTopToMain(top: HTMLElement, target: number) {
  top.style.transform = "none";
  const width = top.getBoundingClientRect().width;
  if (target < 8 || width < 8) return;
  const scale = Math.min(1.36, Math.max(0.94, target / width));
  top.style.transform = `scaleX(${scale})`;
  top.style.transformOrigin = "left center";
}

function fitBonusToMain(bonus: HTMLElement, target: number) {
  if (target < 8) return;
  bonus.style.transform = "none";
  bonus.style.letterSpacing = "-0.02em";
  let size = Math.max(28, target * 0.22);
  bonus.style.fontSize = `${size}px`;

  let guard = 0;
  while (bonus.scrollWidth < target - 0.5 && size < target * 0.7 && guard < 140) {
    size += 0.65;
    bonus.style.fontSize = `${size}px`;
    guard += 1;
  }
  while (bonus.scrollWidth > target + 0.5 && size > 18 && guard < 220) {
    size -= 0.35;
    bonus.style.fontSize = `${size}px`;
    guard += 1;
  }
}

export function Hero({ products, loggedIn = false }: { products: PublicProduct[]; loggedIn?: boolean }) {
  const mainRef = useRef<HTMLSpanElement>(null);
  const topRef = useRef<HTMLSpanElement>(null);
  const bonusRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    let alive = true;

    async function sync() {
      try {
        await document.fonts.ready;
      } catch {
        /* ignore */
      }
      if (!alive || !mainRef.current) return;
      const target = mainRef.current.getBoundingClientRect().width;
      if (topRef.current) fitTopToMain(topRef.current, target);
      if (bonusRef.current) fitBonusToMain(bonusRef.current, target);
    }

    // Fit after the cap reveal has room; also on each frame of early animation.
    const timers = [0, 700, 1200, 1800].map((ms) => window.setTimeout(sync, ms));
    sync();
    requestAnimationFrame(sync);
    const ro = new ResizeObserver(() => requestAnimationFrame(sync));
    if (mainRef.current) ro.observe(mainRef.current);
    window.addEventListener("resize", sync);
    return () => {
      alive = false;
      timers.forEach((id) => window.clearTimeout(id));
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
            initial={{ opacity: 0.92 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span
              ref={topRef}
              className="hero-offer-top display-hero text-[clamp(1.8rem,7.2vw,3rem)] leading-none text-white"
            >
              Every deposit
            </span>

            <span className="hero-cap-stage" aria-hidden="false">
              <span className="hero-toy" aria-hidden="true">
                <span className="hero-toy-cap">
                  <span className="hero-toy-cap-top" />
                  <span className="hero-toy-cap-brim" />
                </span>
                <span className="hero-toy-face">
                  <span className="hero-toy-eye" />
                  <span className="hero-toy-eye" />
                  <span className="hero-toy-smile" />
                </span>
              </span>

              <span
                ref={mainRef}
                className="hero-offer-main hero-offer-power display-hero text-[clamp(3.55rem,16.5vw,7.8rem)] leading-[0.8]"
              >
                5% extra
              </span>
            </span>

            <span
              ref={bonusRef}
              className="hero-offer-bonus display-hero text-[clamp(2.35rem,10.5vw,4.8rem)] leading-[0.82] text-white"
            >
              Bonus
            </span>
          </motion.h1>

          <motion.p
            className="mt-4 max-w-md text-base leading-[1.55] text-white/70 sm:mt-5 sm:text-xl sm:leading-[1.6]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 1.55 }}
          >
            Buy iCash vouchers using local payment methods and enjoy an extra 5% on every eligible deposit
          </motion.p>

          <motion.div
            className="mt-6 sm:mt-8"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 1.65 }}
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
