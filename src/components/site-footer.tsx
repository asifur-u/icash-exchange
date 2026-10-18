"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { Frame } from "@/components/frame";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n/provider";
import { getSocialLinks, type SocialLink } from "@/lib/social";

function SocialIcon({ id }: { id: SocialLink["id"] }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    className: "h-[1.15rem] w-[1.15rem]",
    "aria-hidden": true as const,
  };

  switch (id) {
    case "facebook":
      return (
        <svg {...common}>
          <path d="M14 8.5h2.25V6H14c-1.93 0-3.5 1.57-3.5 3.5v1.75H8.5V14H10.5v6h2.75v-6H15.5l.5-2.75h-2.75V9.5c0-.55.45-1 1-1z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2z" />
          <path d="M17.2 6.35a1.12 1.12 0 1 1-2.24 0 1.12 1.12 0 0 1 2.24 0z" />
          <path d="M12 3.5c-2.33 0-2.62.01-3.53.05-.9.04-1.52.19-2.06.4a4.16 4.16 0 0 0-1.5.98 4.16 4.16 0 0 0-.98 1.5c-.21.54-.36 1.16-.4 2.06-.04.91-.05 1.2-.05 3.53s.01 2.62.05 3.53c.04.9.19 1.52.4 2.06.22.57.52 1.05.98 1.5.45.46.93.76 1.5.98.54.21 1.16.36 2.06.4.91.04 1.2.05 3.53.05s2.62-.01 3.53-.05c.9-.04 1.52-.19 2.06-.4a4.16 4.16 0 0 0 1.5-.98 4.16 4.16 0 0 0 .98-1.5c.21-.54.36-1.16.4-2.06.04-.91.05-1.2.05-3.53s-.01-2.62-.05-3.53c-.04-.9-.19-1.52-.4-2.06a4.16 4.16 0 0 0-.98-1.5 4.16 4.16 0 0 0-1.5-.98c-.54-.21-1.16-.36-2.06-.4-.91-.04-1.2-.05-3.53-.05zm0 1.53c2.29 0 2.56.01 3.46.05.83.04 1.29.18 1.59.3.4.15.69.34.99.63.3.3.48.59.63.99.12.3.26.76.3 1.59.04.9.05 1.17.05 3.46s-.01 2.56-.05 3.46c-.04.83-.18 1.29-.3 1.59-.15.4-.34.69-.63.99-.3.3-.59.48-.99.63-.3.12-.76.26-1.59.3-.9.04-1.17.05-3.46.05s-2.56-.01-3.46-.05c-.83-.04-1.29-.18-1.59-.3a2.66 2.66 0 0 1-.99-.63 2.66 2.66 0 0 1-.63-.99c-.12-.3-.26-.76-.3-1.59-.04-.9-.05-1.17-.05-3.46s.01-2.56.05-3.46c.04-.83.18-1.29.3-1.59.15-.4.34-.69.63-.99.3-.3.59-.48.99-.63.3-.12.76-.26 1.59-.3.9-.04 1.17-.05 3.46-.05z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18.1 5 12 5 12 5s-6.1 0-7.7.3a2.7 2.7 0 0 0-1.9 1.9C2.1 8.8 2.1 12 2.1 12s0 3.2.3 4.8a2.7 2.7 0 0 0 1.9 1.9c1.6.3 7.7.3 7.7.3s6.1 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9c.3-1.6.3-4.8.3-4.8s0-3.2-.3-4.8zM10.2 15.1V8.9L15.5 12l-5.3 3.1z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M16.6 5.3c-.8-.7-1.3-1.7-1.4-2.8h-2.5v12.1c0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5 1.1-2.5 2.5-2.5c.2 0 .5 0 .7.1V9.5c-.2 0-.5-.1-.7-.1-2.8 0-5.1 2.3-5.1 5.1s2.3 5.1 5.1 5.1 5.1-2.3 5.1-5.1V9.6c1.1.8 2.4 1.3 3.8 1.3V8.4c-1.1 0-2.1-.4-2.9-1.1-.2-.2-.4-.3-.6-.5z" />
        </svg>
      );
  }
}

export function SiteFooter() {
  const t = useT();
  const pathname = usePathname();
  const socials = getSocialLinks();
  if (pathname.startsWith("/account")) return null;

  return (
    <footer className="border-t border-white/10">
      <Frame className="flex flex-col gap-8 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-end sm:justify-between sm:py-14">
        <div>
          <BrandLogo size="lg" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{t("footer.blurb")}</p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {socials.map((item) => {
              const ready = Boolean(item.href);
              const className =
                "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white/75 transition hover:border-white/30 hover:bg-white/10 hover:text-white";

              if (!ready) {
                return (
                  <span
                    key={item.id}
                    title={t("footer.socialSoon", { name: item.label })}
                    aria-label={t("footer.socialSoon", { name: item.label })}
                    className={`${className} cursor-default opacity-55`}
                  >
                    <SocialIcon id={item.id} />
                  </span>
                );
              }

              return (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className={className}
                >
                  <SocialIcon id={item.id} />
                </a>
              );
            })}
          </div>

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
