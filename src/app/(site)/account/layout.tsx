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
    <section className="account-light relative min-h-[100dvh] overflow-x-hidden bg-[#f4f5f7] text-zinc-900">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-[radial-gradient(55%_80%_at_10%_0%,rgba(255,45,45,0.08),transparent_60%),radial-gradient(40%_60%_at_90%_0%,rgba(14,165,233,0.06),transparent_55%)] lg:left-[272px] xl:left-[288px]"
      />
      <div className="relative">
        <AccountShell user={user}>{children}</AccountShell>
      </div>
    </section>
  );
}
