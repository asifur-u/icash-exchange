"use client";

import { Frame } from "@/components/frame";
import { useT } from "@/i18n/provider";

const FAQ_KEYS = [
  { q: "home.faq1Q", a: "home.faq1A" },
  { q: "home.faq2Q", a: "home.faq2A" },
  { q: "home.faq3Q", a: "home.faq3A" },
  { q: "home.faq4Q", a: "home.faq4A" },
  { q: "home.faq5Q", a: "home.faq5A" },
] as const;

export function HomeFaq({ framed = true }: { framed?: boolean }) {
  const t = useT();

  const list = (
    <div className={framed ? "mt-8 max-w-3xl sm:mt-10" : "mt-8 max-w-3xl"}>
      {FAQ_KEYS.map((item) => (
        <details key={item.q} className="group border-b border-white/10 py-4 sm:py-5">
          <summary className="flex cursor-pointer items-start justify-between gap-4 display-soft text-xl sm:items-center sm:gap-6 sm:text-2xl">
            <span className="min-w-0">{t(item.q)}</span>
            <span className="shrink-0 text-white group-open:hidden">+</span>
            <span className="hidden shrink-0 text-white group-open:inline">–</span>
          </summary>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{t(item.a)}</p>
        </details>
      ))}
    </div>
  );

  if (!framed) return list;

  return (
    <section className="bg-black">
      <Frame className="py-16 sm:py-20 md:py-28">
        <p className="eyebrow">{t("home.faqEyebrow")}</p>
        <h2 className="mt-4 display text-[clamp(2.4rem,10vw,5.2rem)]">
          {t("home.faqTitle")} <span className="accent-red">{t("home.faqAccent")}</span>
        </h2>
        {list}
      </Frame>
    </section>
  );
}
