import type { Metadata } from "next";
import { Frame } from "@/components/frame";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Draft privacy note for the iCash Exchange demonstration desk.",
};

export default function PrivacyPage() {
  return (
    <Frame className="max-w-3xl py-16 md:py-24">
      <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Draft</p>
      <h1 className="mt-4 display text-5xl">Privacy</h1>
      <div className="mt-8 space-y-5 text-base leading-relaxed text-muted">
        <p>This page is a draft. Have a lawyer review it before you collect real customer data.</p>
        <p>
          The desk stores the email you enter, an optional mobile number, the order, and the voucher code. The code is encrypted. It is shown to the buyer on the signed order link, and sent by email or SMS only when those providers are configured.
        </p>
        <p>Codes are not written to logs, analytics, or error reports. Owner actions such as uploads and refunds are kept in an audit list without the code itself.</p>
      </div>
    </Frame>
  );
}
