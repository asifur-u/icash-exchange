import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Frame } from "@/components/frame";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <Frame className="flex flex-col gap-8 py-14 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <BrandLogo size="lg" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Digital voucher desk. Choose a note, pay, and read the code on your order page.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/70">
          <Link href="/catalog" className="hover:text-white">
            Catalog
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
          <Link href="/admin" className="hover:text-white">
            Owner desk
          </Link>
        </div>
      </Frame>
    </footer>
  );
}
