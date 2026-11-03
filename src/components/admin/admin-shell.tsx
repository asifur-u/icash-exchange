"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n/provider";
import type { MessageKey } from "@/i18n/translate";

export type AdminSection =
  | "overview"
  | "inbox"
  | "orders"
  | "icash"
  | "customers"
  | "payments"
  | "refunds"
  | "reports"
  | "activity"
  | "settings";

type NavItem = {
  id: AdminSection;
  labelKey: MessageKey;
  hintKey: MessageKey;
  badgeKey?: "inbox" | "refunds" | "pending" | "icash";
};

type NavGroup = { titleKey: MessageKey; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    titleKey: "admin.groupOps",
    items: [
      { id: "overview", labelKey: "admin.navOverview", hintKey: "admin.navOverviewHint" },
      { id: "inbox", labelKey: "admin.navInbox", hintKey: "admin.navInboxHint", badgeKey: "inbox" },
      { id: "orders", labelKey: "admin.navOrders", hintKey: "admin.navOrdersHint" },
    ],
  },
  {
    titleKey: "admin.groupMoney",
    items: [
      { id: "icash", labelKey: "admin.navIcash", hintKey: "admin.navIcashHint", badgeKey: "icash" },
      {
        id: "payments",
        labelKey: "admin.navPayments",
        hintKey: "admin.navPaymentsHint",
        badgeKey: "pending",
      },
      {
        id: "refunds",
        labelKey: "admin.navRefunds",
        hintKey: "admin.navRefundsHint",
        badgeKey: "refunds",
      },
      { id: "customers", labelKey: "admin.navCustomers", hintKey: "admin.navCustomersHint" },
    ],
  },
  {
    titleKey: "admin.groupInsight",
    items: [
      { id: "reports", labelKey: "admin.navReports", hintKey: "admin.navReportsHint" },
      { id: "activity", labelKey: "admin.navActivity", hintKey: "admin.navActivityHint" },
    ],
  },
  {
    titleKey: "admin.groupDesk",
    items: [{ id: "settings", labelKey: "admin.navSettings", hintKey: "admin.navSettingsHint" }],
  },
];

const FLAT_NAV = NAV_GROUPS.flatMap((g) => g.items);

type Badges = { inbox: number; refunds: number; pending: number; icash: number };

