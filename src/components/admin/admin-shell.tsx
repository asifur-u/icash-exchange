"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useT } from "@/i18n/provider";
import type { MessageKey } from "@/i18n/translate";

export type AdminSection =
  | "overview"
  | "inbox"
  | "stock"
  | "orders"
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
  badgeKey?: "inbox" | "refunds" | "pending";
};

type NavGroup = { titleKey: MessageKey; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    titleKey: "admin.groupOps",
    items: [
      { id: "overview", labelKey: "admin.navOverview", hintKey: "admin.navOverviewHint" },
      { id: "inbox", labelKey: "admin.navInbox", hintKey: "admin.navInboxHint", badgeKey: "inbox" },
      { id: "stock", labelKey: "admin.navStock", hintKey: "admin.navStockHint" },
      { id: "orders", labelKey: "admin.navOrders", hintKey: "admin.navOrdersHint" },
    ],
  },
  {
    titleKey: "admin.groupMoney",
    items: [
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

export function AdminShell({
  section,
  onSection,
  badges,
  children,
}: {
  section: AdminSection;
  onSection: (id: AdminSection) => void;
  badges: { inbox: number; refunds: number; pending: number };
  children: React.ReactNode;
}) {
  const t = useT();
  const router = useRouter();

  function badgeFor(key?: NavItem["badgeKey"]) {
    if (!key) return 0;
    return badges[key] ?? 0;
  }

  async function lockDesk() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-[100dvh] bg-[#070707] text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-white/10 bg-[#0a0a0a] lg:flex">
        <div className="border-b border-white/10 px-4 py-5">
          <Link href="/admin" className="inline-flex">
            <BrandLogo size="sm" />
          </Link>
          <div className="mt-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold tracking-tight">{t("admin.ownerDesk")}</p>
              <p className="mt-0.5 text-[11px] text-white/40">{t("admin.opsConsole")}</p>
            </div>
            <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-[#e11d2e]/15 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#ff7a84]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#e11d2e]" aria-hidden />
              {t("admin.live")}
            </span>
          </div>
          <div className="mt-3">
            <LanguageSwitcher tone="dark" className="w-full justify-center" />
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-3" aria-label={t("admin.ownerDesk")}>
          {NAV_GROUPS.map((group) => (
            <div key={group.titleKey}>
              <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                {t(group.titleKey)}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = section === item.id;
                  const count = badgeFor(item.badgeKey);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSection(item.id)}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition"
                      style={
                        active
                          ? {
                              background:
                                "linear-gradient(90deg, rgba(225,29,46,0.18), rgba(225,29,46,0.05))",
                              boxShadow: "inset 3px 0 0 #e11d2e",
                            }
                          : undefined
                      }
                    >
                      <span>
                        <span
                          className={`block text-sm font-semibold ${active ? "text-white" : "text-white/60"}`}
                        >
                          {t(item.labelKey)}
                        </span>
                        <span className="block text-[11px] text-white/35">{t(item.hintKey)}</span>
                      </span>
                      {count > 0 ? (
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#e11d2e] px-1.5 text-[11px] font-bold text-white">
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

        <div className="space-y-2 border-t border-white/10 p-3">
          <Link
            href="/"
            className="flex h-10 items-center justify-center rounded-xl border border-white/12 text-sm font-semibold text-white/70 transition hover:border-white/25 hover:text-white"
          >
            {t("admin.viewSite")}
          </Link>
          <button
            type="button"
            onClick={lockDesk}
            className="flex h-10 w-full items-center justify-center rounded-xl bg-white/5 text-sm font-semibold text-white/80 transition hover:bg-white/10"
          >
            {t("admin.lockDesk")}
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0a]/95 backdrop-blur-md lg:hidden">
        <div className="flex h-14 items-center justify-between gap-3 px-3">
          <BrandLogo size="sm" />
          <div className="flex items-center gap-2">
            <LanguageSwitcher tone="dark" />
            {badges.inbox > 0 ? (
              <span className="rounded-full bg-[#e11d2e] px-2.5 py-1 text-[10px] font-bold text-white">
                {badges.inbox} {t("admin.navInbox")}
              </span>
            ) : null}
            <button
              type="button"
              onClick={lockDesk}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70"
            >
              {t("admin.lock")}
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-3 pb-3">
          {FLAT_NAV.map((item) => {
            const active = section === item.id;
            const count = badgeFor(item.badgeKey);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSection(item.id)}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
                style={
                  active
                    ? { background: "#e11d2e", color: "#fff" }
                    : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }
                }
              >
                {t(item.labelKey)}
                {count > 0 ? ` · ${count}` : ""}
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:pl-[260px]">
        <div className="mx-auto w-full max-w-[1240px] px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
