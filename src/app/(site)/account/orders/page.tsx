import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountOrders } from "@/components/account/account-orders";
import { listOrdersForUser } from "@/lib/orders";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export default async function AccountOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?next=/account/orders");
  const orders = await listOrdersForUser(user.id);
  return <AccountOrders orders={orders} />;
}
