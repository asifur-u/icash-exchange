"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { useT } from "@/i18n/provider";
import type { PublicUser } from "@/lib/users";

type NavIconName = "home" | "buy" | "orders" | "pay" | "activity" | "help" | "profile" | "more";

type NavItem = {
  href: string;
  label: string;
  match: (path: string) => boolean;
  icon: NavIconName;
};

function NavIcon({ name, active }: { name: NavIconName; active: boolean }) {
  const stroke = active ? "#e11d2e" : "#71717a";
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.85,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-[1.15rem] w-[1.15rem] shrink-0",
    "aria-hidden": true as const,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
        </svg>
      );
    case "buy":
      return (
        <svg {...common}>
          <path d="M6 7h12l-1 12H7L6 7z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
      );
    case "orders":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case "pay":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
        </svg>
      );
    case "activity":
      return (
        <svg {...common}>
          <path d="M4 19V5M4 19h16" />
          <path d="M8 15v-3M12 15V8M16 15v-5" />
        </svg>
      );
    case "help":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M12 17h.01" />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19.5c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5" />
        </svg>
      );
    case "more":
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="1.2" fill={stroke} stroke="none" />
          <circle cx="12" cy="12" r="1.2" fill={stroke} stroke="none" />
          <circle cx="18" cy="12" r="1.2" fill={stroke} stroke="none" />
        </svg>
      );
  }
}

function SideLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.match(pathname);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
      style={
        active
          ? {
              background: "linear-gradient(90deg, rgba(225,29,46,0.12), rgba(225,29,46,0.04))",
              color: "#09090b",
              boxShadow: "inset 3px 0 0 #e11d2e",
            }
          : { color: "#52525b" }
      }
    >
      <NavIcon name={item.icon} active={active} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function AccountShell({ user, children }: { user: PublicUser; children: React.ReactNode }) {
  const t = useT();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const initial = (user.name.split(" ")[0] || user.name).slice(0, 1).toUpperCase();

  const primaryNav: NavItem[] = useMemo(
    () => [
      { href: "/account", label: t("account.home"), match: (p) => p === "/account", icon: "home" },
      {
        href: "/account/services",
        label: t("account.buy"),
        match: (p) =>
          p.startsWith("/account/services") ||
          p.startsWith("/account/checkout") ||
          p.startsWith("/account/pay"),
        icon: "buy",
      },
      {
        href: "/account/orders",
        label: t("account.orders"),
        match: (p) => p.startsWith("/account/orders"),
        icon: "orders",
      },
      {
        href: "/account/payments",
        label: t("account.payments"),
        match: (p) => p.startsWith("/account/payments"),
        icon: "pay",
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
        icon: "activity",
      },
      {
        href: "/account/support",
        label: t("account.help"),
        match: (p) => p.startsWith("/account/support"),
        icon: "help",
      },
      {
        href: "/account/profile",
        label: t("account.profile"),
        match: (p) => p.startsWith("/account/profile"),
        icon: "profile",
      },
    ],
    [t],
  );

  const moreActive = secondaryNav.some((item) => item.match(pathname));

  useEffect(() => {
    document.documentElement.classList.add("account-light-root");
    return () => document.documentElement.classList.remove("account-light-root");
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [moreOpen]);

  return (
    <div className="min-h-[100dvh]" style={{ color: "#09090b" }}>
      {/* Fixed full-height desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-[272px] flex-col border-r bg-white xl:w-[288px] lg:flex"
        style={{ borderColor: "#e4e4e7" }}
      >
        <div className="border-b px-4 pb-4 pt-5" style={{ borderColor: "#f4f4f5" }}>
          <Link
            href="/account"
            aria-label={t("account.dashboard")}
            className="mb-4 inline-flex transition hover:opacity-90"
          >
            <BrandLogo size="sm" />
          </Link>

          <div
            className="rounded-2xl px-3 py-3"
            style={{
              background: "linear-gradient(160deg, #fff5f5 0%, #fafafa 55%, #ffffff 100%)",
              border: "1px solid #fee2e2",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-sm font-bold"
                style={{
                  background: "linear-gradient(145deg, #e11d2e, #9f1239)",
                  color: "#fff",
                  boxShadow: "0 8px 18px rgba(225,29,46,0.28)",
                }}
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-zinc-900">{user.name}</p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">{user.email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold text-zinc-600">{t("account.deskMember")}</p>
              <span
                className="inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ background: "#e11d2e", color: "#fff" }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                {t("account.live")}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <LanguageSwitcher tone="light" className="w-full justify-center" />
          </div>
        </div>

        <nav
          className="al-nav min-h-0 flex-1 space-y-4 overflow-y-auto px-2.5 py-4"
          aria-label={t("account.account")}
        >
          <div>
            <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              {t("account.main")}
            </p>
            <div className="space-y-0.5">
              {primaryNav.map((item) => (
                <SideLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              {t("account.account")}
            </p>
            <div className="space-y-0.5">
              {secondaryNav.map((item) => (
                <SideLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>
        </nav>

        <div
          className="mt-auto space-y-2 border-t p-3"
          style={{ borderColor: "#f4f4f5", paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <Link
            href="/account/services"
            className="al-btn al-btn-primary w-full shadow-[0_10px_24px_rgba(225,29,46,0.25)]"
          >
            {t("account.buyANote")}
          </Link>
          <LogoutButton className="!rounded-xl !border-[#e4e4e7] !text-[#52525b] hover:!bg-[#f4f4f5] hover:!text-[#09090b]" />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="fixed inset-x-0 top-0 z-40 border-b bg-white/95 backdrop-blur-md lg:hidden"
        style={{ borderColor: "#e4e4e7", paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between gap-3 px-3 sm:px-5">
          <Link href="/account" aria-label={t("account.dashboard")} className="min-w-0 shrink">
            <BrandLogo size="sm" />
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <LanguageSwitcher tone="light" />
            <Link
              href="/account/profile"
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold"
              style={{ background: "#f4f4f5", color: "#3f3f46", border: "1px solid #e4e4e7" }}
              aria-label={t("account.profile")}
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-[272px] xl:pl-[288px]">
        <div className="mx-auto w-full max-w-[1080px] px-2.5 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-[calc(4.25rem+env(safe-area-inset-top))] sm:px-5 sm:pb-10 sm:pt-[calc(4.75rem+env(safe-area-inset-top))] lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur-md lg:hidden"
        style={{
          borderColor: "#e4e4e7",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        aria-label={t("account.main")}
      >
        <div className="mx-auto grid max-w-[1240px] grid-cols-5 gap-0 px-0.5 pt-1">
          {primaryNav.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1.5"
              >
                <NavIcon name={item.icon} active={active} />
                <span
                  className="w-full truncate text-center text-[9px] font-semibold leading-tight tracking-tight"
                  style={{ color: active ? "#09090b" : "#71717a" }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            aria-expanded={moreOpen}
            aria-controls="account-more-sheet"
            onClick={() => setMoreOpen((v) => !v)}
            className="flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1.5"
          >
            <NavIcon name="more" active={moreOpen || moreActive} />
            <span
              className="w-full truncate text-center text-[9px] font-semibold leading-tight tracking-tight"
              style={{ color: moreOpen || moreActive ? "#09090b" : "#71717a" }}
            >
              {t("nav.menu")}
            </span>
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t("nav.closeMenu")}
            className="absolute inset-0 bg-black/35"
            onClick={() => setMoreOpen(false)}
          />
          <div
            id="account-more-sheet"
            className="absolute inset-x-0 bottom-0 rounded-t-[1.5rem] bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.18)]"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-200" />
            <div className="mb-3 flex items-center gap-3 px-1">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(145deg, #e11d2e, #9f1239)" }}
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-zinc-900">{user.name}</p>
                <p className="truncate text-xs text-zinc-500">{user.email}</p>
              </div>
            </div>
            <div className="grid gap-1.5">
              {secondaryNav.map((item) => {
                const active = item.match(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold"
                    style={
                      active
                        ? { background: "#18181b", color: "#fff" }
                        : { background: "#f4f4f5", color: "#18181b" }
                    }
                  >
                    <NavIcon name={item.icon} active={active} />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/account/services"
                className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-white"
                style={{ background: "#e11d2e" }}
              >
                {t("account.buyANote")}
              </Link>
              <LogoutButton className="!h-11 !rounded-xl !border-[#e4e4e7] !text-[#52525b]" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
