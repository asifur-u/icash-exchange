"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Frame } from "@/components/frame";
import { useT } from "@/i18n/provider";
import { platforms, type Platform } from "@/lib/platforms";

gsap.registerPlugin(ScrollTrigger);

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
  const stripRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const bannerRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const count = platforms.length;

  useEffect(() => {
    setSoft(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (soft || !bannerRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: bannerRef.current,
          start: "top 82%",
          once: true,
        },
      });

      tl.from(".partner-banner-glow", {
        opacity: 0,
        scale: 0.85,
        duration: 1.1,
        ease: "power3.out",
      })
        .from(
          ".partner-banner-seal",
          { scale: 0.4, opacity: 0, rotate: -18, duration: 0.7, ease: "back.out(1.7)" },
          "-=0.7",
        )
        .from(
          ".partner-banner-copy > *",
          { y: 28, opacity: 0, stagger: 0.1, duration: 0.55, ease: "power2.out" },
          "-=0.45",
        )
        .from(
          ".partner-banner-link",
          { y: 16, opacity: 0, duration: 0.45, ease: "power2.out" },
          "-=0.2",
        );

      gsap.to(".partner-banner-orbit", {
        rotate: 360,
        duration: 18,
        repeat: -1,
        ease: "none",
      });

      gsap.to(".partner-banner-pulse", {
        scale: 1.15,
        opacity: 0.35,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, bannerRef);

    return () => ctx.revert();
  }, [soft]);

  useEffect(() => {
    if (soft || !sealRef.current) return;
    const tween = gsap.to(sealRef.current, {
      y: -6,
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    return () => {
      tween.kill();
    };
  }, [soft]);

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
          <p className="eyebrow">{t("home.partnersEyebrow")}</p>
          <h2 className="mt-4 display text-[clamp(2.2rem,9vw,4.6rem)]">
            {t("home.partnersTitle")} <span className="accent-red">icash.one</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/50 sm:text-lg">
            {t("home.partnersLead")}
          </p>
        </div>

        <div
          ref={bannerRef}
          className="relative mx-auto mt-10 max-w-4xl overflow-hidden rounded-[28px] border border-white/15 bg-[#0c0c0c] sm:mt-14 sm:rounded-[34px]"
        >
          <div
            aria-hidden="true"
            className="partner-banner-glow pointer-events-none absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#ff2d2d]/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="partner-banner-glow pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="partner-banner-orbit pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/10"
          />

          <div className="relative grid items-center gap-6 px-5 py-7 sm:grid-cols-[auto_1fr_auto] sm:gap-8 sm:px-8 sm:py-9">
            <div ref={sealRef} className="partner-banner-seal relative mx-auto sm:mx-0">
              <span
                aria-hidden="true"
                className="partner-banner-pulse absolute inset-[-8px] rounded-[28px] border border-[#da000f]/45"
              />
              <div className="relative flex h-[5.5rem] w-[11.5rem] flex-col items-center justify-center rounded-[24px] border border-white/20 bg-gradient-to-br from-[#1a1a1a] to-black px-4 py-3 shadow-[0_0_40px_rgba(218,0,15,0.28)] sm:h-[6.25rem] sm:w-[13rem]">
                {/* Native img keeps official SVG crisp (Next/Image softens it). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/icash-one-wordmark.svg"
                  alt="icash.one"
                  width={150}
                  height={29}
                  className="h-7 w-[9.4rem] object-contain object-center sm:h-8 sm:w-[10.5rem]"
                  draggable={false}
                />
                <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.18em] text-[#da000f] sm:text-[9px]">
                  {t("home.officialPartner")}
                </p>
              </div>
            </div>

            <div className="partner-banner-copy text-center sm:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                {t("home.authorizationSeal")}
              </p>
              <h3 className="mt-2 text-[clamp(1.35rem,4vw,1.9rem)] font-semibold tracking-tight text-white">
                {t("home.partnerHeading")}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
                {t("home.partnerBody")}
              </p>
            </div>

            <a
              href="https://www.icash.one"
              target="_blank"
              rel="noopener noreferrer"
              className="partner-banner-link inline-flex h-12 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              {t("home.visitIcash")}
            </a>
          </div>
        </div>

        <div className="relative mx-auto mt-12 max-w-5xl sm:mt-16">
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

      <div className="relative mx-auto mt-12 max-w-5xl px-5 sm:mt-16">
        <div
          ref={stripRef}
          className="flex flex-wrap justify-center gap-3"
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
                className={`flex flex-col items-center gap-2.5 rounded-[22px] border px-4 py-4 transition ${
                  platform.logo.includes("wordmark")
                    ? "w-[168px] sm:w-[180px]"
                    : "w-[148px] sm:w-[156px]"
                } ${
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
                    {roleLabel[platform.role]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
