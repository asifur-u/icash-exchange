import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/account/account-shell";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?next=/account");

  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-[#080808]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[18rem] bg-[radial-gradient(60%_70%_at_10%_0%,rgba(255,255,255,0.05),transparent_55%)]"
      />
      <div className="relative">
        <AccountShell user={user}>{children}</AccountShell>
      </div>
    </section>
  );
}
