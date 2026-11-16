"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n/provider";
import type { MessageKey } from "@/i18n/translate";

export type AdminSection =
  | "dashboard"
  | "orders"
  | "balance"
  | "history"
  | "statement"
  | "payment"
  | "customers"
  | "customerHistory";

type NavItem = {
  id: AdminSection;
  labelKey: MessageKey;
  hintKey: MessageKey;
  badgeKey?: "inbox" | "refunds" | "pending" | "icash";
};

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", labelKey: "admin.navDashboard", hintKey: "admin.navDashboardHint" },
  { id: "balance", labelKey: "admin.navBalance", hintKey: "admin.navBalanceHint", badgeKey: "icash" },
  { id: "history", labelKey: "admin.navHistory", hintKey: "admin.navHistoryHint", badgeKey: "inbox" },
  { id: "statement", labelKey: "admin.navStatement", hintKey: "admin.navStatementHint" },
  { id: "payment", labelKey: "admin.navPayment", hintKey: "admin.navPaymentHint" },
  { id: "customers", labelKey: "admin.navCustomerReport", hintKey: "admin.navCustomerReportHint" },
  { id: "customerHistory", labelKey: "admin.navCustomerHistory", hintKey: "admin.navCustomerHistoryHint" },
];

const FLAT_NAV = NAV_ITEMS;

type Badges = { inbox: number; refunds: number; pending: number; icash: number };

function badgeFor(badges: Badges, key?: NavItem["badgeKey"]) {
  if (!key) return 0;
  return badges[key] ?? 0;
}

const MORE_SECTIONS: AdminSection[] = ["payment", "customers", "customerHistory"];

const TAB_ITEMS: Array<{ id: AdminSection; labelKey: MessageKey; icon: "home" | "wallet" | "list" | "sheet" }> = [
  { id: "dashboard", labelKey: "admin.navDashboard", icon: "home" },
  { id: "balance", labelKey: "admin.navBalanceShort", icon: "wallet" },
  { id: "history", labelKey: "admin.navHistory", icon: "list" },
  { id: "statement", labelKey: "admin.navStatement", icon: "sheet" },
];

function TabIcon({ name, active }: { name: (typeof TAB_ITEMS)[number]["icon"] | "more"; active: boolean }) {
  const stroke = active ? "#e8d5b5" : "rgba(243,240,234,0.42)";
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.85,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5",
    "aria-hidden": true as const,
  };
  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </svg>
    );
  }
  if (name === "wallet") {
    return (
      <svg {...common}>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18M16 14.5h2" />
      </svg>
    );
  }
  if (name === "list") {
    return (
      <svg {...common}>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    );
  }
  if (name === "sheet") {
    return (
      <svg {...common}>
        <path d="M8 3h8l5 5v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path d="M16 3v6h6M9 13h6M9 17h4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="6" cy="12" r="1.3" fill={stroke} stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill={stroke} stroke="none" />
      <circle cx="18" cy="12" r="1.3" fill={stroke} stroke="none" />
    </svg>
  );
}

