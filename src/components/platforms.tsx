"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Frame } from "@/components/frame";
import { useT } from "@/i18n/provider";
import { platforms, type Platform } from "@/lib/platforms";

const INTERVAL_MS = 3200;
const RESUME_MS = 5000;

const payments = [
  { id: "bkash", label: "bKash", logo: "/payments/bkash.png" },
  { id: "nagad", label: "Nagad", logo: "/payments/nagad.png" },
  { id: "rocket", label: "Rocket", logo: "/payments/rocket.png" },
  { id: "bank", label: "Bank", line: "NPSB / BEFTN", logo: "/payments/bank.png" },
] as const;

export function Platforms() {
  const t = useT();
  const roleLabel: Record<Platform["role"], string> = {
    network: t("home.roleNetwork"),
    marketplace: t("home.roleMarketplace"),
    distributor: t("home.roleDistributor"),
    agent: t("home.roleAgent"),
    payments: t("home.rolePayments"),
  };
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [soft, setSoft] = useState(false);
  const resumeTimer = useRef<number | null>(null);
  const count = platforms.length;

  useEffect(() => {
    setSoft(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % count);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, count]);

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
        <div className="relative mx-auto max-w-5xl">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
            {t("home.networkCollaborators")}
          </p>
          <div className="relative flex min-h-[280px] items-center justify-center sm:min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.article
                key={current.id}
                initial={{ opacity: 0, x: soft ? 0 : 40, scale: soft ? 1 : 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: soft ? 0 : -40, scale: soft ? 1 : 0.96 }}
                transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
                className="partner-stage relative z-10 flex w-[min(100%,300px)] flex-col items-center rounded-[28px] px-5 py-8 sm:w-[360px] sm:rounded-[36px] sm:px-10 sm:py-10"
              >
                <LogoTile src={current.logo} alt={`${current.label} logo`} size="lg" />
                <p className="mt-6 text-2xl font-semibold tracking-tight text-white sm:mt-7 sm:text-3xl">
                  {current.label}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black px-3.5 py-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9fe870]/70 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#9fe870]" />
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/60">
                    {roleLabel[current.role]}
                  </span>
                </div>
                <p className="mt-5 text-center text-sm leading-relaxed text-white/40">{current.blurb}</p>
                {current.href ? (
                  <a
                    href={current.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 text-xs font-semibold text-white/70 underline decoration-white/20 underline-offset-4 transition hover:text-white"
                  >
                    {t("home.openCollaborator")}
                  </a>
                ) : null}
              </motion.article>
            </AnimatePresence>
          </div>

          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label={t("home.prevCollaborator")}
              onClick={() => go(-1)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-lg text-white transition hover:bg-white hover:text-black"
            >
              ←
            </button>
            <div
              className="flex max-w-[min(100%,260px)] flex-wrap items-center justify-center gap-1.5"
              role="tablist"
              aria-label={t("home.partnersEyebrow")}
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
              aria-label={t("home.nextCollaborator")}
              onClick={() => go(1)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white text-lg text-black transition hover:bg-white/85"
            >
              →
            </button>
          </div>
        </div>
      </Frame>

      <Frame className="mt-16 sm:mt-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{t("home.payRails")}</p>
          <h3 className="mt-3 display-soft text-[clamp(1.8rem,6vw,2.8rem)]">
            {t("home.payRailsLead")} <span className="accent-red">{t("home.payRailsAccent")}</span>
          </h3>
        </div>
      </Frame>

      <div className="relative mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-3 px-5 sm:mt-10">
        {payments.map((method) => (
          <div
            key={method.id}
            className="flex w-[132px] flex-col items-center gap-2 rounded-[22px] border border-white/12 bg-black px-4 py-4 sm:w-[150px]"
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
                {"line" in method ? method.line : t("home.sendMoney")}
              </span>
            </span>
          </div>
        ))}
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
  const wide = src.includes("wordmark");
  const box = wide
    ? size === "lg"
      ? "h-20 w-[11.5rem] rounded-[22px] px-4 sm:h-24 sm:w-[14rem] sm:rounded-[26px]"
      : "h-12 w-[7.5rem] rounded-2xl px-2.5 sm:h-14 sm:w-[8.5rem]"
    : size === "lg"
      ? "h-28 w-28 rounded-[26px] sm:h-36 sm:w-36 sm:rounded-[30px]"
      : "h-12 w-12 rounded-2xl sm:h-14 sm:w-14";
  const px = size === "lg" ? 144 : 56;

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border ${box} ${
        selected ? "border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]" : "border-white/15 bg-white"
      }`}
    >
      {wide ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          width={size === "lg" ? 180 : 120}
          height={size === "lg" ? 35 : 23}
          className={
            size === "lg"
              ? "h-8 w-[10.5rem] object-contain object-center sm:h-9 sm:w-[12rem]"
              : "h-4 w-[6.2rem] object-contain object-center sm:h-[1.15rem] sm:w-[7rem]"
          }
          draggable={false}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={px}
          height={px}
          unoptimized
          className={
            src.endsWith(".svg") ? "h-full w-full object-cover" : "h-[86%] w-[86%] object-contain"
          }
        />
      )}
    </span>
  );
}
