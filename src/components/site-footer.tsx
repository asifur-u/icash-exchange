"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { Frame } from "@/components/frame";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n/provider";

export function SiteFooter() {
  const t = useT();
  const pathname = usePathname();
  if (pathname.startsWith("/account")) return null;

  return (
    <footer className="border-t border-white/10">
      <Frame className="flex flex-col gap-8 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-end sm:justify-between sm:py-14">
        <div>
          <BrandLogo size="lg" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{t("footer.blurb")}</p>
          <div className="mt-5">
            <LanguageSwitcher />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/70 sm:gap-x-6">
          <Link href="/catalog" className="hover:text-white">
            {t("nav.catalog")}
          </Link>
          <Link href="/explore" className="hover:text-white">
            {t("nav.explore")}
          </Link>
          <Link href="/faq" className="hover:text-white">
            {t("nav.faq")}
          </Link>
          <Link href="/legal/terms" className="hover:text-white">
            {t("nav.terms")}
          </Link>
          <Link href="/legal/privacy" className="hover:text-white">
            {t("nav.privacy")}
          </Link>
        </div>
      </Frame>
    </footer>
  );
}
