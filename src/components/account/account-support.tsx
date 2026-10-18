"use client";

import Link from "next/link";
import { useT } from "@/i18n/provider";

const FAQ_KEYS = [
  { q: "home.faq1Q", a: "home.faq1A" },
  { q: "home.faq2Q", a: "home.faq2A" },
  { q: "home.faq3Q", a: "home.faq3A" },
  { q: "home.faq4Q", a: "home.faq4A" },
  { q: "home.faq5Q", a: "home.faq5A" },
] as const;

export function AccountSupport() {
  const t = useT();
  const tips = [t("home.how3Tip"), t("home.how3Body"), t("home.how4Body"), t("home.how4Tip")];

  return (
    <div className="space-y-5 sm:space-y-6" style={{ color: "#09090b" }}>
      <header className="al-card overflow-hidden">
        <div className="relative overflow-hidden bg-[#0a0a0a] px-5 py-6 sm:px-7 sm:py-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 70% 70% at 20% 0%, rgba(225,29,46,0.4), transparent 55%)",
            }}
          />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ff5a67]">
              {t("account.help")}
            </p>
            <h1 className="mt-2 text-[clamp(1.9rem,5vw,2.8rem)] font-extrabold tracking-tight text-white">
              {t("account.deskSupport")}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
              {t("account.supportLead")}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link
                href="/account/services"
                className="inline-flex h-11 items-center rounded-xl bg-[#e11d2e] px-5 text-sm font-semibold text-white transition hover:bg-[#c41828]"
              >
                {t("account.buyANote")}
              </Link>
              <Link
                href="/account/orders"
                className="inline-flex h-11 items-center rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {t("account.viewOrders")}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="al-card p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {t("home.faqTitle")} {t("home.faqAccent")}
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {tips.map((tip) => (
            <li
              key={tip}
              className="flex gap-3 rounded-2xl px-4 py-3 text-sm text-zinc-600"
              style={{ background: "#fafafa", border: "1px solid #e4e4e7" }}
            >
              <span
                aria-hidden
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e11d2e]"
              />
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <section className="al-card overflow-hidden">
        <div className="border-b px-5 py-4 sm:px-6" style={{ borderColor: "#e4e4e7" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {t("nav.faq")}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            {t("home.faqEyebrow")}
          </h2>
        </div>
        <ul>
          {FAQ_KEYS.map((item, index) => (
            <li
              key={item.q}
              className="px-5 py-5 sm:px-6"
              style={{ borderTop: index === 0 ? undefined : "1px solid #f4f4f5" }}
            >
              <p className="font-semibold tracking-tight text-zinc-900">{t(item.q)}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t(item.a)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
