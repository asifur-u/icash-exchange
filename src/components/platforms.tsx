"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Frame } from "@/components/frame";
import { platforms } from "@/lib/platforms";

const INTERVAL_MS = 2800;
const RESUME_MS = 5000;

export function Platforms() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const resumeTimer = useRef<number | null>(null);
  const count = platforms.length;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(!reduce);
  }, []);

  useEffect(() => {
    if (!enabled || paused) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % count);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled, paused, count]);

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
    <section id="partners" className="relative overflow-hidden border-t border-white/10 py-24 md:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-white/[0.04] blur-[100px]"
      />

      <Frame>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">Partners</p>
          <h2 className="mt-4 display text-4xl sm:text-5xl md:text-6xl">
            Desks we connect with.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/50">
            Real platforms. Live connections. Built so buyers trust the desk at a glance.
          </p>
        </div>

        <div
          className="relative mx-auto mt-16 max-w-5xl"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
        >
          <div className="pointer-events-none absolute inset-y-8 left-0 z-20 w-16 bg-gradient-to-r from-black to-transparent sm:w-28" />
          <div className="pointer-events-none absolute inset-y-8 right-0 z-20 w-16 bg-gradient-to-l from-black to-transparent sm:w-28" />

          <div className="relative flex h-[380px] items-center justify-center sm:h-[420px]">
            <SideCard platform={prev} side="left" onClick={() => go(-1)} />

            <AnimatePresence mode="wait">
              <motion.article
                key={current.id}
                initial={{ opacity: 0, x: 48, scale: 0.94 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -48, scale: 0.94 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="partner-stage relative z-10 flex w-[min(100%,340px)] flex-col items-center rounded-[40px] px-8 py-10 sm:w-[380px] sm:px-10 sm:py-12"
              >
                <div className="partner-glow" aria-hidden="true" />
                <div className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-[32px] border border-white/25 bg-white shadow-[0_30px_80px_rgba(255,255,255,0.12)] sm:h-40 sm:w-40">
                  <Image
                    src={current.logo}
                    alt={`${current.label} logo`}
                    width={160}
                    height={160}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="mt-8 text-3xl font-medium tracking-tight text-white sm:text-4xl">
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
            <div className="flex items-center gap-2" role="tablist" aria-label="Partners">
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
                    className={`h-2 overflow-hidden rounded-full transition-all ${
                      selected ? "w-8 bg-white/25" : "w-2 bg-white/25 hover:bg-white/50"
                    }`}
                  >
                    {selected && enabled ? (
                      <span
                        key={`${platform.id}-progress`}
                        className="block h-full rounded-full bg-white"
                        style={{
                          animation: paused ? "none" : `partner-progress ${INTERVAL_MS}ms linear`,
                          width: paused ? "100%" : undefined,
                        }}
                      />
                    ) : null}
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

      <div className="relative mt-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-black to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-black to-transparent" />
        <div className="marquee-track flex gap-4 px-4">
          {[...platforms, ...platforms].map((platform, index) => (
            <button
              key={`${platform.id}-strip-${index}`}
              type="button"
              onClick={() => pick(index % count)}
              className={`partner-chip flex min-w-[200px] items-center gap-4 rounded-[24px] border px-4 py-4 text-left transition ${
                index % count === active
                  ? "border-white/35 bg-white/[0.08]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/25"
              }`}
            >
              <span className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white">
                <Image
                  src={platform.logo}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              </span>
              <span>
                <span className="block text-sm font-medium tracking-tight text-white">{platform.label}</span>
                <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-white/40">
                  Connected
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
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
      initial={{ opacity: 0.35 }}
      animate={{ opacity: 0.55 }}
      transition={{ duration: 0.35 }}
      onClick={onClick}
      aria-label={`Show ${platform.label}`}
      className={`absolute top-1/2 z-0 hidden w-[240px] -translate-y-1/2 rounded-[32px] border border-white/10 bg-white/[0.03] px-6 py-8 text-left transition hover:opacity-90 md:block ${
        side === "left" ? "left-4 -rotate-6 lg:left-10" : "right-4 rotate-6 lg:right-10"
      }`}
    >
      <span className="flex h-20 w-20 overflow-hidden rounded-[22px] bg-white">
        <Image
          src={platform.logo}
          alt=""
          width={80}
          height={80}
          unoptimized
          className="h-full w-full object-cover"
        />
      </span>
      <span className="mt-5 block text-xl font-medium tracking-tight text-white">{platform.label}</span>
      <span className="mt-2 block text-[10px] uppercase tracking-[0.2em] text-white/35">Connected</span>
    </motion.button>
  );
}
