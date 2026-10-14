"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
} from "motion/react";
import { Frame } from "@/components/frame";
import { MONTHLY_GIFT, REWARD_TIERS } from "@/lib/rewards";

const maxBonus = Math.max(...REWARD_TIERS.map((tier) => tier.bonusPercent));

function CountPercent({ value, delay = 0 }: { value: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 18, mass: 0.7 });
  const display = useTransform(spring, (v) =>
    Number.isInteger(value) ? `${Math.round(v)}%` : `${v.toFixed(2)}%`,
  );
  const [text, setText] = useState("0%");

  useEffect(() => {
    const unsub = display.on("change", setText);
    return unsub;
  }, [display]);

  useEffect(() => {
    if (!inView) return;
    const t = window.setTimeout(() => mv.set(value), delay * 1000);
    return () => window.clearTimeout(t);
  }, [inView, mv, value, delay]);

  return (
    <motion.span
      ref={ref}
      className="inline-block tabular-nums"
      animate={inView ? { scale: [1, 1.12, 1] } : undefined}
      transition={{ delay: delay + 0.35, duration: 0.45 }}
    >
      {text}
    </motion.span>
  );
}

function ShineSweep({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/70 to-transparent"
      initial={{ x: "-120%", opacity: 0 }}
      animate={{ x: ["-120%", "220%"], opacity: [0, 1, 0] }}
      transition={{
        duration: 1.6,
        delay,
        repeat: Infinity,
        repeatDelay: 1.8,
        ease: "easeInOut",
      }}
    />
  );
}

