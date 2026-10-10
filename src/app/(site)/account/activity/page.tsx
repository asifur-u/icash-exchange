import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountActivity } from "@/components/account/account-activity";
import { listOrdersForUser } from "@/lib/orders";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Activity",
  robots: { index: false, follow: false },
};

export default async function AccountActivityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?next=/account/activity");
  const orders = await listOrdersForUser(user.id);
  return <AccountActivity orders={orders} />;
}
