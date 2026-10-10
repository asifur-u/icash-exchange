import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountPayments } from "@/components/account/account-payments";
import { listOrdersForUser } from "@/lib/orders";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payments",
  robots: { index: false, follow: false },
};

export default async function AccountPaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?next=/account/payments");
  const orders = await listOrdersForUser(user.id);
  return <AccountPayments orders={orders} />;
}
