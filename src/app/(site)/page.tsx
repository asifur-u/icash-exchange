import type { Metadata } from "next";
import { BuyDesk } from "@/components/buy-desk";
import { DeskPaths } from "@/components/desk-paths";
import { Frame } from "@/components/frame";
import { Hero } from "@/components/hero";
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
      <section className="relative overflow-x-clip bg-black pb-16 pt-[calc(5.5rem+env(safe-area-inset-top))] sm:pb-20 sm:pt-32 md:pt-36">
        <Frame>
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(300px,440px)] lg:gap-14">
            <Hero bare />
            <BuyDesk products={products} deposits={depositAccounts()} embedded />
          </div>
        </Frame>
      </section>
      <DeskPaths />
    </>
  );
}
