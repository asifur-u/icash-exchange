"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import type { PublicUser } from "@/lib/users";

const nav = [
  { href: "/account", label: "Home", match: (path: string) => path === "/account" },
  {
    href: "/account/services",
    label: "Buy",
    match: (path: string) => path.startsWith("/account/services"),
  },
  {
    href: "/account/orders",
    label: "Orders",
    match: (path: string) => path.startsWith("/account/orders"),
  },
  {
    href: "/account/payments",
    label: "Payments",
    match: (path: string) => path.startsWith("/account/payments"),
  },
  {
    href: "/account/activity",
    label: "Activity",
    match: (path: string) => path.startsWith("/account/activity"),
  },
  {
    href: "/account/support",
    label: "Help",
    match: (path: string) => path.startsWith("/account/support"),
  },
  {
    href: "/account/profile",
    label: "Profile",
    match: (path: string) => path.startsWith("/account/profile"),
  },
] as const;

export function AccountShell({ user, children }: { user: PublicUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const initial = (user.name.split(" ")[0] || user.name).slice(0, 1).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-28 pt-[calc(5.25rem+env(safe-area-inset-top))] sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="overflow-hidden rounded-[24px] border border-white/[0.09] bg-[#0d0d0d]">
            <div className="border-b border-white/[0.08] px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#1a1a1a] ring-1 ring-white/10">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/75">
                      {initial}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight text-white">
                    {user.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-white/40">{user.email}</p>
                </div>
              </div>
            </div>

            <nav
              className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible lg:p-2.5"
              aria-label="Account"
            >
              {nav.map((item) => {
                const active = item.match(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`shrink-0 rounded-xl px-3 py-2.5 text-sm font-medium transition lg:w-full ${
                      active
                        ? "bg-white text-black shadow-sm"
                        : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-2 border-t border-white/[0.08] p-3">
              <Link
                href="/#desk"
                className="flex h-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Open desk
              </Link>
              <LogoutButton />
            </div>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
