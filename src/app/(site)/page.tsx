import type { Metadata } from "next";
import { Hero } from "@/components/hero";
import { HomeFaq } from "@/components/home-faq";
import { HomeWhy } from "@/components/home-why";
import { Platforms } from "@/components/platforms";
import { VoucherShowcase } from "@/components/voucher-showcase";
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
      <Hero />
      <VoucherShowcase products={products} />
      <Platforms />
      <HomeWhy />
      <HomeFaq />
    </>
  );
}
