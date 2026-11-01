"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { Frame } from "@/components/frame";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n/provider";

export function SiteHeader({ initialLoggedIn = false }: { initialLoggedIn?: boolean }) {
  const t = useT();
  const pathname = usePathname();
  const onAccount = pathname.startsWith("/account");
  const ctaLabel = initialLoggedIn ? t("nav.buyNote") : t("nav.getCode");

  if (onAccount) return null;

  return (
    <header className="absolute inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        {t("common.skip")}
      </a>
      <Frame className="flex h-16 items-center justify-between gap-3 sm:h-20 md:h-24">
        <Link href="/" aria-label={t("common.brand")} className="relative z-10 min-w-0 transition hover:opacity-90">
          <BrandLogo priority size="md" />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <Link
            href="/#buy"
            className="inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-semibold tracking-tight text-black transition hover:bg-white/85 sm:h-12 sm:px-6"
          >
            {ctaLabel}
          </Link>
        </div>
      </Frame>
    </header>
  );
}
