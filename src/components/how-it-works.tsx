"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Frame } from "@/components/frame";
import { useT } from "@/i18n/provider";

export function HowItWorks() {
  const t = useT();
  const [active, setActive] = useState(0);

  const scenes = useMemo(
    () => [
      {
        n: "01",
        title: t("home.how1Title"),
        body: t("home.how1Body"),
        visual: "BDT 1,000",
        tip: t("home.how1Tip"),
      },
      {
        n: "02",
        title: t("home.how2Title"),
        body: t("home.how2Body"),
        visual: "Account",
        tip: t("home.how2Tip"),
      },
      {
        n: "03",
        title: t("home.how3Title"),
        body: t("home.how3Body"),
        visual: "TrxID",
        tip: t("home.how3Tip"),
      },
      {
        n: "04",
        title: t("home.how4Title"),
        body: t("home.how4Body"),
        visual: "CODE",
        tip: t("home.how4Tip"),
      },
    ],
    [t],
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % scenes.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [scenes.length]);

  const scene = scenes[active]!;

  return (
    <section id="how" className="bg-black py-16 sm:py-24 md:py-28">
      <Frame>
        <div className="max-w-2xl">
          <p className="eyebrow">{t("home.howEyebrow")}</p>
          <h2 className="mt-4 display text-[clamp(2.4rem,10vw,5.2rem)]">
            {t("home.howTitle")} <span className="accent-red">{t("home.howAccent")}</span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
            {t("home.howLead")}
          </p>
        </div>

        <div className="mt-10 grid items-stretch gap-6 lg:mt-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div className="premium-card relative overflow-hidden rounded-[28px] p-6 sm:p-10">
            <div className="flex gap-2">
              {scenes.map((item, index) => (
                <button
                  key={item.n}
                  type="button"
                  aria-label={item.title}
                  onClick={() => setActive(index)}
                  className={`h-1.5 flex-1 rounded-full transition ${
                    index === active ? "bg-white" : "bg-white/15"
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={scene.n}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mt-10"
              >
                <p className="text-sm font-semibold text-[#ff2d2d]">{scene.n}</p>
                <h3 className="mt-4 display-soft text-[clamp(1.8rem,6vw,2.8rem)] leading-none">
                  {scene.title}
                </h3>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
                  {scene.body}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {scenes.map((item, index) => (
                <button
                  key={item.n}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`rounded-2xl px-3 py-3 text-left transition ${
                    index === active ? "bg-white text-black" : "bg-white/[0.05] text-white/70"
                  }`}
                >
                  <p className="text-xs font-semibold">{item.n}</p>
                  <p className="mt-1 text-sm font-medium leading-tight">{item.title}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="premium-card relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[28px] p-6 sm:min-h-[420px] sm:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">{t("home.howLivePreview")}</p>
            <AnimatePresence mode="wait">
              <motion.div
                key={scene.visual}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="py-8 text-center"
              >
                <p className="display text-[clamp(2.8rem,12vw,5rem)] leading-none">{scene.visual}</p>
                <p className="mt-4 text-sm uppercase tracking-[0.2em] text-white/45">{scene.tip}</p>
              </motion.div>
            </AnimatePresence>
            <p className="text-sm text-white/45">
              {t("home.howStepOf", { n: active + 1, total: scenes.length })}
            </p>
          </div>
        </div>
      </Frame>
    </section>
  );
}
