import type { Metadata } from "next";
import { DeskPaths } from "@/components/desk-paths";
import { Frame } from "@/components/frame";
import { HomeDesk } from "@/components/home-desk";
import { depositAccounts } from "@/lib/deposit";
import { getPublicProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "iCash Exchange" },
  description: "Buy a digital note on iCash Exchange. Pay, then read the code on your order page.",
};

export default async function HomePage() {
  const products = await getPublicProducts();

  return (
    <>
      <section className="relative overflow-x-clip bg-black pb-16 pt-[calc(5.5rem+env(safe-area-inset-top))] sm:pb-20 sm:pt-28 md:pt-32">
        <Frame>
          <HomeDesk products={products} deposits={depositAccounts()} />
        </Frame>
      </section>
      <DeskPaths />
    </>
  );
}
