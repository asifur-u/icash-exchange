"use client";

import { motion } from "motion/react";
import { Frame } from "@/components/frame";
import { platforms } from "@/lib/platforms";

export function Platforms() {
  const loop = [...platforms, ...platforms];

  return (
    <section className="border-t border-white/10 py-16 md:py-24">
      <Frame>
        <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">Connected</p>
        <h2 className="mt-3 max-w-xl display text-4xl leading-none sm:text-5xl">
          Platforms iCash works with.
        </h2>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
          Payment rails and rails we wire into the desk. More can be added as agreements land.
        </p>
      </Frame>

      <div className="relative mt-10 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-black to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-black to-transparent" />
        <div className="marquee-track flex gap-4 px-4">
          {loop.map((platform, index) => (
            <motion.div
              key={`${platform.id}-${index}`}
              whileHover={{ y: -6, scale: 1.03 }}
              className="premium-card flex min-w-[168px] flex-col items-start gap-4 rounded-[24px] px-5 py-5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white text-sm font-bold text-black">
                {platform.short}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{platform.label}</p>
                <p className="mt-1 text-xs text-muted">Connected</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
