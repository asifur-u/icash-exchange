import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountDashboard } from "@/components/account-dashboard";
import { Frame } from "@/components/frame";
import { listOrdersForUser } from "@/lib/orders";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?next=/account");
  const orders = await listOrdersForUser(user.id);

  return (
    <section className="bg-black pb-16 pt-[calc(5.5rem+env(safe-area-inset-top))] sm:pb-24 sm:pt-32">
      <Frame>
        <AccountDashboard user={user} orders={orders} />
      </Frame>
    </section>
  );
}