function badgeFor(badges: Badges, key?: NavItem["badgeKey"]) {
  if (!key) return 0;
  return badges[key] ?? 0;
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      {open ? (
        <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
      ) : (
        <>
          <path strokeLinecap="round" d="M4 7h16" />
          <path strokeLinecap="round" d="M4 12h16" />
          <path strokeLinecap="round" d="M4 17h16" />
        </>
      )}
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
    <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3" aria-label={t("admin.ownerDesk")}>
      {NAV_GROUPS.map((group) => (
        <div key={group.titleKey}>
          <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
            {t(group.titleKey)}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = section === item.id;
              const count = badgeFor(badges, item.badgeKey);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPick(item.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition"
                  style={
                    active
                      ? {
                          background: "linear-gradient(90deg, rgba(225,29,46,0.18), rgba(225,29,46,0.05))",
                          boxShadow: "inset 3px 0 0 #e11d2e",
                        }
                      : undefined
                  }
                >
                  <span className="min-w-0">
                    <span className={`block truncate text-sm font-semibold ${active ? "text-white" : "text-white/60"}`}>
                      {t(item.labelKey)}
                    </span>
                    <span className="block truncate text-[11px] text-white/35">{t(item.hintKey)}</span>
                  </span>
                  {count > 0 ? (
                    <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#e11d2e] px-1.5 text-[11px] font-bold text-white">
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarBrand() {
  const t = useT();
  return (
    <div className="border-b border-white/10 px-4 py-4">
      <Link href="/admin" className="inline-flex">
        <BrandLogo size="sm" />
      </Link>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight">{t("admin.ownerDesk")}</p>
          <p className="mt-0.5 truncate text-[11px] text-white/40">{t("admin.opsConsole")}</p>
        </div>
        <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-[#e11d2e]/15 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#ff7a84]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#e11d2e]" aria-hidden />
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
      className="space-y-2 border-t border-white/10 p-3"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <Link
        href="/"
        className="flex h-10 items-center justify-center rounded-xl border border-white/12 text-sm font-semibold text-white/70 transition hover:border-white/25 hover:text-white"
      >
        {t("admin.viewSite")}
      </Link>
      <button
        type="button"
        onClick={onLock}
        className="flex h-10 w-full items-center justify-center rounded-xl bg-white/5 text-sm font-semibold text-white/80 transition hover:bg-white/10"
      >
        {t("admin.lockDesk")}
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
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#070707] text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-white/10 bg-[#0a0a0a] lg:flex">
        <SidebarBrand />
        <NavList section={section} badges={badges} onPick={pickSection} />
      </aside>

      <header
        className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md lg:left-[260px]"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-5 lg:px-8">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/12 text-white lg:hidden"
            aria-expanded={menuOpen}
            aria-controls={drawerId}
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon open={menuOpen} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold tracking-tight">{t(current.labelKey)}</p>
            <p className="hidden truncate text-[11px] text-white/40 sm:block">{t(current.hintKey)}</p>
          </div>

          {inbox > 0 ? (
            <button
              type="button"
              onClick={() => pickSection("inbox")}
              className="inline-flex h-8 shrink-0 items-center rounded-full bg-[#e11d2e] px-2.5 text-[11px] font-bold text-white"
            >
              {inbox}
              <span className="ml-1 hidden sm:inline">{t("admin.navInbox")}</span>
            </button>
          ) : null}

          <LanguageSwitcher tone="dark" className="shrink-0" />

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/"
              className="inline-flex h-9 items-center rounded-xl border border-white/12 px-3 text-xs font-semibold text-white/70 hover:border-white/25 hover:text-white"
            >
              {t("admin.viewSite")}
            </Link>
            <button
              type="button"
              onClick={lockDesk}
              className="inline-flex h-9 items-center rounded-xl bg-white/5 px-3 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              {t("admin.lockDesk")}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label={t("nav.closeMenu")}
          className={`absolute inset-0 bg-black/55 transition-opacity duration-200 ${menuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMenuOpen(false)}
        />
        <aside
          id={drawerId}
          className={`absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col border-r border-white/10 bg-[#0a0a0a] shadow-[12px_0_40px_rgba(0,0,0,0.45)] transition-transform duration-200 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="flex items-start justify-between gap-2 border-b border-white/10 px-4 py-4">
            <div className="min-w-0">
              <Link href="/admin" className="inline-flex" onClick={() => setMenuOpen(false)}>
                <BrandLogo size="sm" />
              </Link>
              <div className="mt-3 flex items-center gap-2">
                <p className="truncate text-sm font-bold tracking-tight">{t("admin.ownerDesk")}</p>
                <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-[#e11d2e]/15 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#ff7a84]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#e11d2e]" aria-hidden />
                  {t("admin.live")}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/12 text-white/80"
              aria-label={t("nav.closeMenu")}
              onClick={() => setMenuOpen(false)}
            >
              <MenuIcon open />
            </button>
          </div>
          <NavList section={section} badges={badges} onPick={pickSection} />
          <SidebarFooter onLock={lockDesk} />
        </aside>
      </div>

      <div className="lg:pl-[260px]">
        <div className="mx-auto w-full max-w-[1240px] px-3 pb-8 pt-[calc(4.25rem+env(safe-area-inset-top))] sm:px-5 sm:pb-10 sm:pt-[calc(4.5rem+env(safe-area-inset-top))] lg:px-8 lg:pb-12">
          {children}
        </div>
      </div>
    </div>
  );
}
