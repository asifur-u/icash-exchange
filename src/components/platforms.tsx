"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Frame } from "@/components/frame";
import { platforms } from "@/lib/platforms";

const INTERVAL_MS = 2800;
const RESUME_MS = 5000;

const payments = [
  { id: "bkash", label: "bKash", line: "Send Money", logo: "/payments/bkash.png" },
  { id: "nagad", label: "Nagad", line: "Send Money", logo: "/payments/nagad.png" },
  { id: "rocket", label: "Rocket", line: "Send Money", logo: "/payments/rocket.png" },
  { id: "bank", label: "Bank", line: "NPSB / BEFTN", logo: "/payments/bank.png" },
] as const;

export function Platforms() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [soft, setSoft] = useState(false);
  const resumeTimer = useRef<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const count = platforms.length;

  useEffect(() => {
    setSoft(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Always auto-advance so the desk clearly slides.
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % count);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, count]);

  useEffect(() => {
    const chip = chipRefs.current[active];
    const strip = stripRef.current;
    if (!chip || !strip) return;
    const target = chip.offsetLeft - strip.clientWidth / 2 + chip.offsetWidth / 2;
    strip.scrollTo({ left: Math.max(0, target), behavior: soft ? "auto" : "smooth" });
  }, [active, soft]);

  useEffect(() => {
    return () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    };
  }, []);

  function pauseBriefly() {
    setPaused(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setPaused(false), RESUME_MS);
  }

  function go(delta: number) {
    pauseBriefly();
    setActive((current) => (current + delta + count) % count);
  }

  function pick(index: number) {
    pauseBriefly();
    setActive(index);
  }

  const current = platforms[active]!;
  const duration = soft ? 0.2 : 0.45;

  return (
    <section id="partners" className="relative overflow-hidden bg-black py-16 sm:py-24 md:py-32">
      <Frame>
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Partners</p>
          <h2 className="mt-4 display text-[clamp(2.2rem,9vw,4.6rem)]">
            Desks we <span className="accent-red">connect</span> with.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/50 sm:text-lg">
            Logos slide on their own. Tap a chip or use the arrows to jump.
          </p>
        </div>

        <div className="relative mx-auto mt-10 max-w-5xl sm:mt-14">
          <div className="relative flex min-h-[300px] items-center justify-center sm:min-h-[360px]">
            <AnimatePresence mode="wait">
              <motion.article
                key={current.id}
                initial={{ opacity: 0, x: soft ? 0 : 48, scale: soft ? 1 : 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: soft ? 0 : -48, scale: soft ? 1 : 0.96 }}
                transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
                className="partner-stage relative z-10 flex w-[min(100%,300px)] flex-col items-center rounded-[28px] px-5 py-8 sm:w-[380px] sm:rounded-[36px] sm:px-10 sm:py-11"
              >
                <LogoTile src={current.logo} alt={`${current.label} logo`} size="lg" />
                <p className="mt-6 text-2xl font-semibold tracking-tight text-white sm:mt-7 sm:text-4xl">
                  {current.label}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black px-4 py-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9fe870]/70 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#9fe870]" />
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-white/60">Connected</span>
                </div>
                <p className="mt-5 text-center text-sm leading-relaxed text-white/40">
                  Verified partner for digital note delivery.
                </p>
              </motion.article>
            </AnimatePresence>
          </div>

          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Previous partner"
              onClick={() => go(-1)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-lg text-white transition hover:bg-white hover:text-black"
            >
              ←
            </button>
            <div
              className="flex max-w-[min(100%,240px)] flex-wrap items-center justify-center gap-1.5"
              role="tablist"
              aria-label="Partners"
            >
              {platforms.map((platform, index) => {
                const selected = index === active;
                return (
                  <button
                    key={platform.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-label={platform.label}
                    onClick={() => pick(index)}
                    className="flex h-10 w-10 items-center justify-center"
                  >
                    <span
                      className={`block h-2 overflow-hidden rounded-full bg-white/20 transition-all ${
                        selected ? "w-8" : "w-2"
                      }`}
                    >
                      {selected ? (
                        <span
                          key={`${platform.id}-${active}-${paused ? "p" : "r"}`}
                          className="block h-full rounded-full bg-white"
                          style={{
                            animation: paused ? "none" : `partner-progress ${INTERVAL_MS}ms linear`,
                            width: paused ? "100%" : undefined,
                          }}
                        />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-label="Next partner"
              onClick={() => go(1)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white text-lg text-black transition hover:bg-white/85"
            >
              →
            </button>
          </div>
        </div>
      </Frame>

      <div className="relative mt-12 sm:mt-16">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-black to-transparent sm:w-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-black to-transparent sm:w-20" />
        <div
          ref={stripRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {platforms.map((platform, index) => {
            const selected = index === active;
            return (
              <button
                key={platform.id}
                type="button"
                ref={(node) => {
                  chipRefs.current[index] = node;
                }}
                onClick={() => pick(index)}
                aria-pressed={selected}
                className={`flex min-w-[148px] shrink-0 snap-center flex-col items-center gap-2.5 rounded-[22px] border px-4 py-4 transition sm:min-w-[168px] ${
                  selected
                    ? "border-white bg-white text-black"
                    : "border-white/12 bg-black text-white hover:border-white/30"
                }`}
              >
                <LogoTile src={platform.logo} alt="" size="sm" selected={selected} />
                <span className="text-center">
                  <span className="block text-sm font-semibold tracking-tight">{platform.label}</span>
                  <span
                    className={`mt-1 block text-[10px] uppercase tracking-[0.18em] ${
                      selected ? "text-black/45" : "text-white/40"
                    }`}
                  >
                    {selected ? "Selected" : "Connected"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Frame className="mt-16 sm:mt-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Pay rails</p>
          <h3 className="mt-3 display-soft text-[clamp(1.8rem,6vw,2.8rem)]">
            Local ways to <span className="accent-red">deposit.</span>
          </h3>
        </div>
      </Frame>

      <div className="relative mt-8 overflow-hidden sm:mt-10">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-black to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-black to-transparent sm:w-24" />
        <div className="pay-marquee flex w-max gap-3 px-5">
          {[...payments, ...payments, ...payments].map((method, index) => (
            <div
              key={`${method.id}-${index}`}
              className="flex w-[132px] shrink-0 flex-col items-center gap-2 rounded-[22px] border border-white/12 bg-black px-4 py-4 sm:w-[150px]"
            >
              <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-black sm:h-14 sm:w-14">
                <Image
                  src={method.logo}
                  alt=""
                  width={56}
                  height={56}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="text-center">
                <span className="block text-sm font-semibold tracking-tight text-white">{method.label}</span>
                <span className="mt-1 block text-[10px] uppercase tracking-[0.16em] text-white/40">
                  {method.line}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LogoTile({
  src,
  alt,
  size,
  selected = false,
}: {
  src: string;
  alt: string;
  size: "sm" | "lg";
  selected?: boolean;
}) {
  const box =
    size === "lg"
      ? "h-28 w-28 rounded-[26px] sm:h-36 sm:w-36 sm:rounded-[30px]"
      : "h-12 w-12 rounded-2xl sm:h-14 sm:w-14";
  const px = size === "lg" ? 144 : 56;

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border ${box} ${
        selected ? "border-black/10 bg-white" : "border-white/15 bg-white"
      }`}
    >
      <Image
        src={src}
        alt={alt}
        width={px}
        height={px}
        unoptimized
        className="h-full w-full object-cover"
      />
    </span>
  );
}