function NavList({
  section,
  badges,
  onPick,
}: {
  section: AdminSection;
  badges: Badges;
  onPick: (id: AdminSection) => void;
}) {
  const t = useT();

  return (
    <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain p-3" aria-label={t("admin.ownerDesk")}>
      {NAV_ITEMS.map((item) => {
        const active = section === item.id;
        const count = badgeFor(badges, item.badgeKey);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onPick(item.id)}
            aria-current={active ? "page" : undefined}
            aria-label={t(item.labelKey)}
            className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-3.5 text-left transition ${
              active ? "ad-nav-active" : "hover:bg-white/[0.04]"
            }`}
          >
            <span
              className={`min-w-0 truncate text-[15px] font-bold tracking-tight ${
                active ? "text-[var(--ad-ink)]" : "text-[var(--ad-muted)] hover:text-[var(--ad-ink)]"
              }`}
            >
              {t(item.labelKey)}
            </span>
            {count > 0 ? (
              <span className="ad-btn inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold shadow-none">
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

function SidebarBrand() {
  const t = useT();
  return (
    <div className="border-b border-[var(--ad-line)] px-4 py-4">
      <Link href="/admin" className="inline-flex">
        <BrandLogo size="sm" />
      </Link>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-[var(--ad-ink)]">{t("admin.ownerDesk")}</p>
          <p className="mt-0.5 truncate text-[11px] text-[var(--ad-faint)]">{t("admin.opsConsole")}</p>
        </div>
        <span className="ad-chip-live inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2 text-[10px] font-bold uppercase tracking-[0.12em]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ad-mint)]" aria-hidden />
          {t("admin.live")}
        </span>
      </div>
    </div>
  );
}

function SidebarFooter({ onLock }: { onLock: () => void }) {
  const t = useT();
  return (
    <div
      className="space-y-2 border-t border-[var(--ad-line)] p-3"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <Link
        href="/"
        className="flex h-10 items-center justify-center rounded-xl border border-[var(--ad-line)] text-sm font-semibold text-[var(--ad-muted)] transition hover:border-white/20 hover:text-[var(--ad-ink)]"
      >
        {t("admin.viewSite")}
      </Link>
      <button
        type="button"
        onClick={onLock}
        className="flex h-10 w-full items-center justify-center rounded-xl bg-white/[0.05] text-sm font-semibold text-[var(--ad-ink)]/80 transition hover:bg-white/[0.09]"
      >
        {t("admin.logout")}
      </button>
    </div>
  );
}

export function AdminShell({
  section,
  onSection,
  badges,
  children,
}: {
  section: AdminSection;
  onSection: (id: AdminSection) => void;
  badges: Badges;
  children: React.ReactNode;
}) {
  const t = useT();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerId = useId();
  const current = FLAT_NAV.find((item) => item.id === section) ?? FLAT_NAV[0]!;
  const inbox = badges.inbox;
  const moreActive = MORE_SECTIONS.includes(section);

  async function lockDesk() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  function pickSection(id: AdminSection) {
    onSection(id);
    setMenuOpen(false);
  }

  useEffect(() => {
    document.documentElement.classList.add("admin-root");
    return () => document.documentElement.classList.remove("admin-root");
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div className="admin-desk min-h-[100dvh] overflow-x-hidden">
      <aside className="admin-panel fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r md:flex">
        <SidebarBrand />
        <NavList section={section} badges={badges} onPick={pickSection} />
      </aside>

      <header
        className="admin-panel fixed inset-x-0 top-0 z-40 border-b md:left-[260px]"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex h-12 items-center gap-2 px-3 sm:h-14 sm:gap-3 sm:px-5 lg:px-8">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold tracking-tight text-[var(--ad-ink)] sm:text-base">{t(current.labelKey)}</p>
          </div>

          {inbox > 0 ? (
            <button
              type="button"
              onClick={() => pickSection("history")}
              className="ad-btn inline-flex h-8 shrink-0 items-center rounded-full px-2.5 text-[11px] font-bold shadow-none"
            >
              {inbox}
            </button>
          ) : null}

          <LanguageSwitcher tone="dark" className="shrink-0" />

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/"
              className="inline-flex h-9 items-center rounded-xl border border-[var(--ad-line)] px-3 text-xs font-semibold text-[var(--ad-muted)] hover:border-white/20 hover:text-[var(--ad-ink)]"
            >
              {t("admin.viewSite")}
            </Link>
            <button
              type="button"
              onClick={lockDesk}
              className="inline-flex h-9 items-center rounded-xl bg-white/[0.05] px-3 text-xs font-semibold text-[var(--ad-ink)]/80 hover:bg-white/[0.09]"
            >
              {t("admin.logout")}
            </button>
          </div>
        </div>
      </header>

      <div className="md:pl-[260px]">
        <div className="mx-auto w-full max-w-[1240px] px-3 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-[calc(3.75rem+env(safe-area-inset-top))] sm:px-5 sm:pt-[calc(4.5rem+env(safe-area-inset-top))] md:pb-10 lg:px-8 lg:pb-12">
          {children}
        </div>
      </div>

      <nav
        className="admin-panel fixed inset-x-0 bottom-0 z-40 border-t md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label={t("admin.ownerDesk")}
      >
        <div className="grid grid-cols-5 px-1 pt-1">
          {TAB_ITEMS.map((item) => {
            const active = section === item.id;
            const count = item.id === "history" ? inbox : item.id === "balance" ? badges.icash : 0;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => pickSection(item.id)}
                className="relative flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1.5"
              >
                <TabIcon name={item.icon} active={active} />
                {count > 0 ? (
                  <span className="ad-btn absolute right-2 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold shadow-none">
                    {count}
                  </span>
                ) : null}
                <span className={`w-full truncate text-center text-[10px] font-semibold leading-tight ${active ? "text-[var(--ad-gold-soft)]" : "text-[var(--ad-faint)]"}`}>
                  {t(item.labelKey)}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls={drawerId}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-0.5 py-1.5"
          >
            <TabIcon name="more" active={menuOpen || moreActive} />
            <span className={`w-full truncate text-center text-[10px] font-semibold leading-tight ${menuOpen || moreActive ? "text-[var(--ad-gold-soft)]" : "text-[var(--ad-faint)]"}`}>
              {t("nav.menu")}
            </span>
          </button>
        </div>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label={t("nav.closeMenu")} className="absolute inset-0 bg-black/55" onClick={() => setMenuOpen(false)} />
          <div
            id={drawerId}
            className="admin-card absolute inset-x-0 bottom-0 rounded-t-[1.4rem] border-t px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="grid gap-1.5">
              {MORE_SECTIONS.map((id) => {
                const item = NAV_ITEMS.find((row) => row.id === id);
                if (!item) return null;
                const active = section === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => pickSection(id)}
                    className={`rounded-xl px-4 py-3.5 text-left text-sm font-semibold ${
                      active ? "ad-nav-active text-[var(--ad-ink)]" : "bg-white/[0.05] text-[var(--ad-ink)]/80"
                    }`}
                  >
                    {t(item.labelKey)}
                  </button>
                );
              })}
              <Link
                href="/"
                className="rounded-xl bg-white/[0.05] px-4 py-3.5 text-center text-sm font-semibold text-white/80"
              >
                {t("admin.viewSite")}
              </Link>
              <button
                type="button"
                onClick={lockDesk}
                className="rounded-xl bg-white/[0.05] px-4 py-3.5 text-sm font-semibold text-white/80"
              >
                {t("admin.logout")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
