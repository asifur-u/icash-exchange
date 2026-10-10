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
    <section className="relative min-h-[100dvh] overflow-hidden bg-black">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[22rem] bg-[radial-gradient(70%_80%_at_12%_0%,rgba(255,45,45,0.16),transparent_55%),radial-gradient(45%_55%_at_90%_0%,rgba(255,255,255,0.04),transparent_50%)]"
      />
      <div className="relative">
        <AccountShell user={user}>{children}</AccountShell>
      </div>
    </section>
  );
}
