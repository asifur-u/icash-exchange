"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Frame } from "@/components/frame";
import { useT } from "@/i18n/provider";

const RAILS = [
  { src: "/payments/bkash.png", alt: "bKash" },
  { src: "/payments/nagad.png", alt: "Nagad" },
  { src: "/payments/rocket.png", alt: "Rocket" },
  { src: "/payments/bank.png", alt: "Bank" },
] as const;

const pop = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 480, damping: 32 } },
};

function Beat({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={pop} className={className}>
      {children}
    </motion.div>
  );
}

function useReduced() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return reduce;
}

function Taka({ amount, prefix = "" }: { amount: number; prefix?: string }) {
  const text = useCount(amount, useReduced());
  return (
    <>
      {prefix}
      {text}
    </>
  );
}

function useCount(to: number, reduce: boolean) {
  const [value, setValue] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce) {
      setValue(to);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 720);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(to * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, reduce]);
  return value.toLocaleString("en-US");
}

function Line({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <motion.div variants={pop} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black px-3 py-2.5">
      <span className="shrink-0 text-[11px] font-medium text-white/40">{label}</span>
      <span className={`truncate text-right text-sm text-white ${mono ? "font-mono tracking-wide" : "font-medium"}`}>{value}</span>
    </motion.div>
  );
}

