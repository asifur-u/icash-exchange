"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Frame } from "@/components/frame";

const links = [
  { href: "/catalog", label: "Catalog" },
  { href: "/order/note-1000", label: "Buy" },
  { href: "/faq", label: "FAQ" },
];

function isActive(pathname: string, href: string) {
  if (href === "/catalog") return pathname.startsWith("/catalog");
  if (href === "/order/note-1000") {
    return pathname.startsWith("/order") || pathname.startsWith("/checkout") || pathname.startsWith("/pay");
  }
  if (href === "/faq") return pathname.startsWith("/faq");
  return false;
}

export function SiteHeader({ initialLoggedIn = false }: { initialLoggedIn?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    setLoggedIn(initialLoggedIn);
  }, [initialLoggedIn]);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => {
        if (alive) setLoggedIn(Boolean(data.user));
      })
      .catch(() => {
        if (alive) setLoggedIn(false);
      });
    return () => {
      alive = false;
    };
  }, [pathname]);

  const accountHref = loggedIn ? "/account" : "/auth?next=/account";
  const accountLabel = loggedIn ? "Dashboard" : "Log in";

  return (
    <header className="absolute inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>
      <Frame className="flex h-16 items-center justify-between gap-3 sm:h-20 md:h-24 md:gap-6">
        <Link href="/" aria-label="iCash Exchange home" className="relative z-10 min-w-0 transition hover:opacity-90">
          <BrandLogo priority size="md" />
        </Link>

        <nav className="hidden items-center gap-10 text-base text-white/70 md:flex">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`transition hover:text-white ${active ? "font-semibold text-white" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href={accountHref}
            aria-current={
              pathname.startsWith("/account") || pathname.startsWith("/auth") ? "page" : undefined
            }
            className={`transition hover:text-white ${
              pathname.startsWith("/account") || pathname.startsWith("/auth")
                ? "font-semibold text-white"
                : ""
            }`}
          >
            {accountLabel}
          </Link>
        </nav>

        <Link
          href={loggedIn ? "/order/note-1000" : "/auth?next=/account"}
          className="hidden h-12 items-center rounded-full bg-white px-6 text-sm font-medium tracking-tight text-black transition hover:bg-white/85 md:inline-flex"
        >
          {loggedIn ? "Buy a note" : "Get a code"}
        </Link>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10 md:hidden"
        >
          <span className="sr-only">Menu</span>
          <span aria-hidden="true" className="relative block h-3.5 w-4">
            <span
              className={`absolute left-0 top-0 block h-0.5 w-full bg-white transition ${open ? "top-1.5 rotate-45" : ""}`}
            />
            <span
              className={`absolute left-0 top-1.5 block h-0.5 w-full bg-white transition ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`absolute left-0 top-3 block h-0.5 w-full bg-white transition ${open ? "top-1.5 -rotate-45" : ""}`}
            />
          </span>
        </button>
      </Frame>

      {open ? (
        <div className="fixed inset-0 z-30 bg-black/95 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[calc(4.5rem+env(safe-area-inset-top))] md:hidden">
          <nav className="mx-auto flex max-w-lg flex-col gap-2">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`rounded-2xl border px-5 py-4 text-lg transition ${
                    active
                      ? "border-white bg-white text-black"
                      : "border-white/10 bg-white/[0.03] text-white/90 hover:border-white/25"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href={accountHref}
              onClick={() => setOpen(false)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-lg text-white/90"
            >
              {accountLabel}
            </Link>
            <Link
              href={loggedIn ? "/order/note-1000" : "/auth?next=/account"}
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex h-14 items-center justify-center rounded-full bg-white text-base font-medium text-black"
            >
              {loggedIn ? "Buy a note" : "Get a code"}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
