import { AccountOverview } from "@/components/account/account-overview";
import { listOrdersForUser } from "@/lib/orders";
import { getCurrentUser } from "@/lib/session";
import { getPublicProducts } from "@/lib/store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?next=/account");
  const [orders, products] = await Promise.all([listOrdersForUser(user.id), getPublicProducts()]);
  return (
    <AccountOverview
      user={user}
      orders={orders}
      products={products.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        faceValue: p.faceValue,
        price: p.price,
        stock: p.stock,
      }))}
    />
  );
}
