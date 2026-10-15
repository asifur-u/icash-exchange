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
    <div className="space-y-5">
      <header className="rounded-[28px] border border-zinc-200 bg-white shadow-sm p-6 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ff2d2d]">
          {t("account.help")}
        </p>
        <h1 className="mt-2 display text-[clamp(2rem,6vw,3.2rem)] leading-[0.95]">
          {t("account.deskSupport")}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-500">{t("home.howLead")}</p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            href="/faq"
            className="inline-flex h-11 items-center rounded-xl bg-[#ff2d2d] px-5 text-sm font-semibold text-white"
          >
            {t("nav.faq")}
          </Link>
          <Link
            href="/account/orders"
            className="inline-flex h-11 items-center rounded-xl border border-zinc-200 px-5 text-sm font-semibold text-zinc-800"
          >
            {t("account.viewOrders")}
          </Link>
        </div>
      </header>

      <section className="rounded-[28px] border border-zinc-200 bg-white shadow-sm p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          {t("home.faqTitle")} {t("home.faqAccent")}
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {tips.map((tip) => (
            <li
              key={tip}
              className="flex gap-3 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600"
            >
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff2d2d]" />
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            {t("nav.faq")}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{t("home.faqEyebrow")}</h2>
        </div>
        <ul className="divide-y divide-zinc-100">
          {FAQ_KEYS.map((item) => (
            <li key={item.q} className="px-5 py-5 sm:px-6">
              <p className="font-semibold tracking-tight text-zinc-900">{t(item.q)}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{t(item.a)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
