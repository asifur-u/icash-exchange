"use client";

import Link from "next/link";
import { AccountDeskConverter } from "@/components/account/account-desk-converter";
import { useT } from "@/i18n/provider";
import { deskPayTotal } from "@/lib/desk-fee";
import { formatBdt } from "@/lib/format";
import type { PublicProduct } from "@/lib/types";

const STEP_KEYS = [
  { n: "01", title: "account.step1Title", body: "account.step1Body" },
  { n: "02", title: "account.step2Title", body: "account.step2Body" },
  { n: "03", title: "account.step3Title", body: "account.step3Body" },
  { n: "04", title: "account.step4Title", body: "account.step4Body" },
] as const;

export function AccountServices({ products }: { products: PublicProduct[] }) {
  const t = useT();

  return (
    <div className="space-y-5 sm:space-y-6" style={{ color: "#09090b" }}>
      {/* Notes — previous clean layout */}
      <section className="al-card overflow-hidden">
        <header className="border-b px-5 py-5 sm:px-7 sm:py-7" style={{ borderColor: "#e4e4e7" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e11d2e]">
            {t("account.servicesEyebrow")}
          </p>
          <h1 className="mt-2 text-[clamp(1.9rem,5vw,2.8rem)] font-extrabold tracking-tight text-zinc-900">
            {t("account.servicesTitle")}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500 sm:text-base">
            {t("account.servicesLead")}
          </p>
        </header>

        {products.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-7">
            <p className="text-sm text-zinc-500">{t("account.noStock")}</p>
          </div>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-5 lg:p-6">
            {products.map((product) => {
              const available = product.stock > 0;
              const pay = deskPayTotal(product.price);
              return (
                <article
                  key={product.id}
                  className={`rounded-2xl border p-5 transition sm:p-6 ${
                    available
                      ? "border-zinc-200 bg-white hover:shadow-md"
                      : "border-zinc-100 bg-zinc-50 opacity-55"
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    {available ? t("account.ready", { n: product.stock }) : t("home.soldOut")}
                  </p>
                  <p className="mt-2 text-2xl font-extrabold tabular-nums tracking-tight text-zinc-900 sm:text-[1.75rem]">
                    {formatBdt(product.faceValue)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-zinc-400">
                    {t("account.payIncl", { amount: formatBdt(pay) })}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500">{product.blurb}</p>
                  {available ? (
                    <Link
                      href={`/account/checkout?product=${product.slug}&qty=1`}
                      className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#e11d2e] px-5 text-sm font-semibold text-white transition hover:bg-[#c41828]"
                    >
                      {t("account.buyThisNote")}
                    </Link>
                  ) : (
                    <span className="mt-5 inline-flex h-11 items-center rounded-xl bg-zinc-200 px-5 text-sm font-semibold text-zinc-500">
                      {t("desk.unavailable")}
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <div className="border-t px-5 py-5 sm:px-7 sm:py-6" style={{ borderColor: "#e4e4e7" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
            {t("home.howEyebrow")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEP_KEYS.map((step) => (
              <div key={step.n}>
                <p className="text-xs font-semibold text-[#e11d2e]">{step.n}</p>
                <p className="mt-1.5 text-sm font-semibold text-zinc-900">{t(step.title)}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{t(step.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Converter — separate section */}
      <AccountDeskConverter products={products} />
    </div>
  );
}
