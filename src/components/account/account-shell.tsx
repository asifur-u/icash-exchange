"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { useT } from "@/i18n/provider";
import type { PublicUser } from "@/lib/users";

type NavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
};

export function AccountShell({ user, children }: { user: PublicUser; children: React.ReactNode }) {
  const t = useT();
  const pathname = usePathname();
  const initial = (user.name.split(" ")[0] || user.name).slice(0, 1).toUpperCase();

  const primaryNav: NavItem[] = useMemo(
    () => [
      { href: "/account", label: t("account.home"), match: (p) => p === "/account" },
      {
        href: "/account/services",
        label: t("account.buy"),
        match: (p) => p.startsWith("/account/services"),
      },
      {
        href: "/account/orders",
        label: t("account.orders"),
        match: (p) => p.startsWith("/account/orders"),
      },
      {
        href: "/account/payments",
        label: t("account.payments"),
        match: (p) => p.startsWith("/account/payments"),
      },
    ],
    [t],
  );

  const secondaryNav: NavItem[] = useMemo(
    () => [
      {
        href: "/account/activity",
        label: t("account.activity"),
        match: (p) => p.startsWith("/account/activity"),
      },
      {
        href: "/account/support",
        label: t("account.help"),
        match: (p) => p.startsWith("/account/support"),
      },
      {
        href: "/account/profile",
        label: t("account.profile"),
        match: (p) => p.startsWith("/account/profile"),
      },
    ],
    [t],
  );

  useEffect(() => {
    document.documentElement.classList.add("account-light-root");
    return () => document.documentElement.classList.remove("account-light-root");
  }, []);

  return (
    <div
      className="mx-auto w-full max-w-[1240px] px-4 pb-28 pt-[calc(5.25rem+env(safe-area-inset-top))] sm:px-6 sm:pb-24 sm:pt-28 lg:px-8"
      style={{ color: "#09090b" }}
    >
      <div className="grid gap-5 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="al-card overflow-hidden">
            <div className="border-b px-4 py-5 sm:px-5" style={{ borderColor: "#e4e4e7" }}>
              <div className="flex items-center gap-3">
                <div
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold"
                  style={{ background: "#f4f4f5", color: "#3f3f46", border: "1px solid #e4e4e7" }}
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="al-ink truncate text-sm font-bold">{user.name}</p>
                  <p className="al-muted mt-0.5 truncate text-xs">{user.email}</p>
                </div>
              </div>
              <div
                className="mt-3.5 flex items-center justify-between gap-2 rounded-xl px-3 py-2"
                style={{ background: "#fafafa", border: "1px solid #e4e4e7" }}
              >
                <div>
                  <p className="al-faint text-[10px] font-medium uppercase tracking-[0.14em]">
                    {t("account.account")}
                  </p>
                  <p className="al-ink mt-0.5 text-xs font-semibold">{t("account.deskMember")}</p>
                </div>
                <span
                  className="inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ background: "#fee2e2", color: "#e11d2e", border: "1px solid #fecaca" }}
                >
                  {t("account.live")}
                </span>
              </div>
              <div className="mt-3">
                <LanguageSwitcher tone="light" className="w-full justify-center" />
              </div>
            </div>

            <nav className="al-nav p-2.5" aria-label={t("account.account")}>
              <p className="al-faint mb-1.5 hidden px-2 text-[10px] font-semibold uppercase tracking-[0.16em] lg:block">
                {t("account.main")}
              </p>
              <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
                {primaryNav.map((item) => {
                  const active = item.match(pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium lg:w-full"
                      style={
                        active ? { background: "#18181b", color: "#fff" } : { color: "#52525b" }
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <p className="al-faint mb-1.5 mt-4 hidden px-2 text-[10px] font-semibold uppercase tracking-[0.16em] lg:block">
                {t("account.account")}
              </p>
              <div className="mt-1 flex gap-1 overflow-x-auto lg:mt-0 lg:flex-col lg:overflow-visible">
                {secondaryNav.map((item) => {
                  const active = item.match(pathname);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium lg:w-full"
                      style={
                        active ? { background: "#18181b", color: "#fff" } : { color: "#52525b" }
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="space-y-2 border-t p-3" style={{ borderColor: "#e4e4e7" }}>
              <Link href="/#desk" className="al-btn al-btn-primary w-full">
                {t("account.openDesk")}
              </Link>
              <LogoutButton className="!rounded-xl !border-[#e4e4e7] !text-[#52525b] hover:!bg-[#f4f4f5] hover:!text-[#09090b]" />
            </div>
          </div>
        </aside>

        <div className="min-w-0" style={{ color: "#09090b" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