function PayPick({ selected }: { selected: string }) {
  return (
    <motion.div variants={pop} className="grid grid-cols-4 gap-1.5">
      {RAILS.map((rail, index) => {
        const on = rail.alt === selected;
        return (
          <motion.div
            key={rail.alt}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + index * 0.05, type: "spring", stiffness: 420, damping: 28 }}
            className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 ${
              on ? "border-white bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.18)]" : "border-white/10 text-white/70"
            }`}
          >
            <img src={rail.src} alt="" className="h-7 w-7 rounded-md bg-white object-contain p-0.5" />
            <span className="text-[10px] font-semibold leading-none">{rail.alt}</span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="space-y-2"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.06 } } }}
    >
      {children}
    </motion.div>
  );
}

function Lane({
  id,
  kicker,
  title,
  lead,
  steps,
  start = 0,
}: {
  id: string;
  kicker: string;
  title: string;
  lead: string;
  steps: { n: string; title: string; body: string; scene: React.ReactNode }[];
  start?: number;
}) {
  const [active, setActive] = useState(start);
  const [reduce, setReduce] = useState(false);
  const step = steps[active] ?? steps[0]!;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const id = window.setTimeout(() => setActive((current) => (current + 1) % steps.length), 4200);
    return () => window.clearTimeout(id);
  }, [active, reduce, steps.length]);

  return (
    <motion.article
      className="min-w-0"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">{kicker}</p>
      <h3 className="mt-3 text-[1.7rem] font-semibold tracking-tight text-white sm:text-4xl">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-white/50 sm:text-base">{lead}</p>

      <div className="relative mt-6 overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        {!reduce ? (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[#ff2d2d]/25 blur-3xl"
            animate={{ x: [0, 80, 20], y: [0, 36, 8] }}
            transition={{ duration: 9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          />
        ) : null}
        <motion.p
          key={step.n}
          aria-hidden="true"
          className="pointer-events-none absolute -right-1 top-8 select-none font-semibold leading-none tracking-tighter text-white/[0.045] text-[7.5rem]"
          initial={reduce ? false : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
        >
          {step.n}
        </motion.p>
        <div className="absolute inset-x-5 top-4 z-10 flex gap-1.5">
          {steps.map((item, index) => (
            <span key={item.n} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/15">
              {index === active && !reduce ? (
                <motion.span
                  className="block h-full w-full origin-left bg-white"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 4.2, ease: "linear" }}
                />
              ) : (
                <span className={`block h-full w-full origin-left bg-white ${index < active ? "scale-x-100" : "scale-x-0"}`} />
              )}
            </span>
          ))}
        </div>

        <div className="relative min-h-[360px] px-5 pb-6 pt-12 sm:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.n}
              initial={reduce ? false : { opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -18 }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            >
              <p className="font-mono text-xs font-semibold text-white/35">{step.n}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{step.title}</p>
              <p className="mt-1 max-w-sm text-sm leading-relaxed text-white/55">{step.body}</p>
              <div className="mt-4">{step.scene}</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {steps.map((item, index) => {
          const on = index === active;
          return (
            <button
              key={item.n}
              type="button"
              onClick={() => setActive(index)}
              aria-current={on ? "step" : undefined}
              className={`relative overflow-hidden rounded-2xl border px-2 py-3 text-left ${
                on ? "border-transparent text-black" : "border-white/10 text-white/55 hover:border-white/30 hover:text-white"
              }`}
            >
              {on ? (
                <motion.span
                  layoutId={`${id}-pill`}
                  className="absolute inset-0 bg-white"
                  transition={{ type: "spring", stiffness: 520, damping: 38 }}
                />
              ) : null}
              <span className="relative z-10 block font-mono text-[10px] font-semibold opacity-60">{item.n}</span>
              <span className="relative z-10 mt-1 block text-xs font-semibold tracking-tight sm:text-sm">{item.title}</span>
            </button>
          );
        })}
      </div>
    </motion.article>
  );
}

export function DeskPaths() {
  const t = useT();

  const buy = [
    {
      n: "01",
      title: t("lanes.buy1Title"),
      body: t("lanes.buy1Body"),
      scene: (
        <Sheet>
          <Line label={t("buyForm.name")} value={t("lanes.guideName")} />
          <Line label={t("buyForm.email")} value={t("lanes.guideMail")} />
          <Line label={t("buyForm.phone")} value={t("lanes.guidePhone")} mono />
        </Sheet>
      ),
    },
    {
      n: "02",
      title: t("lanes.buy2Title"),
      body: t("lanes.buy2Body"),
      scene: (
        <Sheet>
          <Beat>
            <div className="rounded-xl border border-white/10 bg-black px-4 py-3">
              <p className="text-[11px] font-medium text-white/40">{t("buyForm.amount")}</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-white">
                <Taka amount={1000} />
              </p>
            </div>
          </Beat>
          <Beat>
            <div className="rounded-xl bg-white px-4 py-3 text-black">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">{t("buyForm.youSend")}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                <Taka amount={1025} prefix="BDT " />
              </p>
            </div>
          </Beat>
        </Sheet>
      ),
    },
    {
      n: "03",
      title: t("lanes.buy3Title"),
      body: t("lanes.buy3Body"),
      scene: (
        <Sheet>
          <PayPick selected="bKash" />
          <Beat>
            <div className="rounded-xl bg-white px-4 py-3 text-black">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">{t("buyForm.sendExactly")}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                <Taka amount={1025} prefix="BDT " />
              </p>
              <p className="mt-2 font-mono text-lg font-semibold">01XXXXXXXXX</p>
            </div>
          </Beat>
        </Sheet>
      ),
    },
    {
      n: "04",
      title: t("lanes.buy4Title"),
      body: t("lanes.buy4Body"),
      scene: (
        <Sheet>
          <Line label={t("buyForm.trx")} value={t("lanes.guideTrx")} mono />
          <Beat className="flex items-center gap-3 rounded-xl border border-dashed border-white/20 bg-black px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
                <circle cx="5.5" cy="6.5" r="1" />
                <path d="M2 11.5l3.2-3 2.3 2 2-1.6L14 12" />
              </svg>
            </span>
            <span className="text-sm font-medium text-white">{t("lanes.guideShot")}</span>
          </Beat>
        </Sheet>
      ),
    },
  ];

  const sell = [
    {
      n: "01",
      title: t("lanes.sell1Title"),
      body: t("lanes.sell1Body"),
      scene: (
        <Sheet>
          <Line label={t("buyForm.name")} value={t("lanes.guideName")} />
          <Line label={t("buyForm.email")} value={t("lanes.guideMail")} />
          <Line label={t("buyForm.phone")} value={t("lanes.guidePhone")} mono />
        </Sheet>
      ),
    },
    {
      n: "02",
      title: t("lanes.sell2Title"),
      body: t("lanes.sell2Body"),
      scene: (
        <Sheet>
          <Beat>
            <div className="rounded-xl border border-white/10 bg-black px-4 py-3">
              <p className="text-[11px] font-medium text-white/40">{t("buyForm.amount")}</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-white">
                <Taka amount={1000} />
              </p>
            </div>
          </Beat>
          <Beat>
            <div className="rounded-xl bg-white px-4 py-3 text-black">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">{t("buyForm.youReceive")}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                <Taka amount={975} prefix="BDT " />
              </p>
            </div>
          </Beat>
        </Sheet>
      ),
    },
    {
      n: "03",
      title: t("lanes.sell3Title"),
      body: t("lanes.sell3Body"),
      scene: (
        <Sheet>
          <p className="text-[11px] font-medium text-white/40">{t("buyForm.voucherCode")}</p>
          <Beat>
            <div className="rounded-xl border border-white bg-black px-4 py-5 text-center font-mono text-lg tracking-[0.12em] text-white">
              {t("lanes.guideCode")}
            </div>
          </Beat>
        </Sheet>
      ),
    },
    {
      n: "04",
      title: t("lanes.sell4Title"),
      body: t("lanes.sell4Body"),
      scene: (
        <Sheet>
          <p className="text-[11px] font-medium text-white/40">{t("buyForm.receiveOn")}</p>
          <PayPick selected="Nagad" />
          <Line label={t("buyForm.numberFor")} value={t("lanes.guidePhone")} mono />
          <Beat>
            <div className="flex h-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
              {t("buyForm.sellSubmit")}
            </div>
          </Beat>
        </Sheet>
      ),
    },
  ];

  return (
    <section id="paths" className="border-t border-white/10 bg-black py-16 sm:py-24">
      <Frame>
        <motion.div
          className="max-w-xl"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="eyebrow flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9fe870] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#9fe870]" />
            </span>
            {t("lanes.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">{t("lanes.title")}</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/50 sm:text-base">{t("lanes.lead")}</p>
        </motion.div>
        <div className="mt-12 grid items-start gap-14 lg:grid-cols-2 lg:gap-10">
          <Lane id="buy" kicker={t("lanes.buyKicker")} title={t("lanes.buyTitle")} lead={t("lanes.buyLead")} steps={buy} />
          <Lane id="sell" kicker={t("lanes.sellKicker")} title={t("lanes.sellTitle")} lead={t("lanes.sellLead")} steps={sell} start={2} />
        </div>
      </Frame>
    </section>
  );
}