export function RewardsExplorer() {
  return (
    <div className="relative overflow-hidden pb-24 pt-16 sm:pb-32 sm:pt-24">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/[0.07] blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-40 h-64 w-64 rounded-full bg-white/[0.05] blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, -20, 0], scale: [1.1, 0.95, 1.1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <Frame className="relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
        >
          <motion.p
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45"
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          >
            Loyalty ladder
          </motion.p>
          <h1 className="display mt-4 max-w-[16ch] text-[clamp(2.3rem,7.5vw,4.2rem)] leading-[0.88] text-white">
            {"Climb from Silver to Diamond.".split(" ").map((word, i) => (
              <motion.span
                key={word + i}
                className="mr-[0.28em] inline-block"
                initial={{ opacity: 0, y: 48, rotateX: -40 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 220,
                  damping: 18,
                  delay: 0.08 + i * 0.07,
                }}
              >
                {word}
              </motion.span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base"
          >
            Every confirmed desk order this month counts. Hit the next spend step and unlock a
            higher special bonus — built to feel premium, clear, and worth chasing.
          </motion.p>

          <div className="mt-7 flex flex-wrap gap-2">
            {REWARD_TIERS.map((tier, index) => (
              <motion.span
                key={tier.id}
                initial={{ opacity: 0, y: 20, scale: 0.7 }}
                animate={{
                  opacity: 1,
                  y: [0, -4, 0],
                  scale: 1,
                }}
                transition={{
                  opacity: { delay: 0.35 + index * 0.1 },
                  scale: { type: "spring", delay: 0.35 + index * 0.1, stiffness: 260, damping: 14 },
                  y: {
                    delay: 1.2 + index * 0.15,
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                whileHover={{ scale: 1.08, y: -6 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/90 shadow-[0_0_24px_rgba(255,255,255,0.06)]"
              >
                <motion.span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: tier.accent }}
                  animate={{
                    boxShadow: [
                      `0 0 0px ${tier.accent}00`,
                      `0 0 14px ${tier.accent}`,
                      `0 0 0px ${tier.accent}00`,
                    ],
                    scale: [1, 1.35, 1],
                  }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.25 }}
                />
                {tier.name}
                <span className="text-white/40">{tier.bonusPercent}%</span>
              </motion.span>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-7 flex flex-wrap gap-3"
          >
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/#desk"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Start earning on the desk
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <a
                href="#ladder"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-6 text-sm font-semibold text-white transition hover:border-white/45"
              >
                See the ladder
              </a>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Animated chart */}
        <motion.section
          id="ladder"
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: "spring", stiffness: 100, damping: 16 }}
          className="relative mt-14 overflow-hidden rounded-[28px] border border-white/12 bg-[#0f0f0f] p-5 shadow-[0_40px_100px_rgba(0,0,0,0.45)] sm:mt-16 sm:rounded-[34px] sm:p-8"
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1), transparent 35%), radial-gradient(circle at 80% 0%, rgba(232,213,163,0.12), transparent 30%)",
            }}
            animate={{ opacity: [0.35, 0.75, 0.35], scale: [1, 1.04, 1] }}
            transition={{ duration: 4.5, repeat: Infinity }}
          />

          {/* floating sparks */}
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className="pointer-events-none absolute h-1 w-1 rounded-full bg-white"
              style={{ left: `${12 + i * 18}%`, top: `${18 + (i % 3) * 22}%` }}
              animate={{
                y: [0, -18, 0],
                opacity: [0, 1, 0],
                scale: [0.5, 1.4, 0.5],
              }}
              transition={{
                duration: 2.4,
                delay: i * 0.35,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          <div className="relative flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                Bonus chart
              </p>
              <h2 className="display-soft mt-2 text-2xl text-white sm:text-3xl">
                Monthly spend ladder
              </h2>
              <p className="mt-2 text-sm text-white/45">
                Four clear steps — Silver, Gold, Platinum, Diamond
              </p>
            </div>
            <motion.p
              className="text-xs font-semibold text-white/50"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              ● Live animated preview
            </motion.p>
          </div>

          {/* Step path */}
          <div className="relative mt-8 flex flex-wrap items-center gap-2 sm:flex-nowrap sm:justify-between">
            {REWARD_TIERS.map((tier, index) => (
              <div key={`path-${tier.id}`} className="flex flex-1 items-center min-w-[42%] sm:min-w-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 12 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    type: "spring",
                    stiffness: 280,
                    damping: 14,
                    delay: index * 0.12,
                  }}
                  whileHover={{ scale: 1.06 }}
                  className="relative flex items-center gap-2 overflow-hidden rounded-full border border-white/20 bg-white/[0.07] px-3 py-1.5"
                >
                  <ShineSweep delay={0.8 + index * 0.4} />
                  <motion.span
                    className="relative text-[10px] font-semibold text-white/45"
                    animate={{ color: ["#ffffff73", "#ffffff", "#ffffff73"] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                  >
                    0{index + 1}
                  </motion.span>
                  <span className="relative text-xs font-bold text-white">{tier.name}</span>
                </motion.div>
                {index < REWARD_TIERS.length - 1 ? (
                  <div className="relative mx-2 hidden h-px flex-1 overflow-hidden bg-white/10 sm:block">
                    <motion.div
                      className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white to-transparent"
                      animate={{ x: ["-100%", "300%"] }}
                      transition={{
                        duration: 1.8,
                        delay: 0.6 + index * 0.2,
                        repeat: Infinity,
                        repeatDelay: 1.2,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="relative mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-4 sm:gap-4">
            {REWARD_TIERS.map((tier, index) => {
              const heightPct = (tier.bonusPercent / maxBonus) * 100;
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 40, rotateY: -12 }}
                  whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    type: "spring",
                    stiffness: 140,
                    damping: 14,
                    delay: index * 0.12,
                  }}
                  whileHover={{
                    y: -8,
                    scale: 1.03,
                    boxShadow: `0 20px 50px ${tier.accent}22`,
                  }}
                  className="flex flex-col rounded-[20px] border border-white/10 bg-white/[0.04] p-3 sm:p-4"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <motion.span
                      className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-black"
                      style={{ backgroundColor: tier.accent }}
                      animate={{
                        boxShadow: [
                          `0 0 0px ${tier.accent}00`,
                          `0 0 18px ${tier.accent}aa`,
                          `0 0 0px ${tier.accent}00`,
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                    >
                      {tier.name}
                    </motion.span>
                    <span className="text-[10px] font-semibold text-white/35">Step 0{index + 1}</span>
                  </div>

                  <p className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    <CountPercent value={tier.bonusPercent} delay={0.2 + index * 0.12} />
                  </p>
                  <p className="mt-1 text-xs text-white/45">special bonus</p>

                  <div className="relative mt-4 flex h-40 items-end sm:h-48">
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${heightPct}%` }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{
                        type: "spring",
                        stiffness: 70,
                        damping: 12,
                        delay: 0.2 + index * 0.16,
                      }}
                      className="relative w-full overflow-hidden rounded-t-xl"
                      style={{
                        background: `linear-gradient(180deg, ${tier.accent} 0%, #ffffff 48%, #c8c8c8 100%)`,
                        boxShadow: `0 0 40px ${tier.accent}55`,
                      }}
                    >
                      <ShineSweep delay={1 + index * 0.25} />
                      <motion.div
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white to-transparent"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, 12, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.15 }}
                      />
                      <motion.div
                        className="absolute inset-x-0 bottom-2 flex justify-center"
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, delay: index * 0.2 }}
                      >
                        <span className="rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white">
                          {tier.name}
                        </span>
                      </motion.div>
                    </motion.div>
                  </div>

                  <motion.p
                    className="mt-3 text-sm font-semibold text-white"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    {tier.label}
                  </motion.p>
                  <p className="text-xs text-white/40">
                    ৳{tier.spendBdt.toLocaleString("en-IN")}+
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Tier cards */}
        <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2">
          {REWARD_TIERS.map((tier, index) => (
            <motion.article
              key={tier.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -36 : 36 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ type: "spring", stiffness: 120, damping: 16, delay: index * 0.08 }}
              whileHover={{ y: -10, scale: 1.015 }}
              className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] p-5 sm:p-6"
            >
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl"
                style={{ backgroundColor: tier.accent }}
                animate={{ scale: [1, 1.35, 1], opacity: [0.2, 0.5, 0.2], rotate: [0, 40, 0] }}
                transition={{ duration: 3.5 + index * 0.4, repeat: Infinity }}
              />
              <ShineSweep delay={1.5 + index * 0.5} />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                    {tier.label} step
                  </p>
                  <h3 className="display-soft mt-2 text-2xl text-white">{tier.name}</h3>
                  <p className="mt-1 text-lg font-semibold text-white/80">
                    {tier.bonusPercent}% bonus
                  </p>
                </div>
                <motion.span
                  className="rounded-full border px-3 py-1 text-xs font-semibold text-black"
                  style={{ backgroundColor: tier.accent, borderColor: `${tier.accent}66` }}
                  whileHover={{ scale: 1.1, rotate: -3 }}
                >
                  ৳{tier.spendBdt.toLocaleString("en-IN")}+
                </motion.span>
              </div>
              <p className="relative mt-3 text-sm leading-relaxed text-white/50">{tier.blurb}</p>
            </motion.article>
          ))}
        </div>

        {/* Special gift */}
        <motion.section
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 110, damping: 14 }}
          className="relative mt-8 overflow-hidden rounded-[28px] border border-white/15 bg-white px-5 py-7 text-black sm:mt-10 sm:rounded-[34px] sm:px-8 sm:py-9"
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-black/[0.06]"
            animate={{ scale: [1, 1.25, 1], rotate: [0, 25, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-8 top-6 h-16 w-16 rounded-full border border-black/10"
            animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/40">
            Diamond exclusive
          </p>
          <h2 className="display-soft mt-2 text-2xl sm:text-3xl">{MONTHLY_GIFT.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/55 sm:text-[15px]">
            {MONTHLY_GIFT.blurb}
          </p>
          <motion.div
            className="mt-5 inline-flex flex-wrap items-center gap-3 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
            animate={{
              boxShadow: [
                "0 0 0px rgba(0,0,0,0)",
                "0 0 28px rgba(0,0,0,0.35)",
                "0 0 0px rgba(0,0,0,0)",
              ],
            }}
            transition={{ duration: 2.2, repeat: Infinity }}
            whileHover={{ scale: 1.04 }}
          >
            <span>৳{MONTHLY_GIFT.giftBdt.toLocaleString("en-IN")} gift</span>
            <span className="text-white/35">·</span>
            <span className="text-white/70">when the month crosses 10 lakh</span>
          </motion.div>
        </motion.section>

        {/* How it works */}
        <section className="mt-14 sm:mt-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            How you climb
          </p>
          <h2 className="display-soft mt-2 text-2xl text-white sm:text-3xl">
            Attractive. Organised. Clear.
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Buy on the desk",
                body: "Confirmed orders this month add to your BDT spend total automatically.",
              },
              {
                step: "02",
                title: "Unlock the next metal",
                body: "Pass 1, 3, 5, or 10 lakh to move Silver → Gold → Platinum → Diamond.",
              },
              {
                step: "03",
                title: "Collect the reward",
                body: "Bonus rate and the ৳5,000 Diamond gift (if eligible) are applied after month close.",
              },
            ].map((item, index) => (
              <motion.li
                key={item.step}
                initial={{ opacity: 0, y: 28, scale: 0.94 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 160,
                  damping: 14,
                  delay: index * 0.12,
                }}
                whileHover={{ y: -6, borderColor: "rgba(255,255,255,0.28)" }}
                className="rounded-[22px] border border-white/10 bg-white/[0.03] p-5"
              >
                <motion.p
                  className="text-[11px] font-semibold tracking-[0.16em] text-white/35"
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.3 }}
                >
                  {item.step}
                </motion.p>
                <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{item.body}</p>
              </motion.li>
            ))}
          </ol>
        </section>
      </Frame>
    </div>
  );
}
