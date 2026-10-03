import type { Metadata } from "next";
import { Frame } from "@/components/frame";

export const metadata: Metadata = {
  title: "Terms",
  description: "Draft terms for the iCash Exchange demonstration desk.",
};

export default function TermsPage() {
  return (
    <Frame className="max-w-3xl py-16 md:py-24">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Draft</p>
      <h1 className="mt-4 display text-5xl">Terms of sale</h1>
      <div className="mt-8 space-y-5 text-base leading-relaxed text-muted">
        <p>
          This page is a draft for a demonstration store. Have a lawyer in Bangladesh review it before any real sale.
        </p>
        <p>
          Sample codes on this desk have no cash value. A live voucher is sold only after you hold a written right to resell it.
        </p>
        <p>
          Payment is confirmed by a verified gateway webhook, or by a server-side lookup. Landing on a success page does not mark an order paid.
        </p>
        <p>
          A code that has been shown to the buyer is voided if the order is refunded. It is not returned to stock. Write the refund rule before launch. Digital codes are hard to take back.
        </p>
      </div>
    </Frame>
  );
}
