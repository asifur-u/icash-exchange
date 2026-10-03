import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Frame } from "@/components/frame";

const links = [
  { href: "/catalog", label: "Catalog" },
  { href: "/#desk", label: "Buy" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>
      <Frame className="flex h-20 items-center justify-between gap-6">
        <Link href="/" aria-label="iCash Exchange home" className="relative z-10 transition hover:opacity-90">
          <BrandLogo priority size="md" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/#desk"
          className="hidden h-10 items-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/85 sm:inline-flex"
        >
          Get a code
        </Link>
        <details className="relative md:hidden">
          <summary className="cursor-pointer text-[11px] uppercase tracking-[0.18em] text-white">Menu</summary>
          <div className="absolute right-0 z-20 mt-3 w-44 border border-white/10 bg-black p-4">
            <div className="flex flex-col gap-3 text-sm">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="text-white/80 hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </details>
      </Frame>
    </header>
  );
}
