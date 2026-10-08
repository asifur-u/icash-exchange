"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Frame } from "@/components/frame";
import { platforms } from "@/lib/platforms";

const INTERVAL_MS = 3000;
const RESUME_MS = 6000;

export function Platforms() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const count = platforms.length;

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % count);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, count]);

  useEffect(() => {
    const chip = chipRefs.current[active];
    const strip = stripRef.current;
    if (!chip || !strip) return;
    const chipLeft = chip.offsetLeft;
    const chipWidth = chip.offsetWidth;
    const target = chipLeft - strip.clientWidth / 2 + chipWidth / 2;
    strip.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [active]);

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
  const prev = platforms[(active - 1 + count) % count]!;
  const next = platforms[(active + 1) % count]!;

  return (
    <section id="partners" className="relative overflow-hidden border-t border-white/10 py-16 sm:py-24 md:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[min(100vw,720px)] -translate-x-1/2 rounded-full bg-white/[0.04] blur-[100px]"
      />

      <Frame>
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Partners</p>
          <h2 className="mt-4 display text-[clamp(2.2rem,9vw,4.6rem)]">
            Desks we <span className="accent-red">connect</span> with.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/50 sm:text-lg">
            Auto slides. Tap any chip below to jump. The selected desk stays highlighted.
          </p>
        </div>

        <div className="relative mx-auto mt-10 max-w-5xl sm:mt-16">
          <div className="pointer-events-none absolute inset-y-8 left-0 z-20 w-10 bg-gradient-to-r from-black to-transparent sm:w-28" />
          <div className="pointer-events-none absolute inset-y-8 right-0 z-20 w-10 bg-gradient-to-l from-black to-transparent sm:w-28" />

          <div className="relative flex h-[300px] items-center justify-center sm:h-[380px] md:h-[420px]">
            <SideCard platform={prev} side="left" onClick={() => go(-1)} />

            <AnimatePresence mode="wait">
              <motion.article
                key={current.id}
                initial={{ opacity: 0, x: 56, scale: 0.94 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -56, scale: 0.94 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="partner-stage relative z-10 flex w-[min(100%,280px)] flex-col items-center rounded-[24px] px-4 py-7 sm:w-[380px] sm:rounded-[40px] sm:px-10 sm:py-12"
              >
                <div className="partner-glow" aria-hidden="true" />
                <LogoTile src={current.logo} alt={`${current.label} logo`} size="lg" />
                <p className="mt-6 text-2xl font-medium tracking-tight text-white sm:mt-8 sm:text-4xl">
                  {current.label}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                  <span className="text-xs uppercase tracking-[0.22em] text-white/55">Connected</span>
                </div>
                <p className="mt-5 text-center text-sm leading-relaxed text-white/40">
                  Verified partner rail for digital note delivery.
                </p>
              </motion.article>
            </AnimatePresence>

            <SideCard platform={next} side="right" onClick={() => go(1)} />
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Previous partner"
              onClick={() => go(-1)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-lg text-white transition hover:bg-white hover:text-black"
            >
              ←
            </button>
            <div className="flex max-w-[min(100%,220px)] flex-wrap items-center justify-center gap-1 sm:max-w-none" role="tablist" aria-label="Partners">
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
                    className="flex h-11 w-11 items-center justify-center"
                  >
                    <span
                      className={`block h-2 overflow-hidden rounded-full transition-all ${
                        selected ? "w-8 bg-white/25" : "w-2 bg-white/25"
                      }`}
                    >
                      {selected ? (
                        <span
                          key={`${platform.id}-progress-${active}-${paused ? "p" : "r"}`}
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

      <div className="relative mt-16">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-black to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-black to-transparent sm:w-24" />
        <div
          ref={stripRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-5 pb-2 sm:gap-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                className={`partner-chip flex min-w-[min(78vw,220px)] shrink-0 snap-center items-center gap-3 rounded-[22px] border px-3.5 py-3.5 text-left transition sm:min-w-[220px] sm:gap-4 sm:rounded-[26px] sm:px-4 sm:py-4 ${
                  selected
                    ? "border-white bg-white text-black shadow-[0_18px_50px_rgba(255,255,255,0.14)]"
                    : "border-white/12 bg-white/[0.03] text-white hover:border-white/35"
                }`}
              >
                <LogoTile src={platform.logo} alt="" size="sm" selected={selected} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium tracking-tight">{platform.label}</span>
                  <span
                    className={`mt-1 block text-[10px] uppercase tracking-[0.2em] ${
                      selected ? "text-black/50" : "text-white/40"
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
  size: "sm" | "md" | "lg";
  selected?: boolean;
}) {
  const box =
    size === "lg"
      ? "h-28 w-28 rounded-[26px] sm:h-40 sm:w-40 sm:rounded-[32px]"
      : size === "md"
        ? "h-20 w-20 rounded-[22px]"
        : "h-12 w-12 rounded-2xl sm:h-14 sm:w-14";
  const px = size === "lg" ? 160 : size === "md" ? 80 : 56;

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border bg-white ${box} ${
        selected ? "border-black/10 shadow-none" : "border-white/20 shadow-[0_16px_40px_rgba(255,255,255,0.1)]"
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

function SideCard({
  platform,
  side,
  onClick,
}: {
  platform: (typeof platforms)[number];
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      key={`${side}-${platform.id}`}
      initial={{ opacity: 0.3 }}
      animate={{ opacity: 0.55 }}
      transition={{ duration: 0.35 }}
      onClick={onClick}
      aria-label={`Show ${platform.label}`}
      className={`absolute top-1/2 z-0 hidden w-[240px] -translate-y-1/2 rounded-[32px] border border-white/10 bg-white/[0.03] px-6 py-8 text-left transition hover:opacity-90 md:block ${
        side === "left" ? "left-4 -rotate-6 lg:left-10" : "right-4 rotate-6 lg:right-10"
      }`}
    >
      <LogoTile src={platform.logo} alt="" size="md" />
      <span className="mt-5 block text-xl font-medium tracking-tight text-white">{platform.label}</span>
      <span className="mt-2 block text-[10px] uppercase tracking-[0.2em] text-white/35">Connected</span>
    </motion.button>
  );
}
