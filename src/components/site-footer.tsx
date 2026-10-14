import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Frame } from "@/components/frame";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <Frame className="flex flex-col gap-8 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-end sm:justify-between sm:py-14">
        <div>
          <BrandLogo size="lg" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Digital voucher desk. Choose a note, pay, and read the code on your order page.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/70 sm:gap-x-6">
          <Link href="/catalog" className="hover:text-white">
            Catalog
          </Link>
          <Link href="/explore" className="hover:text-white">
            Explore
          </Link>
          <Link href="/faq" className="hover:text-white">
            FAQ
          </Link>
          <Link href="/legal/terms" className="hover:text-white">
            Terms
          </Link>
          <Link href="/legal/privacy" className="hover:text-white">
            Privacy
          </Link>
        </div>
      </Frame>
    </footer>
  );
}
