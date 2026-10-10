"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import type { PublicUser } from "@/lib/users";

const nav = [
  { href: "/account", label: "Overview", match: (path: string) => path === "/account" },
  {
    href: "/account/services",
    label: "Services",
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
    label: "Support",
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
    <div className="mx-auto w-full max-w-[1280px] px-4 pb-24 pt-[calc(5.5rem+env(safe-area-inset-top))] sm:px-8 sm:pb-24 sm:pt-28 lg:px-10">
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="overflow-hidden rounded-[28px] border border-white/12 bg-[#0a0a0a]">
            <div className="border-b border-white/10 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/15 bg-[#151515]">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base font-semibold text-white/70">
                      {initial}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                  <p className="mt-0.5 truncate text-xs text-white/40">{user.email}</p>
                </div>
              </div>
            </div>

            <nav
              className="flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible lg:p-3"
              aria-label="Account"
            >
              {nav.map((item) => {
                const active = item.match(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`shrink-0 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition lg:w-full ${
                      active
                        ? "bg-white text-black"
                        : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-3">
              <Link
                href="/order/note-1000"
                className="mb-2 flex h-11 items-center justify-center rounded-full bg-[#ff2d2d] text-sm font-semibold text-white transition hover:bg-[#ff4545]"
              >
                Buy a note
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
