import { AccountOverview } from "@/components/account/account-overview";
import { listOrdersForUser } from "@/lib/orders";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?next=/account");
  const orders = await listOrdersForUser(user.id);
  return <AccountOverview user={user} orders={orders} />;
}
