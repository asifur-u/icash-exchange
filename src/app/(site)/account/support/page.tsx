import type { Metadata } from "next";
import { AccountSupport } from "@/components/account/account-support";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support",
  robots: { index: false, follow: false },
};

export default function AccountSupportPage() {
  return <AccountSupport />;
}
