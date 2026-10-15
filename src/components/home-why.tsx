"use client";

import { Frame } from "@/components/frame";
import { useT } from "@/i18n/provider";

const REASON_KEYS = [
  { title: "home.reason1Title", body: "home.reason1Body" },
  { title: "home.reason2Title", body: "home.reason2Body" },
  { title: "home.reason3Title", body: "home.reason3Body" },
] as const;

export function HomeWhy() {
  const t = useT();

  return (
    <section className="bg-black">
      <Frame className="py-16 sm:py-20 md:py-28">
        <p className="eyebrow">{t("home.whyEyebrow")}</p>
        <h2 className="mt-4 display text-[clamp(2.4rem,10vw,5.2rem)]">
          {t("home.whyTitle")} <span className="accent-red">{t("home.whyAccent")}</span>
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
          {REASON_KEYS.map((reason) => (
            <div key={reason.title} className="premium-card rounded-[28px] p-7 sm:p-9">
              <h3 className="display-soft text-[1.7rem] leading-none">{t(reason.title)}</h3>
              <p className="mt-4 text-base leading-relaxed text-white/60">{t(reason.body)}</p>
            </div>
          ))}
        </div>
      </Frame>
    </section>
  );
}
