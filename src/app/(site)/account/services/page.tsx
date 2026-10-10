import type { Metadata } from "next";
import { AccountServices } from "@/components/account/account-services";
import { getPublicProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services",
  robots: { index: false, follow: false },
};

export default async function AccountServicesPage() {
  const products = await getPublicProducts();
  return <AccountServices products={products} />;
}
