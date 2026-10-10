"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

/** Google-event style: letters spring out one-by-one from a focal point */
function EventLetters({
  text,
  show,
  className,
  stagger = 0.05,
  originY = 36,
}: {
  text: string;
  show: boolean;
  className?: string;
  stagger?: number;
  originY?: number;
}) {
  const chars = Array.from(text);
  return (
    <span className={className} aria-label={text}>
      {chars.map((ch, i) => (
        <motion.span
          key={`${text}-${i}-${ch}`}
          className="hero-event-char"
          aria-hidden="true"
          initial={{ opacity: 0, y: originY, scale: 0.2, rotate: i % 2 === 0 ? -12 : 10 }}
          animate={
            show
              ? { opacity: 1, y: 0, scale: 1, rotate: 0 }
              : { opacity: 0, y: originY * 0.7, scale: 0.25, rotate: i % 2 === 0 ? -8 : 8 }
          }
          transition={{
            type: "spring",
            stiffness: 520,
            damping: 22,
            mass: 0.7,
            delay: show ? i * stagger : 0,
          }}
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}

type CapPhase = "idle" | "toy" | "flip" | "letters" | "bonus" | "done";

const EXTRA = "5% EXTRA";
const BONUS = "BONUS";

export function Hero({ products, loggedIn = false }: { products: PublicProduct[]; loggedIn?: boolean }) {
  const mainRef = useRef<HTMLSpanElement>(null);
  const topRef = useRef<HTMLSpanElement>(null);
  const bonusRef = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState<CapPhase>("idle");
  const [seq, setSeq] = useState(0);

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

    const timers = [0, 600, 1400, 2200, 3200].map((ms) => window.setTimeout(sync, ms));
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
  }, [phase]);

  // Google-event sequence: toy → cap flip → letters pop → BONUS letters → done
  useEffect(() => {
    let alive = true;
    setPhase("idle");
    const letterEnd = 1100 + EXTRA.length * 55;
    const bonusEnd = letterEnd + 180 + BONUS.length * 50;
    const ids = [
      window.setTimeout(() => alive && setPhase("toy"), 200),
      window.setTimeout(() => alive && setPhase("flip"), 780),
      window.setTimeout(() => alive && setPhase("letters"), 1100),
      window.setTimeout(() => alive && setPhase("bonus"), letterEnd + 120),
      window.setTimeout(() => alive && setPhase("done"), bonusEnd + 200),
    ];
    return () => {
      alive = false;
      ids.forEach((id) => window.clearTimeout(id));
    };
  }, [seq]);

  useEffect(() => {
    function replay() {
      setSeq((n) => n + 1);
    }
    window.addEventListener("icash-replay-cap", replay);
    return () => window.removeEventListener("icash-replay-cap", replay);
  }, []);

  const showToy = phase === "toy" || phase === "flip" || phase === "letters";
  const capOpen = phase !== "idle" && phase !== "toy";
  const showExtra = phase === "letters" || phase === "bonus" || phase === "done";
  const showBonus = phase === "bonus" || phase === "done";

  return (
    <section className="relative overflow-x-clip overflow-y-visible bg-black pb-14 pt-[calc(5.5rem+env(safe-area-inset-top))] sm:pb-24 sm:pt-36 md:pb-28 md:pt-40">
      <Frame className="relative grid items-center gap-12 sm:gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 xl:gap-24">
        <div className="min-w-0 max-w-2xl">
          <h1 className="hero-offer" data-cap-phase={phase}>
            <span
              ref={topRef}
              className="hero-offer-top display-hero text-[clamp(1.8rem,7.2vw,3rem)] leading-none text-white"
            >
              Every deposit
            </span>

            <span className="hero-cap-stage">
              <AnimatePresence>
                {showToy ? (
                  <motion.span
                    key="toy"
                    className="hero-toy"
                    aria-hidden="true"
                    initial={{ opacity: 0, x: -18, y: "40%", scale: 0.15, rotate: -14 }}
                    animate={
                      phase === "letters"
                        ? { opacity: 0, x: -8, y: "-55%", scale: 0.4, rotate: 8 }
                        : { opacity: 1, x: 0, y: "-8%", scale: 1.1, rotate: 0 }
                    }
                    exit={{ opacity: 0, scale: 0.35, y: "-60%", x: -6 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18, mass: 0.85 }}
                  >
                    <motion.span
                      className="hero-toy-cap"
                      initial={{ rotate: 0, x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={
                        capOpen
                          ? { rotate: -145, x: 18, y: -36, opacity: 0, scale: 0.75 }
                          : { rotate: 0, x: 0, y: 0, opacity: 1, scale: 1 }
                      }
                      transition={{ type: "spring", stiffness: 240, damping: 13, mass: 0.8 }}
                    >
                      <span className="hero-toy-cap-top" />
                      <span className="hero-toy-cap-brim" />
                    </motion.span>
                    <span className="hero-toy-face">
                      <span className="hero-toy-eye" />
                      <span className="hero-toy-eye" />
                      <span className="hero-toy-smile" />
                    </span>
                  </motion.span>
                ) : null}
              </AnimatePresence>

              <span
                ref={mainRef}
                className="hero-offer-main hero-offer-extra display-hero text-[clamp(3.55rem,16.5vw,7.8rem)] leading-[0.88]"
              >
                <EventLetters text={EXTRA} show={showExtra} stagger={0.055} originY={48} />
              </span>
            </span>

            <span
              ref={bonusRef}
              className="hero-offer-bonus display-hero text-[clamp(2.35rem,10.5vw,4.8rem)] leading-[0.9] text-white"
            >
              <EventLetters text={BONUS} show={showBonus} stagger={0.05} originY={32} />
            </span>
          </h1>

          <motion.p
            className="mt-4 max-w-md text-base leading-[1.55] text-white/70 sm:mt-5 sm:text-xl sm:leading-[1.6]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Buy iCash vouchers using local payment methods and enjoy an extra 5% on every eligible deposit
          </motion.p>

          <motion.div
            className="mt-6 sm:mt-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
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
          initial={{ y: 28, opacity: 0.96 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.08 }}
        >
          <VoucherDesk products={products} loggedIn={loggedIn} />
        </motion.div>
      </Frame>
    </section>
  );
}
