"use client";

import { Frame } from "@/components/frame";
import { HomeFaq } from "@/components/home-faq";
import { useT } from "@/i18n/provider";

export default function FaqPage() {
  const t = useT();

  return (
    <Frame className="py-20 sm:py-28 md:py-32">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/50">{t("nav.faq")}</p>
      <h1 className="mt-4 display text-[clamp(2.4rem,8vw,3.75rem)] sm:text-6xl">
        {t("home.faqTitle")} <span className="accent-red">{t("home.faqAccent")}</span>
      </h1>
      <HomeFaq framed={false} />
    </Frame>
  );
}
